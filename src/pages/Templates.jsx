import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileCode2,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  User,
} from 'lucide-react'
import { useTemplatesData } from '../hooks/useTemplatesData'
import { useAuth } from '../contexts/AuthContext'

export default function Templates() {
  const { profile, isSupervisor } = useAuth()
  const {
    templates,
    loading,
    error,
    refetch,
    createTemplate,
    deleteTemplate,
    canDelete,
  } = useTemplatesData()

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Create form
  const [form, setForm] = useState({
    name: '',
    fieldsText: 'Target Audience: All Clients\nDeliverables: Banner, Copy\nDeadline: 3 days',
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)

  function openCreateModal() {
    setForm({
      name: '',
      fieldsText: 'Target Audience: All Clients\nDeliverables: Banner, Copy\nDeadline: 3 days',
    })
    setCreateError('')
    setCreateSuccess(false)
    setShowCreateModal(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    setCreating(true)
    setCreateError('')

    try {
      // Parse "Key: Value" lines into a JSON object
      const fields = {}
      form.fieldsText
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
          const colonIdx = line.indexOf(':')
          if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_')
            const value = line.slice(colonIdx + 1).trim()
            fields[key] = value
          }
        })

      await createTemplate({ name: form.name, fields })
      setCreateSuccess(true)
      setTimeout(() => {
        setCreateSuccess(false)
        setShowCreateModal(false)
      }, 1000)
    } catch (err) {
      setCreateError(err.message || 'Failed to create template')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(templateId) {
    if (!window.confirm('Delete this template? This cannot be undone.')) return
    setDeletingId(templateId)
    try {
      await deleteTemplate(templateId)
    } catch (err) {
      alert(err.message || 'Failed to delete template')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
            Request Templates
          </p>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
            Templates Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reusable templates for structuring marketing requests and task briefs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={15} />
            Create Template
          </button>

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="card p-5 space-y-3 relative group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                    <FileCode2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                      {tmpl.name}
                    </h4>
                    {tmpl.created_by === profile?.id && (
                      <span className="text-[10px] text-brand-500 font-semibold uppercase tracking-wider">
                        Created by you
                      </span>
                    )}
                  </div>
                </div>

                {canDelete(tmpl) && (
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    disabled={deletingId === tmpl.id}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Template"
                  >
                    {deletingId === tmpl.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}
              </div>

              {/* Fields list */}
              <div className="bg-surface-50 dark:bg-navy-800/60 rounded-lg p-3 space-y-1.5 text-xs">
                {tmpl.fields && Object.keys(tmpl.fields).length > 0 ? (
                  Object.entries(tmpl.fields).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-slate-400 dark:text-slate-500 font-medium capitalize whitespace-nowrap">
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-mono text-right">
                        {String(v)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No structured fields defined</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center space-y-3">
          <FileCode2 size={36} className="text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
            No Templates Yet
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            Create your first template to streamline task and request creation across the team.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={15} />
            Create Template
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE TEMPLATE MODAL */}
      {/* ============================================================ */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-navy-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-navy-600">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Create Template
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Success overlay */}
            {createSuccess && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-navy-700/90">
                <div className="text-center">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 dark:text-white text-lg">
                    Template Created!
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                  {createError}
                </div>
              )}

              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Template Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Social Media Request, Print Ad Brief"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Fields */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Template Fields
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                  One field per line in <code className="px-1 py-0.5 rounded bg-surface-100 dark:bg-navy-800 font-mono">Key: Default Value</code> format.
                </p>
                <textarea
                  value={form.fieldsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, fieldsText: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors resize-none font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
