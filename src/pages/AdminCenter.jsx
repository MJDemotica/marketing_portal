import {
  Shield,
  Database,
  FileText,
  Trash2,
  Info,
  Users,
  Zap
} from 'lucide-react'

export default function AdminCenter() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Admin Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage system-wide settings and data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Initialization */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              <Zap size={20} className="text-brand-500" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">System Initialization</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            First-time setup: create all staff accounts and seed initial data.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
              <Users size={16} />
              Initialize Team Credentials
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-sm font-medium transition-colors">
              <Database size={16} />
              Seed Sample Tasks
            </button>
          </div>
        </div>

        {/* Request Templates */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                <FileText size={20} className="text-purple-500" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Request Templates</h3>
            </div>
            <button className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
              + New Template
            </button>
          </div>
          <div className="py-8 text-center rounded-lg border border-dashed border-surface-300 dark:border-navy-600">
            <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No templates yet.</p>
          </div>
        </div>

        {/* Reset Task Data */}
        <div className="card p-6 border-red-200 dark:border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-red-600 dark:text-red-400">Reset Task Data</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Permanently deletes all marketing requests, comments, activity logs, and notifications.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Does not affect user accounts/login credentials. Uploaded files are hosted externally (e.g. Cloudinary) and will not be removed.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
            <Trash2 size={16} />
            Reset Data
          </button>
        </div>

        {/* App Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-500/10">
              <Info size={20} className="text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">App Info</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Application Name
              </label>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">
                Marketing Operations Portal
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Project ID
              </label>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 font-mono">
                mp-prod-xxxx-xxxx
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Shield size={14} />
            <span>Admin Center is only accessible to Marketing Supervisors.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
