import {
  FileText,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileDown,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useStatsData } from '../hooks/useStatsData'

const PIE_COLORS = ['#CCAA49', '#123765', '#5F98B6', '#365794', '#EBD47A', '#6492B1', '#3E5E72']

export default function TeamStats() {
  const { loading, error, refetch, summary, charts, tasks, profiles } = useStatsData()

  // Summary stat cards configuration
  const statCards = [
    {
      label: 'Total Requests',
      value: summary?.totalRequests ?? 0,
      icon: FileText,
      color: 'text-brand-500',
      bg: 'bg-brand-50 dark:bg-brand-500/10',
    },
    {
      label: 'Completed',
      value: summary?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      label: 'In Progress',
      value: summary?.inProgress ?? '—',
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      label: 'Overdue',
      value: summary?.overdue ?? '—',
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
  ]

  // Export Full Report CSV
  function handleExportFullReport() {
    if (!tasks.length) return

    let csvContent = '=== MARKETING PORTAL ANALYTICS REPORT ===\n\n'

    // Summary Section
    csvContent += 'SUMMARY METRICS\n'
    csvContent += `Total Requests,${summary.totalRequests}\n`
    csvContent += `Completed Projects,${summary.completed}\n`
    csvContent += `In Progress,${summary.inProgress}\n`
    csvContent += `Overdue,${summary.overdue}\n\n`

    // Team Workload Section
    csvContent += 'TEAM MEMBER WORKLOAD & PERFORMANCE\n'
    csvContent += 'Name,Active Workload,Completed Projects,Avg Revisions\n'
    profiles.forEach((p) => {
      const workload = charts.workload.find((w) => w.name === p.display_name)?.activeTasks || 0
      const completed = charts.completedProjects.find((c) => c.name === p.display_name)?.completedTasks || 0
      const avgRev = charts.avgRevisions.find((r) => r.name === p.display_name)?.avgRevisions || 0
      csvContent += `"${p.display_name}",${workload},${completed},${avgRev}\n`
    })

    csvContent += '\n=== END REPORT ===\n'

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-3">Error loading analytics: {error}</p>
          <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

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
        <button
          onClick={handleExportFullReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors shadow-sm"
        >
          <FileDown size={16} />
          Export Full Report
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Avg. Revisions per Project */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Avg. Revisions per Project
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">By Team Member</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.avgRevisions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={true} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f1a3c', borderColor: '#1d2d66', borderRadius: '8px', color: '#ffffff' }}
                  itemStyle={{ color: '#c7d2fe' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Bar dataKey="avgRevisions" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Avg Revisions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Active Tasks per Member (Workload) */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Active Tasks per Member (Workload)
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Current Active</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f1a3c', borderColor: '#1d2d66', borderRadius: '8px', color: '#ffffff' }}
                  itemStyle={{ color: '#93c5fd' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Bar dataKey="activeTasks" fill="#3b63f7" radius={[6, 6, 0, 0]} name="Active Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Requests by Department */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Requests by Department
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Distribution</span>
          </div>
          <div className="h-64 w-full">
            {charts.requestsByDept.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.requestsByDept}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.requestsByDept.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1a3c', borderColor: '#1d2d66', borderRadius: '8px', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Legend tick={{ fontSize: 11, fill: '#64748b' }} wrapperStyle={{ paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* CHART 4: Completed Projects by Member */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Completed Projects by Member
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Completed</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={charts.completedProjects}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f1a3c', borderColor: '#1d2d66', borderRadius: '8px', color: '#ffffff' }}
                  itemStyle={{ color: '#6ee7b7' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Bar dataKey="completedTasks" fill="#10b981" radius={[0, 6, 6, 0]} name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
