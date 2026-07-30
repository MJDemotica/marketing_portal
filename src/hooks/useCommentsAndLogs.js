import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useCommentsAndLogs(taskId) {
  const { profile } = useAuth()
  const [comments, setComments] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!taskId) return
    setLoading(true)

    try {
      // 1. Fetch comments for task
      const { data: commentsData, error: commentsErr } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (commentsErr) throw commentsErr

      // 2. Fetch activity logs for task
      const { data: logsData, error: logsErr } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      if (logsErr) throw logsErr

      setComments(commentsData || [])
      setActivityLogs(logsData || [])
    } catch (err) {
      console.error('Error fetching comments/logs:', err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Add comment
  const addComment = async (body) => {
    if (!taskId || !profile?.id || !body.trim()) return null

    try {
      const { data: newComment, error: cErr } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: profile.id,
          body: body.trim(),
        })
        .select()
        .single()

      if (cErr) throw cErr

      // Log activity
      await supabase.from('activity_logs').insert({
        task_id: taskId,
        user_id: profile.id,
        action: 'comment_added',
        details: { body: body.trim().slice(0, 50) },
      })

      await fetchData()
      return newComment
    } catch (err) {
      console.error('Error adding comment:', err)
      throw err
    }
  }

  // Log activity helper
  const logActivity = async (action, details = {}) => {
    if (!taskId || !profile?.id) return
    try {
      await supabase.from('activity_logs').insert({
        task_id: taskId,
        user_id: profile.id,
        action,
        details,
      })
      await fetchData()
    } catch (err) {
      console.error('Error logging activity:', err)
    }
  }

  return {
    comments,
    activityLogs,
    loading,
    refetch: fetchData,
    addComment,
    logActivity,
  }
}
