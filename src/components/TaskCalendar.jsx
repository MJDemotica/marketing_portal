import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function TaskCalendar({ tasks, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of current month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Starting day index (0 = Sun, 1 = Mon...)
  const startDayIndex = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  // Navigate months
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  function todayMonth() {
    setCurrentDate(new Date())
  }

  // Map tasks to dates (YYYY-MM-DD)
  const tasksByDate = {}
  tasks.forEach(t => {
    if (t.due_date) {
      const dKey = t.due_date.split('T')[0]
      if (!tasksByDate[dKey]) tasksByDate[dKey] = []
      tasksByDate[dKey].push(t)
    }
  })

  // Priority color map
  const priorityColor = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-amber-500 text-white',
    normal: 'bg-blue-500 text-white',
    low: 'bg-slate-500 text-white',
  }

  // Build grid days array
  const gridDays = []

  // Empty slots for previous month
  for (let i = 0; i < startDayIndex; i++) {
    gridDays.push(null)
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = String(day).padStart(2, '0')
    const formattedMonth = String(month + 1).padStart(2, '0')
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`
    gridDays.push({ day, dateKey })
  }

  const todayKey = new Date().toISOString().split('T')[0]

  return (
    <div className="card p-5 space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon size={20} className="text-brand-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {monthName} {year}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={todayMonth}
            className="px-3 py-1.5 rounded-lg border border-surface-300 dark:border-navy-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-surface-300 dark:border-navy-600 overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors border-l border-surface-300 dark:border-navy-600"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center border-b border-surface-200 dark:border-navy-700 pb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((item, idx) => {
          if (!item) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-28 rounded-lg bg-surface-50/50 dark:bg-navy-900/30 border border-surface-100 dark:border-navy-800"
              />
            )
          }

          const dayTasks = tasksByDate[item.dateKey] || []
          const isToday = item.dateKey === todayKey

          return (
            <div
              key={item.dateKey}
              className={`h-28 p-1.5 rounded-lg border transition-colors flex flex-col ${
                isToday
                  ? 'bg-brand-50/40 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/30'
                  : 'bg-white dark:bg-navy-800/80 border-surface-200 dark:border-navy-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    isToday
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Day tasks list */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {dayTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={`w-full text-left px-1.5 py-1 rounded text-[11px] font-medium truncate flex items-center justify-between gap-1 shadow-sm hover:opacity-85 transition-opacity ${
                      priorityColor[t.priority] || priorityColor.normal
                    }`}
                    title={`${t.task_code}: ${t.title}`}
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[9px] font-mono opacity-80 uppercase">{t.task_code}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
