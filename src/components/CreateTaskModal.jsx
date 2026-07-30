import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

export default function CreateTaskModal({ isOpen, onClose, onCreated }) {
  const { profile } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal',
    assignee_id: '',
    due_date: '',
    department: 'Marketing',
  })

  // Fetch team members for assignee dropdown
  useEffect(() => {
    if (!isOpen) return
    async function loadMembers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('department', 'Marketing')
        .order('display_name')
      if (data) setTeamMembers(data)
    }
    loadMembers()
  }, [isOpen])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Generate task code
  function generateTaskCode() {
    const num = Math.floor(1000 + Math.random() * 9000)
    const suffix = Math.floor(100 + Math.random() * 900)
    return `MR-${num}-${suffix}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return

    setLoading(true)
    setError('')

    try {
      const taskCode = generateTaskCode()
      const { error: insertErr } = await supabase
        .from('tasks')
        .insert({
          task_code: taskCode,
          title: form.title.trim(),
          description: form.description.trim() || null,
          priority: form.priority,
          status: form.assignee_id ? 'assigned' : 'pending',
          requestor_id: profile?.id,
          department: form.department,
          assignee_id: form.assignee_id || null,
          due_date: form.due_date || null,
          revision_count: 0,
        })

      if (insertErr) throw insertErr

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setForm({
          title: '',
          description: '',
          priority: 'normal',
          assignee_id: '',
          due_date: '',
          department: 'Marketing',
        })
        onCreated?.()
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-navy-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-navy-600">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-navy-700/90">
            <div className="text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-slate-800 dark:text-white">Task Created!</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Social Media Campaign Q3"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the task..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          {/* Priority + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assign To
            </label>
            <select
              name="assignee_id"
              value={form.assignee_id}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
            >
              <option value="">Unassigned (Pending)</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
