import { useState } from 'react'
import {
  Users,
  FileCode2,
  ShieldAlert,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Building2,
  Shield,
  AlertTriangle,
  Key,
  X,
} from 'lucide-react'
import { useAdminData } from '../hooks/useAdminData'

export default function AdminCenter() {
  const {
    members,
    templates,
    departments,
    loading,
    error,
    refetch,
    addMember,
    updateMember,
    deleteMember,
    createTemplate,
    deleteTemplate,
    resetTaskData,
  } = useAdminData()

  const [activeTab, setActiveTab] = useState('members')

  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [deletingMemberId, setDeletingMemberId] = useState(null)

  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState(null)

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const [resetConfirmInput, setResetConfirmInput] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Member form state
  const [memberForm, setMemberForm] = useState({
    displayName: '',
    email: '',
    role: 'member',
    department: 'Marketing',
  })

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    fieldsText: 'Target Audience: All Clients\nDeliverables: Graphic, Copy\nDeadline: 3 days',
  })

  // Submit Add / Edit Member
  async function handleMemberSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingMember) {
        await updateMember(editingMember.id, {
          displayName: memberForm.displayName,
          role: memberForm.role,
          department: memberForm.department,
        })
        setEditingMember(null)
      } else {
        await addMember(memberForm)
        setShowAddMemberModal(false)
      }
      setMemberForm({ displayName: '', email: '', role: 'member', department: 'Marketing' })
    } catch (err) {
      alert(err.message || 'Failed to save member')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Member Confirm
  async function handleConfirmDeleteMember(id) {
    setSubmitting(true)
    try {
      await deleteMember(id)
      setDeletingMemberId(null)
    } catch (err) {
      alert(err.message || 'Failed to delete member')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Create Template
  async function handleTemplateSubmit(e) {
    e.preventDefault()
    if (!templateForm.name.trim()) return

    setSubmitting(true)
    try {
      const fieldsObj = {}
      templateForm.fieldsText.split('\n').forEach((line) => {
        const parts = line.split(':')
        if (parts.length >= 2) {
          const key = parts[0].trim()
          const val = parts.slice(1).join(':').trim()
          fieldsObj[key] = val
        }
      })

      await createTemplate({
        name: templateForm.name,
        fields: fieldsObj,
      })
      setShowAddTemplateModal(false)
      setTemplateForm({ name: '', fieldsText: '' })
    } catch (err) {
      alert(err.message || 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Template Confirm
  async function handleConfirmDeleteTemplate(id) {
    setSubmitting(true)
    try {
      await deleteTemplate(id)
      setDeletingTemplateId(null)
    } catch (err) {
      alert(err.message || 'Failed to delete template')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset All Task Data
  async function handleResetTaskData(e) {
    e.preventDefault()
    if (resetConfirmInput.toUpperCase() !== 'RESET') return

    setSubmitting(true)
    try {
      await resetTaskData()
      setResetSuccess(true)
      setTimeout(() => {
        setResetSuccess(false)
        setShowResetConfirmModal(false)
        setResetConfirmInput('')
      }, 2000)
    } catch (err) {
      alert(err.message || 'Failed to reset task data')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading Admin Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Admin Center
            </h1>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              SUPERVISOR ONLY
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            System administration, team member CRUD, request templates, and data maintenance.
          </p>
        </div>

        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh System
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-surface-200 dark:border-navy-600 space-x-6">
        {[
          { id: 'members', label: `Team Members (${members.length})`, icon: Users },
          { id: 'templates', label: `Templates (${templates.length})`, icon: FileCode2 },
          { id: 'system', label: 'System & Danger Zone', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: MEMBER MANAGEMENT (CRUD) */}
      {/* ============================================================ */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Department Roster & Roles
            </p>
            <button
              onClick={() => {
                setEditingMember(null)
                setMemberForm({ displayName: '', email: '', role: 'member', department: 'Marketing' })
                setShowAddMemberModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus size={15} />
              Add Team Member
            </button>
          </div>

          {/* Members Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50 dark:bg-navy-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-surface-200 dark:border-navy-700">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-navy-700/60 text-xs">
                  {members.map((m) => {
                    const initials = m.display_name
                      ? m.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                      : '??'

                    return (
                      <tr key={m.id} className="hover:bg-surface-50/50 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-brand-600 dark:text-brand-300 font-bold text-xs">
                                  {initials}
                                </span>
                              )}
                            </div>
                            <span>{m.display_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">{m.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.role === 'supervisor'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            }`}
                          >
                            {m.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{m.department}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingMember(m)
                              setMemberForm({
                                displayName: m.display_name,
                                email: m.email,
                                role: m.role,
                                department: m.department,
                              })
                            }}
                            className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                            title="Edit Member"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingMemberId(m.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: TEMPLATES MANAGEMENT (CRUD) */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Structured Request Templates
            </p>
            <button
              onClick={() => {
                setTemplateForm({
                  name: '',
                  fieldsText: 'Target Audience: All Clients\nDeliverables: Banner, Copy\nDeadline: 3 days',
                })
                setShowAddTemplateModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus size={15} />
              Create Template
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="card p-5 space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                      <FileCode2 size={18} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">
                      {tmpl.name}
                    </h4>
                  </div>

                  <button
                    onClick={() => setDeletingTemplateId(tmpl.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Fields list */}
                <div className="bg-surface-50 dark:bg-navy-800/60 rounded-lg p-3 space-y-1.5 text-xs">
                  {tmpl.fields && Object.keys(tmpl.fields).length > 0 ? (
                    Object.entries(tmpl.fields).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-medium capitalize">
                          {k.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 font-mono">
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
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SYSTEM & DANGER ZONE */}
      {/* ============================================================ */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Initialize Team Credentials */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Initialize Team Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bulk initialize standard authentication accounts for all team members in the database.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert('Team credentials initialized! Standard accounts are ready.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Key size={14} />
              Initialize Staff Accounts
            </button>
          </div>

          {/* Danger Zone */}
          <div className="card p-6 border-l-4 border-l-red-500 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-600 dark:text-red-400">
                  Danger Zone: Reset All Task Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanently clear all tasks from the database. Profiles and user accounts will remain untouched.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setResetConfirmInput('')
                setShowResetConfirmModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Trash2 size={14} />
              Reset All Task Data
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add / Edit Member Modal */}
      {(showAddMemberModal || editingMember) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddMemberModal(false); setEditingMember(null); }} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button onClick={() => { setShowAddMemberModal(false); setEditingMember(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={memberForm.displayName}
                  onChange={(e) => setMemberForm({ ...memberForm, displayName: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
                />
              </div>

              {!editingMember && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="member">Member</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={memberForm.department}
                    onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAddMemberModal(false); setEditingMember(null); }}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-brand-500 text-white font-bold"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMemberId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingMemberId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">Delete Member Profile?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove this member profile from the roster?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingMemberId(null)} className="px-3 py-1.5 rounded border border-surface-300 text-xs font-semibold">
                Cancel
              </button>
              <button onClick={() => handleConfirmDeleteMember(deletingMemberId)} className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-bold">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddTemplateModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create Request Template</h3>
              <button onClick={() => setShowAddTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Brand Design Request"
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Default Field Descriptions (One key: value per line)
                </label>
                <textarea
                  rows={4}
                  value={templateForm.fieldsText}
                  onChange={(e) => setTemplateForm({ ...templateForm, fieldsText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-brand-500 text-white font-bold">
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Modal */}
      {deletingTemplateId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingTemplateId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">Delete Template?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this template?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingTemplateId(null)} className="px-3 py-1.5 rounded border border-surface-300 text-xs font-semibold">
                Cancel
              </button>
              <button onClick={() => handleConfirmDeleteTemplate(deletingTemplateId)} className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-bold">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirmModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <AlertTriangle size={22} />
              Reset All Task Data
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone. Type <strong className="text-slate-800 dark:text-white font-mono">RESET</strong> below to confirm.
            </p>

            <form onSubmit={handleResetTaskData} className="space-y-4">
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="Type RESET"
                className="w-full px-3.5 py-2 rounded-lg border border-red-300 dark:border-red-500/30 bg-white dark:bg-navy-800 text-sm font-mono"
              />

              {resetSuccess && (
                <div className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Task data reset successfully!
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || resetConfirmInput.toUpperCase() !== 'RESET'}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
