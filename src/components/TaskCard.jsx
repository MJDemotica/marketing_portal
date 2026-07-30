import { ExternalLink, MoreVertical, Trash2, Edit3, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { formatTimeAgo } from '../hooks/useTasksData'

const priorityStyles = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-500/30',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-300 border-slate-200 dark:border-slate-600',
}

export default function TaskCard({ task, profilesMap, onClick, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)

  const assignee = task.assignee_id ? profilesMap[task.assignee_id] : null
  const requestor = task.requestor_id ? profilesMap[task.requestor_id] : null

  const assigneeName = assignee ? assignee.display_name : 'Unassigned'
  const requestorName = requestor ? requestor.display_name : 'Department Request'

  const assigneeInitials = assigneeName
    ? assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  const timeAgo = formatTimeAgo(task.created_at)

  const formatDate = (dStr) => {
    if (!dStr) return null
    return new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-navy-700 rounded-xl p-4 border border-surface-200 dark:border-navy-600 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer"
    >
      {/* Top row: Priority Pill + Task Code + Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Priority pill */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              priorityStyles[task.priority] || priorityStyles.normal
            }`}
          >
            {task.priority || 'NORMAL'}
          </span>

          {/* Task Code */}
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
            {task.task_code}
            <ExternalLink size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          </span>
        </div>

        {/* Action menu button */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
            aria-label="Task options"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 z-20 w-36 bg-white dark:bg-navy-800 rounded-lg shadow-lg border border-surface-200 dark:border-navy-600 py-1 text-xs">
              <button
                onClick={() => {
                  setShowMenu(false)
                  onEdit?.(task)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
              >
                <Edit3 size={14} />
                Edit Task
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  onDelete?.(task.id)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-snug mb-1 line-clamp-2">
        {task.title}
      </h3>

      {/* Department • Requestor */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        {task.department || 'Marketing'} • Requested by <span className="text-slate-600 dark:text-slate-300 font-medium">{requestorName}</span>
      </p>

      {/* Assignee row */}
      <div className="flex items-center gap-2 mb-3 bg-surface-50 dark:bg-navy-800/60 rounded-lg px-2.5 py-1.5 border border-surface-100 dark:border-navy-600/50">
        <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-400/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {assignee?.avatar_url ? (
            <img src={assignee.avatar_url} alt={assigneeName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-300">
              {assigneeInitials}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
          Assigned to: {assigneeName}
        </span>
      </div>

      {/* Footer row: Due date + Time ago + Revision count */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-surface-100 dark:border-navy-600/60">
        {/* Due date pill */}
        {task.due_date ? (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              isOverdue
                ? 'text-red-500 dark:text-red-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {isOverdue && <AlertCircle size={12} />}
            Due {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="italic text-slate-400 dark:text-slate-500">No due date</span>
        )}

        <div className="flex items-center gap-3">
          {/* Time ago */}
          <span className="inline-flex items-center gap-1 text-[11px]">
            <Clock size={11} />
            {timeAgo}
          </span>

          {/* Revisions badge */}
          <span className="px-1.5 py-0.5 rounded bg-surface-200 dark:bg-navy-600 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {task.revision_count || 0} revs
          </span>
        </div>
      </div>
    </div>
  )
}
