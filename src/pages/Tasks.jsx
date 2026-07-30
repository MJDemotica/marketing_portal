import { List, Columns3, Calendar, Search } from 'lucide-react'
import { useState } from 'react'

const views = [
  { id: 'list', icon: List, label: 'List' },
  { id: 'kanban', icon: Columns3, label: 'Kanban' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
]

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'for_review', label: 'For Review' },
  { key: 'completed', label: 'Completed' },
]

export default function Tasks() {
  const [activeView, setActiveView] = useState('list')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-5">
      {/* Header with view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
            Task Management
          </p>
        </div>
        <div className="flex items-center bg-surface-100 dark:bg-navy-700 rounded-lg p-1">
          {views.map((view) => {
            const Icon = view.icon
            const isActive = activeView === view.id
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-white dark:bg-navy-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search bar + status filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search input */}
        <div className="relative sm:w-72 flex-shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task #, name, email, category..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-700 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${isActive
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300'
                  : 'bg-white border-surface-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:bg-navy-700 dark:border-navy-600 dark:text-slate-400 dark:hover:border-navy-500 dark:hover:text-slate-300'
                  }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      {activeView === 'list' && (
        <div className="card min-h-[420px] flex items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No tasks yet.
          </p>
        </div>
      )}

      {activeView === 'kanban' && (
        <div className="card p-12 text-center min-h-[420px] flex flex-col items-center justify-center">
          <Columns3 size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Kanban View</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Drag-and-drop board coming in Phase 4.
          </p>
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="card p-12 text-center min-h-[420px] flex flex-col items-center justify-center">
          <Calendar size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Calendar View</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Monthly task calendar coming in Phase 4.
          </p>
        </div>
      )}
    </div>
  )
}
