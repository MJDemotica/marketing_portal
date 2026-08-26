import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, FileCode2, Send, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
]

export default function DepartmentRequestModal({ isOpen, onClose, onCreated }) {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const userDept = profile?.department || 'Department'

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal',
    due_date: '',
    attachment_url: '',
  })

  // Load available templates for quick-fill
  useEffect(() => {
    if (!isOpen) return
    async function loadTemplates() {
      try {
        const { data, error: tErr } = await supabase
          .from('templates')
          .select('*')
          .order('name')
        if (!tErr && data) {
          setTemplates(data)
        }
      } catch (err) {
        console.error('Error fetching templates:', err)
      }
    }
    loadTemplates()
  }, [isOpen])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleTemplateSelect(e) {
    const tmplId = e.target.value
    setSelectedTemplateId(tmplId)

    if (!tmplId) return

    const selected = templates.find(t => t.id === tmplId)
    if (selected && selected.fields) {
      let formattedFields = ''
      if (typeof selected.fields === 'object') {
        formattedFields = Object.entries(selected.fields)
          .map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v || ''}`)
          .join('\n')
      }

      setForm(prev => ({
        ...prev,
        title: prev.title || `${selected.name} - ${userDept}`,
        description: prev.description
          ? `${prev.description}\n\n[Template: ${selected.name}]\n${formattedFields}`
          : `[Template: ${selected.name}]\n${formattedFields}`,
      }))
    }
  }

  function generateRequestCode() {
    const num = Math.floor(1000 + Math.random() * 9000)
    return `REQ-${num}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Please provide a request title')
      return
    }

    setLoading(true)
    setError('')

    try {
      const requestCode = generateRequestCode()

      const { error: insertErr } = await supabase
        .from('tasks')
        .insert({
          task_code: requestCode,
          title: form.title.trim(),
          description: form.description.trim() || null,
          priority: form.priority,
          status: 'pending', // Pending supervisor feasibility review
          requestor_id: profile?.id,
          department: userDept,
          assignee_id: null,
          due_date: form.due_date || null,
          template_id: selectedTemplateId || null,
          attachment_url: form.attachment_url.trim() || null,
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
          due_date: '',
          attachment_url: '',
        })
        setSelectedTemplateId('')
        onCreated?.()
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err.message || 'Failed to submit department request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-navy-700 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-navy-600">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-navy-600 bg-gradient-to-r from-brand-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs">
              {userDept}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Request a Marketing Task
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Submit a new creative request to the Marketing Supervisor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Optional Template Selector */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileCode2 size={14} className="text-brand-500" />
              Use a Request Template (Optional)
            </label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateSelect}
              className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">-- Select a structured template (or start blank) --</option>
              {templates.map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Request Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Q4 Recruitment Flyer, Social Media Banner, Brochure Revisions"
              className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Requested Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Description & Deliverable Details <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what you need, target audience, dimensions, specific copy, or key guidelines..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 leading-relaxed font-sans"
            />
          </div>

          {/* Optional Attachment Link */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <LinkIcon size={13} className="text-slate-400" />
              File / Reference Link (Optional)
            </label>
            <input
              type="url"
              name="attachment_url"
              value={form.attachment_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/... or Figma / Dropbox link"
              className="w-full px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-navy-600">
            {success ? (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold">
                <CheckCircle2 size={16} />
                Request Submitted Successfully!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Submitted to Marketing Supervisor
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-surface-300 dark:border-navy-600 text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold transition-colors shadow-sm"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Submit Request
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
