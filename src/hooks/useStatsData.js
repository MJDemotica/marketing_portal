import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useStatsData() {
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Load tasks
      const { data: taskData, error: tErr } = await supabase
        .from('tasks')
        .select('*')

      if (tErr) throw tErr

      // 2. Load team profiles
      const { data: profData, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', 'Marketing')
        .order('display_name')

      if (pErr) throw pErr

      // 3. Load departments
      const { data: deptData, error: dErr } = await supabase
        .from('departments')
        .select('*')

      if (dErr) throw dErr

      setTasks(taskData || [])
      setProfiles(profData || [])
      setDepartments(deptData || [])
    } catch (err) {
      console.error('Error loading stats data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---- Computations ----
  const now = new Date()

  // Summary Stat 1: Total Requests
  const totalRequests = tasks.length

  // Summary Stat 2: Completed
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  // Summary Stat 3: In Progress (show em-dash "—" when zero)
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const inProgressValue = inProgressCount > 0 ? String(inProgressCount) : '—'

  // Summary Stat 4: Overdue (show em-dash "—" when zero)
  const overdueCount = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
  ).length
  const overdueValue = overdueCount > 0 ? String(overdueCount) : '—'

  // Active statuses for workload
  const activeStatuses = ['assigned', 'in_progress', 'for_review', 'revision']

  // ---- Chart Data 1: Avg. Revisions per Project (by Member) ----
  const avgRevisionsChart = profiles.map((p) => {
    const pTasks = tasks.filter((t) => t.assignee_id === p.id)
    const totalRevs = pTasks.reduce((sum, t) => sum + (t.revision_count || 0), 0)
    const completedPTasks = pTasks.filter((t) => t.status === 'completed')
    const count = completedPTasks.length > 0 ? completedPTasks.length : pTasks.length
    const avg = count > 0 ? parseFloat((totalRevs / count).toFixed(1)) : 0

    return {
      name: p.display_name,
      avgRevisions: avg,
    }
  })

  // ---- Chart Data 2: Active Tasks per Member (Workload) ----
  const memberWorkloadChart = profiles.map((p) => {
    const activeTasks = tasks.filter(
      (t) => t.assignee_id === p.id && activeStatuses.includes(t.status)
    ).length

    return {
      name: p.display_name,
      activeTasks,
    }
  })

  // ---- Chart Data 3: Requests by Department ----
  const deptCounts = {}
  tasks.forEach((t) => {
    const dName = t.department || 'Marketing'
    deptCounts[dName] = (deptCounts[dName] || 0) + 1
  })

  const deptChartData = Object.entries(deptCounts).map(([name, value]) => ({
    name: `${name} (${value})`,
    rawName: name,
    value,
  }))

  // ---- Chart Data 4: Completed Projects by Member ----
  const completedProjectsChart = profiles.map((p) => {
    const completedTasks = tasks.filter(
      (t) => t.assignee_id === p.id && t.status === 'completed'
    ).length

    return {
      name: p.display_name,
      completedTasks,
    }
  })

  return {
    loading,
    error,
    refetch: fetchData,
    tasks,
    profiles,
    summary: {
      totalRequests,
      completed: completedCount,
      inProgress: inProgressValue,
      overdue: overdueValue,
    },
    charts: {
      avgRevisions: avgRevisionsChart,
      workload: memberWorkloadChart,
      requestsByDept: deptChartData,
      completedProjects: completedProjectsChart,
    },
  }
}
