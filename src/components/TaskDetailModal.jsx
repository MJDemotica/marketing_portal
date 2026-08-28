import { useState, useEffect } from 'react'
import { X, Loader2, Trash2, Save, AlertTriangle, MessageSquare, Activity, FileText, Send, CheckCircle2, XCircle } from 'lucide-react'
import { formatTimeAgo } from '../hooks/useTasksData'
import { useCommentsAndLogs } from '../hooks/useCommentsAndLogs'
import { useAuth } from '../contexts/AuthContext'
import { CommentsThread } from './CommentsThread'
import { ActivityLogList } from './ActivityLogList'

const allStatusOptions = [
  { value: 'assigned', label: 'Assigned Tasks' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'for_review', label: 'For Review (Pending Approval)', supervisorOnly: true },
  { value: 'revision', label: 'Revision Needed' },
  { value: 'completed', label: 'Completed' },
  { value: 'disapproved', label: 'Disapproved' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function TaskDetailModal({ task, isOpen, onClose, profilesList, profilesMap = {}, onUpdate, onDelete }) {
  const { isSupervisor } = useAuth()

  // Members don't see 'for_review' in the status dropdown
  const statusOptions = allStatusOptions.filter(opt => !opt.supervisorOnly || isSupervisor)

  const [activeTab, setActiveTab] = useState('details')
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal',
    status: 'pending',
    assignee_id: '',
    due_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const { comments, activityLogs, addComment, logActivity } = useCommentsAndLogs(task?.id)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'normal',
        status: task.status || 'pending',
        assignee_id: task.assignee_id || '',
        due_date: task.due_date || '',
      })
      setConfirmDelete(false)
      setError('')
      setActiveTab('details')
    }
  }, [task])

  if (!isOpen || !task) return null

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const statusChanged = form.status !== task.status
      await onUpdate(task.id, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null,
      })

      if (statusChanged) {
        await logActivity('status_change', { status: form.status })
      }

      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    setLoading(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white dark:bg-navy-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-navy-600">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-500/20">
              {task.task_code}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Created {formatTimeAgo(task.created_at)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Header Bar */}
        <div className="flex border-b border-surface-200 dark:border-navy-600 px-6 bg-surface-50/50 dark:bg-navy-800/30">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
            { id: 'activity', label: 'Activity Log', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-800 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Stage / Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200"
                  >
                    {priorityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Assigned To
                  </label>
                  <select
                    name="assignee_id"
                    value={form.assignee_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <option value="">Unassigned</option>
                    {profilesList.map(p => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Task details and instructions..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {confirmDelete && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-sm space-y-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium">
                    <AlertTriangle size={16} />
                    <span>Are you sure you want to delete this task?</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-navy-600 text-slate-700 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="px-3 py-1 text-xs rounded bg-red-600 text-white font-medium hover:bg-red-700"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-200 dark:border-navy-600">
                {/* Left: Destructive action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSupervisor && !confirmDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-medium transition-colors"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  )}
                </div>

                {/* Right: Quick action + Form actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Quick Action: Mark Completed */}
                  {['assigned', 'in_progress', 'revision'].includes(form.status) && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true)
                        try {
                          await onUpdate(task.id, { status: 'completed' })
                          await logActivity('status_change', { status: 'completed' })
                          onClose()
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setLoading(false)
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Mark Completed
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-surface-300 dark:border-navy-600 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    <Save size={14} />
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: COMMENTS */}
          {activeTab === 'comments' && (
            <CommentsThread
              comments={comments}
              profilesMap={profilesMap}
              onAddComment={addComment}
            />
          )}

          {/* TAB 3: ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <ActivityLogList
              logs={activityLogs}
              profilesMap={profilesMap}
            />
          )}
        </div>
      </div>
    </div>
  )
}
