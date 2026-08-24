import { useState, useEffect, useCallback } from 'react'
import {
  CircleCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { useCommentsAndLogs } from '../hooks/useCommentsAndLogs'
import { formatTimeAgo } from '../hooks/useTasksData'
import { CommentsThread } from '../components/CommentsThread'

export default function ReviewPanel() {
  const { profile, isSupervisor } = useAuth()
  const { sendNotification } = useNotifications()

  const [reviewTasks, setReviewTasks] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Revision notes modal state
  const [revisionModalTask, setRevisionModalTask] = useState(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  // Fetch tasks in "for_review" status
  const fetchReviewTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Load profiles map
      const { data: profs } = await supabase.from('profiles').select('*')
      const pMap = {}
      if (profs) profs.forEach((p) => (pMap[p.id] = p))
      setProfilesMap(pMap)

      // 2. Load tasks in for_review
      let query = supabase.from('tasks').select('*').eq('status', 'for_review').order('updated_at', { ascending: false })
      if (!isSupervisor && profile?.id) {
        query = query.eq('assignee_id', profile.id)
      }

      const { data: tasksData, error: tErr } = await query

      if (tErr) throw tErr
      setReviewTasks(tasksData || [])
    } catch (err) {
      console.error('Error fetching review tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviewTasks()
  }, [fetchReviewTasks])

  // Approve task (→ Completed)
  async function handleApprove(task) {
    setSubmittingAction(true)
    try {
      // 1. Update status
      const { error: uErr } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (uErr) throw uErr

      // 2. Log activity
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        user_id: profile?.id,
        action: 'approved',
        details: { status: 'completed' },
      })

      // 3. Notify assignee & requestor
      const targetUser = task.assignee_id || task.requestor_id
      if (targetUser && targetUser !== profile?.id) {
        await sendNotification({
          userId: targetUser,
          type: 'task_approved',
          message: `Your task "${task.title}" (${task.task_code}) has been approved!`,
          taskId: task.id,
        })
      }

      await fetchReviewTasks()
    } catch (err) {
      console.error('Error approving task:', err)
    } finally {
      setSubmittingAction(false)
    }
  }

  // Submit Request Revision
  async function handleRequestRevisionSubmit(e) {
    e.preventDefault()
    if (!revisionModalTask || !revisionNotes.trim()) return

    setSubmittingAction(true)
    try {
      const task = revisionModalTask
      const newRevCount = (task.revision_count || 0) + 1

      // 1. Update status to revision & increment count
      const { error: uErr } = await supabase
        .from('tasks')
        .update({
          status: 'revision',
          revision_count: newRevCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (uErr) throw uErr

      // 2. Post comment with revision feedback
      await supabase.from('comments').insert({
        task_id: task.id,
        user_id: profile?.id,
        body: `[REVISION REQUESTED]: ${revisionNotes.trim()}`,
      })

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        user_id: profile?.id,
        action: 'revision_requested',
        details: { revision_count: newRevCount, notes: revisionNotes.trim() },
      })

      // 4. Send notification
      const targetUser = task.assignee_id || task.requestor_id
      if (targetUser && targetUser !== profile?.id) {
        await sendNotification({
          userId: targetUser,
          type: 'revision_requested',
          message: `Revisions requested on "${task.title}" (${task.task_code})`,
          taskId: task.id,
        })
      }

      setRevisionModalTask(null)
      setRevisionNotes('')
      await fetchReviewTasks()
    } catch (err) {
      console.error('Error requesting revision:', err)
    } finally {
      setSubmittingAction(false)
    }
  }

  // Disapprove Task
  const [disapproveModalTask, setDisapproveModalTask] = useState(null)
  const [disapproveReason, setDisapproveReason] = useState('')

  async function handleDisapproveSubmit(e) {
    e.preventDefault()
    if (!disapproveModalTask || !disapproveReason.trim()) return

    setSubmittingAction(true)
    try {
      const task = disapproveModalTask

      // 1. Update status to disapproved
      const { error: uErr } = await supabase
        .from('tasks')
        .update({
          status: 'disapproved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (uErr) throw uErr

      // 2. Add comment with reason
      await supabase.from('comments').insert({
        task_id: task.id,
        user_id: profile?.id,
        body: `[DISAPPROVED]: ${disapproveReason.trim()}`,
      })

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        user_id: profile?.id,
        action: 'status_change',
        details: { status: 'disapproved', reason: disapproveReason.trim() },
      })

      // 4. Send notification
      const targetUser = task.assignee_id || task.requestor_id
      if (targetUser && targetUser !== profile?.id) {
        await sendNotification({
          userId: targetUser,
          type: 'task_disapproved',
          message: `Task "${task.title}" (${task.task_code}) was disapproved.`,
          taskId: task.id,
        })
      }

      setDisapproveModalTask(null)
      setDisapproveReason('')
      await fetchReviewTasks()
    } catch (err) {
      console.error('Error disapproving task:', err)
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading review panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Review Panel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review submitted marketing tasks, approve deliverables, hold for revisions, or disapprove requests.
          </p>
        </div>

        <button
          onClick={fetchReviewTasks}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Empty State */}
      {reviewTasks.length === 0 ? (
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
      ) : (
        /* Tasks Pending Review List */
        <div className="space-y-6">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-purple-600 dark:text-purple-400">
            Pending Approval ({reviewTasks.length})
          </p>

          {reviewTasks.map((task) => {
            const assignee = profilesMap[task.assignee_id]
            const requestor = profilesMap[task.requestor_id]

            const assigneeName = assignee ? assignee.display_name : 'Unassigned'
            const requestorName = requestor ? requestor.display_name : 'Department'

            return (
              <div
                key={task.id}
                className="card p-6 border-l-4 border-l-purple-500 dark:border-l-purple-400 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-500/30">
                      {task.task_code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <Clock size={13} />
                    <span>Submitted {formatTimeAgo(task.updated_at || task.created_at)}</span>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-50 dark:bg-navy-800/60 p-3 rounded-lg border border-surface-100 dark:border-navy-700">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Requested by: </span>
                    <strong className="text-slate-700 dark:text-slate-200">{requestorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Assigned to: </span>
                    <strong className="text-slate-700 dark:text-slate-200">{assigneeName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Revisions so far: </span>
                    <strong className="text-slate-700 dark:text-slate-200">{task.revision_count || 0}</strong>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-navy-800 p-3 rounded-lg border border-surface-200 dark:border-navy-700">
                    {task.description}
                  </p>
                )}

                {/* Collapsible Comments Thread */}
                <ReviewTaskComments
                  task={task}
                  profilesMap={profilesMap}
                  sendNotification={sendNotification}
                  currentUserId={profile?.id}
                  currentUserName={profile?.display_name}
                />

                {/* Supervisor Action Buttons Row: Approve / Hold (Revision) / Disapprove */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {isSupervisor ? (
                    <>
                      {/* Disapprove */}
                      <button
                        onClick={() => {
                          setDisapproveModalTask(task)
                          setDisapproveReason('')
                        }}
                        disabled={submittingAction}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-colors"
                      >
                        <AlertCircle size={15} />
                        Disapprove
                      </button>

                      {/* Hold for Revision */}
                      <button
                        onClick={() => {
                          setRevisionModalTask(task)
                          setRevisionNotes('')
                        }}
                        disabled={submittingAction}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-xs font-bold transition-colors"
                      >
                        <RefreshCw size={14} />
                        Hold for Revision
                      </button>

                      {/* Approve */}
                      <button
                        onClick={() => handleApprove(task)}
                        disabled={submittingAction}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        {submittingAction ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        Approve Task
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-500/30">
                      <Clock size={13} />
                      Pending Supervisor Review
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Request Revision Modal */}
      {revisionModalTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRevisionModalTask(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Hold for Revision: {revisionModalTask.task_code}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide feedback detailing what changes are required before approval.
            </p>

            <form onSubmit={handleRequestRevisionSubmit} className="space-y-4">
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Explain required changes..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRevisionModalTask(null)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !revisionNotes.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  {submittingAction && <Loader2 size={14} className="animate-spin" />}
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disapprove Modal */}
      {disapproveModalTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDisapproveModalTask(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
              Disapprove Task: {disapproveModalTask.task_code}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please state the reason for disapproving this task request.
            </p>

            <form onSubmit={handleDisapproveSubmit} className="space-y-4">
              <textarea
                value={disapproveReason}
                onChange={(e) => setDisapproveReason(e.target.value)}
                placeholder="Reason for disapproval..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDisapproveModalTask(null)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !disapproveReason.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  {submittingAction && <Loader2 size={14} className="animate-spin" />}
                  Confirm Disapprove
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Inline component: Collapsible comment thread per review task
// (Separate component so useCommentsAndLogs hook can be called per task)
// ============================================================
function ReviewTaskComments({ task, profilesMap, sendNotification, currentUserId, currentUserName }) {
  const [expanded, setExpanded] = useState(false)
  const { comments, addComment } = useCommentsAndLogs(task.id)

  async function handleAddComment(body) {
    await addComment(body)

    // Send notification to assignee (if not the commenter)
    if (task.assignee_id && task.assignee_id !== currentUserId) {
      await sendNotification({
        userId: task.assignee_id,
        type: 'comment_posted',
        message: `${currentUserName || 'Someone'} commented on "${task.title}" (${task.task_code})`,
        taskId: task.id,
      })
    }

    // Send notification to requestor (if different from assignee and not the commenter)
    if (task.requestor_id && task.requestor_id !== currentUserId && task.requestor_id !== task.assignee_id) {
      await sendNotification({
        userId: task.requestor_id,
        type: 'comment_posted',
        message: `${currentUserName || 'Someone'} commented on "${task.title}" (${task.task_code})`,
        taskId: task.id,
      })
    }
  }

  return (
    <div className="border border-surface-200 dark:border-navy-700 rounded-lg overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-navy-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <MessageSquare size={14} className="text-brand-500" />
          Comments
          {comments.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[10px]">
              {comments.length}
            </span>
          )}
        </div>
        <div className="text-slate-400 dark:text-slate-500">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-surface-200 dark:border-navy-700">
          <CommentsThread
            comments={comments}
            profilesMap={profilesMap}
            onAddComment={handleAddComment}
          />
        </div>
      )}
    </div>
  )
}
