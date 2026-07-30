import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Helper: Format relative time since creation (e.g. "341h ago", "2d ago", "5m ago")
export function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const created = new Date(dateString)
  const diffMs = now - created
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`
  if (diffHours < 48) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function useTasksData() {
  const { profile, isSupervisor } = useAuth()
  const [tasks, setTasks] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [profilesList, setProfilesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch profiles in Marketing department for assignee/requestor lookup
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('*')

      if (profErr) console.warn('Could not load profiles:', profErr)

      const map = {}
      if (profs) {
        profs.forEach(p => {
          map[p.id] = p
        })
        setProfilesMap(map)
        setProfilesList(profs)
      }

      // 2. Fetch tasks query
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

      // Members only see tasks assigned to them; Supervisors see all department tasks
      if (!isSupervisor && profile?.id) {
        query = query.eq('assignee_id', profile.id)
      }

      const { data, error: taskErr } = await query
      if (taskErr) throw taskErr

      setTasks(data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, isSupervisor])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      const isRevision = newStatus === 'revision'
      const revisionCount = isRevision ? (task?.revision_count || 0) + 1 : (task?.revision_count || 0)

      const { error: updateErr } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          revision_count: revisionCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (updateErr) throw updateErr

      await fetchTasks()
      return true
    } catch (err) {
      console.error('Error updating task status:', err)
      throw err
    }
  }

  // Update task details
  const updateTask = async (taskId, updates) => {
    try {
      const { error: updateErr } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (updateErr) throw updateErr

      await fetchTasks()
      return true
    } catch (err) {
      console.error('Error updating task:', err)
      throw err
    }
  }

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const { error: delErr } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (delErr) throw delErr

      await fetchTasks()
      return true
    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    }
  }

  return {
    tasks,
    profilesMap,
    profilesList,
    loading,
    error,
    refetch: fetchTasks,
    updateTaskStatus,
    updateTask,
    deleteTask,
  }
}
