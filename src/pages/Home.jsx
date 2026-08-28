import { useState, useMemo } from 'react'
import {
  Users,
  CalendarClock,
  AlertTriangle,
  GitPullRequestArrow,
  FileDown,
  Plus,
  Loader2,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAuth } from '../contexts/AuthContext'
import { formatTimeAgo } from '../hooks/useTasksData'
import CreateTaskModal from '../components/CreateTaskModal'
import DepartmentRequestModal from '../components/DepartmentRequestModal'
import TaskDetailModal from '../components/TaskDetailModal'

const statusColors = {
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  inProgress: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  revisions: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

const statusLabels = {
  assigned: 'Assigned',
  inProgress: 'In Progress',
  review: 'Review',
  revisions: 'Revisions',
}

export default function Home() {
  const { profile, isSupervisor } = useAuth()
  const isDepartmentAccount = profile?.department && profile?.department !== 'Marketing'
  const { tasks, profiles, loading, error, refetch, summary, bottlenecks, supervisorFocus, memberStats } = useDashboardData()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // If this is a Department account (e.g. Accounting, HR, Corporate, Litigation, Operations),
  // render the dedicated Department Services Dashboard
  if (isDepartmentAccount) {
    return (
      <DepartmentHomeDashboard
        tasks={tasks}
        profiles={profiles}
        loading={loading}
        error={error}
        refetch={refetch}
        profile={profile}
      />
    )
  }

  // Build summary cards from real data
  const summaryCards = [
    {
      label: 'Active Workload',
      value: summary.activeWorkload,
      sub: 'Tasks assigned, in progress, or in review',
      icon: Users,
      color: 'text-brand-500',
      bg: 'bg-brand-50 dark:bg-brand-500/10',
    },
    {
      label: 'Due This Week',
      value: summary.dueThisWeek,
      sub: summary.weekLabel,
      icon: CalendarClock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      sub: 'Open tasks past due date',
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
    {
      label: 'Review Bottlenecks',
      value: summary.reviewBottlenecks,
      sub: 'Waiting on review or revision',
      icon: GitPullRequestArrow,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
    },
  ]

  // Export CSV
  function handleExportCSV() {
    if (!tasks.length) return

    const headers = ['Task Code', 'Title', 'Status', 'Priority', 'Department', 'Due Date', 'Revisions', 'Created']
    const rows = tasks.map(t => [
      t.task_code,
      `"${t.title}"`,
      t.status,
      t.priority,
      t.department,
      t.due_date || '',
      t.revision_count,
      new Date(t.created_at).toLocaleDateString(),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marketing-tasks-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-3">Error loading dashboard: {error}</p>
          <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Marketing Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage team workload and track performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!tasks.length}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            <FileDown size={16} />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create New Task
          </button>
        </div>
      </div>

      {/* Capacity and Risk summary cards */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-3">
          Capacity and Risk
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${card.label === 'Overdue' && card.value > 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${card.bg}`}>
                    <Icon size={20} className={card.color} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {card.sub}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Team section */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Team member cards */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-3">
            Team Members
          </p>
          {memberStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {memberStats.map((member) => (
                <div key={member.id} className="card p-5">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-500 dark:text-brand-400 font-semibold text-sm">
                        {member.initials}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {member.active} ACTIVE • {member.dueThisWeek} DUE THIS WEEK
                      </p>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Overdue </span>
                      <span className={`font-semibold ${member.overdue > 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {member.overdue}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Bottlenecks </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{member.bottlenecks}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Avg. Rev. </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{member.avgRevisions}</span>
                    </div>
                  </div>

                  {/* Status pills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(member.statuses)
                      .filter(([key, val]) => isSupervisor || key !== 'review' || val > 0)
                      .map(([key, val]) => (
                        <span key={key} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[key]}`}>
                          {statusLabels[key]} {val}
                        </span>
                      ))}
                  </div>

                  {/* Next due task */}
                  <div className="bg-surface-50 dark:bg-navy-900/50 rounded-lg px-3 py-2.5 border border-surface-200 dark:border-navy-600">
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-400 dark:text-slate-500 mb-1">
                      Next Due Task
                    </p>
                    {member.nextDue ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate mr-2">
                          {member.nextDue.title}
                        </p>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {member.nextDue.date}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                        No tasks due this week.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <Users size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No team members found. Add users to see workload cards.
              </p>
            </div>
          )}
        </div>

        {/* Team Bottlenecks panel */}
        <div className="xl:w-72 flex-shrink-0">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-3">
            Team Bottlenecks
          </p>
          <div className="card p-5 space-y-4">
            {/* Bottleneck counts */}
            <div className="space-y-3">
              {[
                { label: 'For Review', value: bottlenecks.forReview, color: 'text-purple-500' },
                { label: 'Revision Needed', value: bottlenecks.revisionNeeded, color: 'text-red-500' },
                { label: 'Unassigned Active', value: bottlenecks.unassignedActive, color: 'text-amber-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                  <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-surface-200 dark:border-navy-600" />

            {/* Supervisor Focus */}
            <div className="bg-brand-50 dark:bg-brand-500/10 rounded-lg p-4 border border-brand-100 dark:border-brand-500/20">
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-brand-600 dark:text-brand-300 mb-3">
                Supervisor Focus
              </p>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Highest Workload</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {supervisorFocus.highestWorkload}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Most Overdue</p>
                  <p className={`text-sm font-semibold ${supervisorFocus.mostOverdue !== 'N/A' ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                    {supervisorFocus.mostOverdue}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Most Review Pressure</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {supervisorFocus.mostReviewPressure}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal (Marketing Internal) */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />
    </div>
  )
}

// ============================================================
// Dedicated Department Account Dashboard Component
// (For Accounting, Corporate, HR, Litigation, Operations)
// ============================================================
function DepartmentHomeDashboard({ tasks, profiles, loading, error, refetch, profile }) {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const deptName = profile?.department || 'Department'

  // Map profiles for assignee lookups
  const profilesMap = useMemo(() => {
    const map = {}
    if (profiles) profiles.forEach(p => (map[p.id] = p))
    return map
  }, [profiles])

  // Filter department's requests
  const deptTasks = useMemo(() => {
    return tasks.filter(t => t.department === deptName || t.requestor_id === profile?.id)
  }, [tasks, deptName, profile?.id])

  // Computed summary metrics
  const totalRequests = deptTasks.length
  const pendingReview = deptTasks.filter(t => t.status === 'pending' || t.status === 'pending_supervisor_review' || t.status === 'submitted_by_department').length
  const inProgress = deptTasks.filter(t => ['assigned', 'in_progress', 'revision', 'for_review'].includes(t.status)).length
  const completed = deptTasks.filter(t => t.status === 'completed').length
  const declined = deptTasks.filter(t => t.status === 'disapproved').length

  const filteredTasks = useMemo(() => {
    return deptTasks.filter(task => {
      // Filter pill
      if (activeFilter === 'pending') {
        if (!['pending', 'pending_supervisor_review', 'submitted_by_department'].includes(task.status)) return false
      } else if (activeFilter === 'in_progress') {
        if (!['assigned', 'in_progress', 'for_review'].includes(task.status)) return false
      } else if (activeFilter === 'revision') {
        if (task.status !== 'revision') return false
      } else if (activeFilter === 'completed') {
        if (task.status !== 'completed') return false
      } else if (activeFilter === 'declined') {
        if (task.status !== 'disapproved') return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = task.title?.toLowerCase().includes(q)
        const codeMatch = task.task_code?.toLowerCase().includes(q)
        const descMatch = task.description?.toLowerCase().includes(q)
        return titleMatch || codeMatch || descMatch
      }

      return true
    })
  }, [deptTasks, activeFilter, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading department requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-3">Error loading requests: {error}</p>
          <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs">
              {deptName} Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            Marketing Service Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Submit marketing requests, track creative deliverables, and collaborate with the Marketing team.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Request a Task
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Requests</p>
              <p className="text-3xl font-bold mt-1 text-slate-800 dark:text-white">{totalRequests}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-500">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">All submitted requests</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Awaiting Review</p>
              <p className={`text-3xl font-bold mt-1 ${pendingReview > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>
                {pendingReview}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Pending supervisor feasibility</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{inProgress}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <Users size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Active design & production</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
              <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{completed}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Finished deliverables</p>
        </div>
      </div>

      {/* Requests Section */}
      <div className="card p-6 space-y-4">
        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-200 dark:border-navy-600">
          <div className="relative sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search my requests..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'revision', label: 'Revision Needed' },
              { id: 'completed', label: 'Completed' },
              { id: 'declined', label: 'Declined' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeFilter === f.id
                    ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-500/20 dark:border-brand-500/40 dark:text-brand-300'
                    : 'bg-white border-surface-300 text-slate-500 dark:bg-navy-800 dark:border-navy-600 dark:text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const assignee = task.assignee_id ? profilesMap[task.assignee_id] : null
              const isPending = ['pending', 'pending_supervisor_review', 'submitted_by_department'].includes(task.status)

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="p-4 rounded-xl border border-surface-200 dark:border-navy-600 hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-md transition-all bg-surface-50/50 dark:bg-navy-800/40 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-500/20">
                        {task.task_code}
                      </span>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          <Clock size={12} />
                          Awaiting Supervisor Review
                        </span>
                      )}
                      {task.status === 'assigned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                          Assigned to Marketing
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">
                          In Progress
                        </span>
                      )}
                      {task.status === 'for_review' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">
                          In Review
                        </span>
                      )}
                      {task.status === 'revision' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300">
                          Revision Needed
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
                          <CheckCircle2 size={12} />
                          Completed
                        </span>
                      )}
                      {task.status === 'disapproved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300">
                          Declined
                        </span>
                      )}

                      {/* Priority */}
                      <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        {task.priority || 'Normal'} Priority
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Decline reason callout */}
                    {task.status === 'disapproved' && task.decline_reason && (
                      <div className="flex items-start gap-2 mt-1 p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                        <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">Decline Reason</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">{task.decline_reason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                    <div className="text-right">
                      <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 font-medium text-xs mt-0.5">
                        {assignee ? `Marketer: ${assignee.display_name}` : 'Pending assignment'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 dark:border-navy-600 hover:bg-surface-100 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
                    >
                      <MessageSquare size={13} className="text-brand-500" />
                      View & Discuss
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <FileText size={36} className="text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No requests found in this category
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Need marketing deliverables, graphics, or campaign assets? Click the button below to submit a new request.
            </p>
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus size={14} />
              Submit First Request
            </button>
          </div>
        )}
      </div>

      {/* Department Request Modal */}
      <DepartmentRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onCreated={refetch}
      />

      {/* Task Detail Modal (For comments & discussion) */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          profilesList={profiles}
          profilesMap={profilesMap}
          onUpdate={async (id, updates) => {
            const { error: updErr } = await supabase.from('tasks').update(updates).eq('id', id)
            if (updErr) throw updErr
            refetch()
          }}
          onDelete={async (id) => {
            const { error: delErr } = await supabase.from('tasks').delete().eq('id', id)
            if (delErr) throw delErr
            refetch()
          }}
        />
      )}
    </div>
  )
}
