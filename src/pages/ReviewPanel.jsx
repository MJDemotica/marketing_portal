import { CircleCheck } from 'lucide-react'

export default function ReviewPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Review Panel
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Review, approve, or request revisions on submitted tasks.
        </p>
      </div>

      {/* Empty state */}
      <div className="card p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 mb-4">
          <CircleCheck size={36} className="text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
          No Tasks for Review
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-xs mx-auto">
          Everything is up to date. Tasks submitted for review will appear here.
        </p>
      </div>
    </div>
  )
}
