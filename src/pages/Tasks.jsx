import { useState, useMemo } from 'react'
import { List, Columns3, Calendar, Search, ChevronDown, ChevronRight, Plus, Loader2, RefreshCw } from 'lucide-react'
import { useTasksData } from '../hooks/useTasksData'
import { useAuth } from '../contexts/AuthContext'
import TaskCard from '../components/TaskCard'
import TaskDetailModal from '../components/TaskDetailModal'
import KanbanBoard from '../components/KanbanBoard'
import TaskCalendar from '../components/TaskCalendar'
import CreateTaskModal from '../components/CreateTaskModal'

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
  { key: 'revision', label: 'Revision' },
  { key: 'completed', label: 'Completed' },
  { key: 'disapproved', label: 'Disapproved' },
]

const stageSections = [
  { key: 'pending', label: 'Pending Requests', color: 'bg-slate-400' },
  { key: 'assigned', label: 'Assigned Tasks', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'for_review', label: 'For Review', color: 'bg-purple-500' },
  { key: 'revision', label: 'Revision Needed', color: 'bg-red-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
  { key: 'disapproved', label: 'Disapproved', color: 'bg-rose-700' },
]

export default function Tasks() {
  const { isSupervisor } = useAuth()
  const { tasks, profilesMap, profilesList, loading, error, refetch, updateTaskStatus, updateTask, deleteTask } = useTasksData()

  const [activeView, setActiveView] = useState('list')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected task for detail modal
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Collapsed state for List view stage sections
  const [collapsedStages, setCollapsedStages] = useState({})

  function toggleStageCollapse(stageKey) {
    setCollapsedStages(prev => ({ ...prev, [stageKey]: !prev[stageKey] }))
  }

  // Filter tasks by search query and active status pill
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status pill filter
      if (activeFilter !== 'all' && task.status !== activeFilter) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = task.title?.toLowerCase().includes(q)
        const codeMatch = task.task_code?.toLowerCase().includes(q)
        const descMatch = task.description?.toLowerCase().includes(q)

        const requestor = profilesMap[task.requestor_id]
        const requestorMatch = requestor?.display_name?.toLowerCase().includes(q)

        const assignee = profilesMap[task.assignee_id]
        const assigneeMatch = assignee?.display_name?.toLowerCase().includes(q)

        return titleMatch || codeMatch || descMatch || requestorMatch || assigneeMatch
      }

      return true
    })
  }, [tasks, activeFilter, searchQuery, profilesMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-3">Error loading tasks: {error}</p>
          <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header with view switcher & Create Task button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
            Task Management
          </p>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
            Tasks & Workflows
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Task button (all Marketing team) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={15} />
            Create Task
          </button>

          {/* View switcher */}
          <div className="flex items-center bg-surface-100 dark:bg-navy-700 rounded-lg p-1">
            {views.map((view) => {
              const Icon = view.icon
              const isActive = activeView === view.id
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white dark:bg-navy-600 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              )
            })}
          </div>
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  isActive
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

      {/* Main View Content */}

      {/* 1. LIST VIEW */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            stageSections.map((stage) => {
              const stageTasks = filteredTasks.filter(t => t.status === stage.key)
              // If status filter active and doesn't match stage, skip empty stage
              if (activeFilter !== 'all' && activeFilter !== stage.key && stageTasks.length === 0) {
                return null
              }

              const isCollapsed = collapsedStages[stage.key]

              return (
                <div key={stage.key} className="card overflow-hidden transition-all">
                  {/* Stage section header */}
                  <button
                    onClick={() => toggleStageCollapse(stage.key)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-navy-600/50 transition-colors border-b border-surface-100 dark:border-navy-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {stage.label}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-200 dark:bg-navy-600 text-slate-600 dark:text-slate-300 font-bold">
                        {stageTasks.length}
                      </span>
                    </div>

                    <div className="text-slate-400 dark:text-slate-500">
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {/* Stage task grid */}
                  {!isCollapsed && (
                    <div className="p-4 bg-surface-50/50 dark:bg-navy-800/30">
                      {stageTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {stageTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              profilesMap={profilesMap}
                              onClick={() => setSelectedTask(task)}
                              onEdit={(t) => setSelectedTask(t)}
                              onDelete={deleteTask}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                          No tasks in this stage.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="card min-h-[350px] flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No tasks yet matching your filters.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Try clearing search or changing your filter.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. KANBAN VIEW */}
      {activeView === 'kanban' && (
        <KanbanBoard
          tasks={filteredTasks}
          profilesMap={profilesMap}
          onTaskClick={(t) => setSelectedTask(t)}
          onTaskEdit={(t) => setSelectedTask(t)}
          onTaskDelete={deleteTask}
          onUpdateStatus={updateTaskStatus}
        />
      )}

      {/* 3. CALENDAR VIEW */}
      {activeView === 'calendar' && (
        <TaskCalendar
          tasks={filteredTasks}
          onTaskClick={(t) => setSelectedTask(t)}
        />
      )}

      {/* Detail / Edit Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          profilesList={profilesList}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />
    </div>
  )
}
