import { useLocation } from 'react-router-dom'
import { Bell, Menu, PanelLeftOpen } from 'lucide-react'

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
  const title = pageTitles[location.pathname] || 'Marketing Portal'

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
      <button
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={21} />
        {/* Notification badge — will be wired up in Phase 5 */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full badge-pulse" />
      </button>
    </header>
  )
}
