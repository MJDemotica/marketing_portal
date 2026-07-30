import { useState } from 'react'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'

const columns = [
  { key: 'pending', label: 'Pending Requests', color: 'bg-slate-400' },
  { key: 'assigned', label: 'Assigned Tasks', color: 'bg-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'for_review', label: 'For Review', color: 'bg-purple-500' },
  { key: 'revision', label: 'Revision Needed', color: 'bg-red-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
]

export default function KanbanBoard({ tasks, profilesMap, onTaskClick, onTaskEdit, onTaskDelete, onUpdateStatus }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  function handleDragStart(e, taskId) {
    e.dataTransfer.setData('text/plain', taskId)
    setDraggedTaskId(taskId)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function handleDrop(e, statusKey) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    if (taskId) {
      await onUpdateStatus(taskId, statusKey)
      setDraggedTaskId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 items-start">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)

        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.key)}
            className="flex flex-col bg-surface-100 dark:bg-navy-800/60 rounded-xl p-3 border border-surface-200 dark:border-navy-700 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-200 dark:border-navy-700">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">
                  {col.label}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-navy-700 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                {colTasks.length}
              </span>
            </div>

            {/* Column Tasks */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colTasks.length > 0 ? (
                colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => handleDragStart(e, task.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard
                      task={task}
                      profilesMap={profilesMap}
                      onClick={() => onTaskClick(task)}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                    />
                  </div>
                ))
              ) : (
                <div className="h-28 flex items-center justify-center rounded-lg border border-dashed border-surface-300 dark:border-navy-700 text-xs text-slate-400 dark:text-slate-500 italic">
                  No tasks here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
