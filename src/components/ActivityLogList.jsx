import { Activity, UserCheck, MessageSquare, CheckCircle, RefreshCw, PlusCircle, AlertCircle } from 'lucide-react'
import { formatTimeAgo } from '../hooks/useTasksData'

const actionIcons = {
  task_created: PlusCircle,
  status_change: RefreshCw,
  comment_added: MessageSquare,
  approved: CheckCircle,
  revision_requested: AlertCircle,
  assignee_changed: UserCheck,
}

const actionLabels = {
  task_created: 'created this task',
  status_change: 'updated status',
  comment_added: 'commented',
  approved: 'approved this task',
  revision_requested: 'requested revisions',
  assignee_changed: 'reassigned task',
}

export function ActivityLogList({ logs, profilesMap }) {
  return (
    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
      {logs.length > 0 ? (
        logs.map((log) => {
          const user = profilesMap[log.user_id]
          const userName = user ? user.display_name : 'System'
          const label = actionLabels[log.action] || log.action

          return (
            <div
              key={log.id}
              className="flex items-center gap-3 p-2.5 bg-surface-50/70 dark:bg-navy-800/40 rounded-lg text-xs"
            >
              <div className="p-1.5 rounded-full bg-slate-200 dark:bg-navy-700 text-slate-500 dark:text-slate-400">
                <Activity size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  <strong className="font-semibold">{userName}</strong> {label}
                  {log.details?.status ? ` to "${log.details.status}"` : ''}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {formatTimeAgo(log.created_at)}
              </span>
            </div>
          )
        })
      ) : (
        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
          No activity logs recorded yet.
        </div>
      )}
    </div>
  )
}
