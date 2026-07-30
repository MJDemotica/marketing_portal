import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Get the start and end of the current week (Monday–Sunday)
function getCurrentWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

function formatDateShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function useDashboardData() {
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all tasks
      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (taskErr) throw taskErr

      // Fetch all profiles in department
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', 'Marketing')
        .order('display_name')

      if (profileErr) throw profileErr

      setTasks(taskData || [])
      setProfiles(profileData || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---- Computed stats ----
  const now = new Date()
  const { monday, sunday } = getCurrentWeekRange()
  const weekLabel = `${formatDateShort(monday)} – ${formatDateShort(sunday)}`

  const activeStatuses = ['assigned', 'in_progress', 'for_review', 'revision']
  const activeTasks = tasks.filter(t => activeStatuses.includes(t.status))

  const dueThisWeek = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false
    const d = new Date(t.due_date)
    return d >= monday && d <= sunday
  })

  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false
    return new Date(t.due_date) < now
  })

  const reviewBottlenecks = tasks.filter(t =>
    t.status === 'for_review' || t.status === 'revision'
  )

  const unassignedActive = tasks.filter(t =>
    !t.assignee_id && t.status !== 'completed'
  )

  // ---- Per-member stats ----
  const memberStats = profiles.map(profile => {
    const memberTasks = tasks.filter(t => t.assignee_id === profile.id)
    const memberActive = memberTasks.filter(t => activeStatuses.includes(t.status))
    const memberDueThisWeek = memberTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      const d = new Date(t.due_date)
      return d >= monday && d <= sunday
    })
    const memberOverdue = memberTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < now
    })
    const memberBottlenecks = memberTasks.filter(t =>
      t.status === 'for_review' || t.status === 'revision'
    )

    const totalRevisions = memberTasks.reduce((sum, t) => sum + (t.revision_count || 0), 0)
    const completedCount = memberTasks.filter(t => t.status === 'completed').length
    const avgRevisions = completedCount > 0
      ? (totalRevisions / completedCount).toFixed(1)
      : memberTasks.length > 0
        ? (totalRevisions / memberTasks.length).toFixed(1)
        : '0'

    const statuses = {
      assigned: memberTasks.filter(t => t.status === 'assigned').length,
      inProgress: memberTasks.filter(t => t.status === 'in_progress').length,
      review: memberTasks.filter(t => t.status === 'for_review').length,
      revisions: memberTasks.filter(t => t.status === 'revision').length,
    }

    // Next due task
    const upcomingTasks = memberTasks
      .filter(t => t.due_date && t.status !== 'completed')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    const nextDue = upcomingTasks[0] || null

    const initials = profile.display_name
      ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : '??'

    return {
      id: profile.id,
      name: profile.display_name,
      email: profile.email,
      initials,
      active: memberActive.length,
      dueThisWeek: memberDueThisWeek.length,
      overdue: memberOverdue.length,
      bottlenecks: memberBottlenecks.length,
      avgRevisions: parseFloat(avgRevisions),
      statuses,
      nextDue: nextDue ? {
        title: nextDue.title,
        date: formatDateShort(new Date(nextDue.due_date)),
      } : null,
    }
  })

  // ---- Supervisor Focus ----
  const highestWorkload = memberStats.length > 0
    ? memberStats.reduce((max, m) => m.active > max.active ? m : max, memberStats[0])
    : null
  const mostOverdue = memberStats.length > 0
    ? memberStats.reduce((max, m) => m.overdue > max.overdue ? m : max, memberStats[0])
    : null
  const mostReviewPressure = memberStats.length > 0
    ? memberStats.reduce((max, m) => m.bottlenecks > max.bottlenecks ? m : max, memberStats[0])
    : null

  return {
    tasks,
    profiles,
    loading,
    error,
    refetch: fetchData,
    summary: {
      activeWorkload: activeTasks.length,
      dueThisWeek: dueThisWeek.length,
      overdue: overdueTasks.length,
      reviewBottlenecks: reviewBottlenecks.length,
      weekLabel,
    },
    bottlenecks: {
      forReview: tasks.filter(t => t.status === 'for_review').length,
      revisionNeeded: tasks.filter(t => t.status === 'revision').length,
      unassignedActive: unassignedActive.length,
    },
    supervisorFocus: {
      highestWorkload: highestWorkload?.active > 0 ? highestWorkload.name : 'N/A',
      mostOverdue: mostOverdue?.overdue > 0 ? mostOverdue.name : 'N/A',
      mostReviewPressure: mostReviewPressure?.bottlenecks > 0 ? mostReviewPressure.name : 'N/A',
    },
    memberStats,
  }
}
