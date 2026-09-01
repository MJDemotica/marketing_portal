import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Menu, PanelLeftOpen, CheckCheck, FileText, AlertCircle, MessageSquare, CheckCircle2, AtSign } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { formatTimeAgo } from '../hooks/useTasksData'

const pageTitles = {
  '/': 'Marketing Overview',
  '/tasks': 'Task Management',
  '/review': 'Review Panel',
  '/stats': 'Team Stats',
  '/admin': 'Admin Center',
  '/account': 'My Account',
}

export default function TopBar({ onMenuClick, sidebarCollapsed, onToggleSidebar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Marketing Portal'
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotifMenu, setShowNotifMenu] = useState(false)

  function handleNotifClick(notif) {
    markAsRead(notif.id)
    setShowNotifMenu(false)
    if (notif.task_id) {
      navigate('/tasks')
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-surface-200 dark:border-navy-700 transition-colors duration-300">
      {/* Left: hamburger / sidebar toggle + title */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Desktop: show sidebar-open button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
            aria-label="Show sidebar"
            title="Show sidebar"
          >
            <PanelLeftOpen size={22} />
          </button>
        )}

        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white transition-colors">
          {title}
        </h2>
      </div>

      {/* Right: notification bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifMenu(!showNotifMenu)}
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={21} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Panel */}
        {showNotifMenu && (
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-navy-600 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-navy-700 bg-surface-50/50 dark:bg-navy-900/50">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 dark:divide-navy-700/60">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      n.read
                        ? 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                        : 'bg-brand-50/40 dark:bg-brand-500/10 text-slate-800 dark:text-white font-medium'
                    }`}
                  >
                    <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${
                      n.type === 'mention'
                        ? 'bg-purple-500/10 text-purple-500'
                        : 'bg-brand-500/10 text-brand-500'
                    }`}>
                      {n.type === 'mention' ? <AtSign size={15} /> : <FileText size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {formatTimeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No notifications yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
