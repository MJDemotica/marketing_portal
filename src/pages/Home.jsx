import { useState } from 'react'
import {
  Users,
  CalendarClock,
  AlertTriangle,
  GitPullRequestArrow,
  FileDown,
  Plus,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAuth } from '../contexts/AuthContext'
import CreateTaskModal from '../components/CreateTaskModal'

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
  const { isSupervisor } = useAuth()
  const { tasks, loading, error, refetch, summary, bottlenecks, supervisorFocus, memberStats } = useDashboardData()
  const [showCreateModal, setShowCreateModal] = useState(false)

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

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />
    </div>
  )
}
