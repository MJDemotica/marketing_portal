import {
  FileText,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileDown
} from 'lucide-react'

const stats = [
  { label: 'Total Requests', value: '24', icon: FileText, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10' },
  { label: 'Completed', value: '11', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  { label: 'In Progress', value: '—', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { label: 'Overdue', value: '—', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
]

export default function TeamStats() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Analytics Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Performance metrics and team workload.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors">
          <FileDown size={16} />
          Export Full Report
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          'Avg. Revisions per Project',
          'Active Tasks per Member (Workload)',
          'Requests by Department',
          'Completed Projects by Member',
        ].map((title) => (
          <div key={title} className="card p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
              {title}
            </h3>
            <div className="h-48 flex items-center justify-center rounded-lg bg-surface-50 dark:bg-navy-900/50 border border-dashed border-surface-300 dark:border-navy-600">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Chart coming in Phase 6
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
