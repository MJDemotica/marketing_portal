import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  UserCircle2,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { useCommentsAndLogs } from '../hooks/useCommentsAndLogs'
import { formatTimeAgo } from '../hooks/useTasksData'
import { CommentsThread } from '../components/CommentsThread'
import { extractMentionedUserIds } from '../utils/mentionUtils'

export default function ReviewPanel() {
  const { profile, isSupervisor } = useAuth()
  const { sendNotification } = useNotifications()

  const [activeTab, setActiveTab] = useState('intake')
  const [intakeTasks, setIntakeTasks] = useState([])
  const [reviewTasks, setReviewTasks] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Revision notes modal state
  const [revisionModalTask, setRevisionModalTask] = useState(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [disapproveModalTask, setDisapproveModalTask] = useState(null)
  const [disapproveReason, setDisapproveReason] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  // Intake Approve & Assign modal state
  const [intakeApproveTask, setIntakeApproveTask] = useState(null)
  const [intakeAssigneeId, setIntakeAssigneeId] = useState('')
  // Intake Decline modal state
  const [intakeDeclineTask, setIntakeDeclineTask] = useState(null)
  const [intakeDeclineReason, setIntakeDeclineReason] = useState('')
  // Marketing team members for assignment dropdown
  const [marketingMembers, setMarketingMembers] = useState([])

  // Fetch tasks in "pending" (intake) and "for_review" (deliverables)
  const fetchReviewTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Load profiles map
      const { data: profs } = await supabase.from('profiles').select('*')
      const pMap = {}
      if (profs) profs.forEach((p) => (pMap[p.id] = p))
      setProfilesMap(pMap)

      // 2. Load Department Intake Queue (for Supervisors)
      if (isSupervisor) {
        const { data: intakeData, error: iErr } = await supabase
          .from('tasks')
          .select('*')
          .in('status', ['pending', 'pending_supervisor_review', 'submitted_by_department'])
          .order('created_at', { ascending: false })

        if (iErr) throw iErr
        setIntakeTasks(intakeData || [])
      }

      // 3. Load tasks in for_review
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
  }, [isSupervisor, profile?.id])

  useEffect(() => {
    fetchReviewTasks()
  }, [fetchReviewTasks])

  // Load marketing team members for the Approve & Assign dropdown
  useEffect(() => {
    async function loadMarketingMembers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('department', 'Marketing')
        .order('display_name')
      if (data) setMarketingMembers(data)
    }
    loadMarketingMembers()
  }, [])

  // Approve & Assign intake request → converts to active marketing task
  async function handleIntakeApprove(e) {
    e.preventDefault()
    if (!intakeApproveTask || !intakeAssigneeId) return

    setSubmittingAction(true)
    try {
      const task = intakeApproveTask

      // 1. Update task: status → assigned, set assignee
      const { error: uErr } = await supabase
        .from('tasks')
        .update({
          status: 'assigned',
          assignee_id: intakeAssigneeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (uErr) throw uErr

      // 2. Post comment noting the approval
      const assignee = marketingMembers.find(m => m.id === intakeAssigneeId)
      const assigneeName = assignee ? assignee.display_name : 'a team member'
      await supabase.from('comments').insert({
        task_id: task.id,
        user_id: profile?.id,
        body: `[APPROVED & ASSIGNED]: Request approved and assigned to ${assigneeName}.`,
      })

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        user_id: profile?.id,
        action: 'intake_approved',
        details: { assignee_id: intakeAssigneeId, assignee_name: assigneeName },
      })

      // 4. Notify the department requestor
      if (task.requestor_id && task.requestor_id !== profile?.id) {
        await sendNotification({
          userId: task.requestor_id,
          type: 'task_approved',
          message: `Your request "${task.title}" (${task.task_code}) has been approved and assigned to ${assigneeName}!`,
          taskId: task.id,
        })
      }

      // 5. Notify the assigned marketing member
      if (intakeAssigneeId !== profile?.id) {
        await sendNotification({
          userId: intakeAssigneeId,
          type: 'task_assigned',
          message: `You've been assigned a new department request: "${task.title}" (${task.task_code})`,
          taskId: task.id,
        })
      }

      setIntakeApproveTask(null)
      setIntakeAssigneeId('')
      await fetchReviewTasks()
    } catch (err) {
      console.error('Error approving intake request:', err)
    } finally {
      setSubmittingAction(false)
    }
  }

  // Decline intake request
  async function handleIntakeDecline(e) {
    e.preventDefault()
    if (!intakeDeclineTask || !intakeDeclineReason.trim()) return

    setSubmittingAction(true)
    try {
      const task = intakeDeclineTask

      // 1. Update task: status → disapproved, store decline_reason
      const { error: uErr } = await supabase
        .from('tasks')
        .update({
          status: 'disapproved',
          decline_reason: intakeDeclineReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (uErr) throw uErr

      // 2. Post comment with decline reason
      await supabase.from('comments').insert({
        task_id: task.id,
        user_id: profile?.id,
        body: `[REQUEST DECLINED]: ${intakeDeclineReason.trim()}`,
      })

      // 3. Log activity
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        user_id: profile?.id,
        action: 'intake_declined',
        details: { reason: intakeDeclineReason.trim() },
      })

      // 4. Notify department requestor
      if (task.requestor_id && task.requestor_id !== profile?.id) {
        await sendNotification({
          userId: task.requestor_id,
          type: 'task_disapproved',
          message: `Your request "${task.title}" (${task.task_code}) was declined.`,
          taskId: task.id,
        })
      }

      setIntakeDeclineTask(null)
      setIntakeDeclineReason('')
      await fetchReviewTasks()
    } catch (err) {
      console.error('Error declining intake request:', err)
    } finally {
      setSubmittingAction(false)
    }
  }

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
      {/* Action bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={fetchReviewTasks}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-300 dark:border-navy-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-navy-700 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Supervisor Tab Switcher */}
      {isSupervisor && (
        <div className="flex items-center gap-2 border-b border-surface-200 dark:border-navy-600 pb-3">
          <button
            onClick={() => setActiveTab('intake')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'intake'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-surface-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-navy-700'
            }`}
          >
            <Clock size={14} />
            Department Request Intake
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'intake' ? 'bg-white/20 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
            }`}>
              {intakeTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'review'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-surface-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-surface-200 dark:hover:bg-navy-700'
            }`}
          >
            <CheckCircle2 size={14} />
            Marketing Deliverables Review
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'review' ? 'bg-white/20 text-white' : 'bg-surface-300 dark:bg-navy-600 text-slate-700 dark:text-slate-200'
            }`}>
              {reviewTasks.length}
            </span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. DEPARTMENT INTAKE QUEUE (SUPERVISOR ONLY) */}
      {/* ============================================================ */}
      {isSupervisor && activeTab === 'intake' && (
        <div>
          {intakeTasks.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-500/10 mb-4">
                <CircleCheck size={36} className="text-brand-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                Intake Queue is Empty
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                No pending requests from department accounts. New requests submitted by Accounting, Corporate, HR, Litigation, or Operations will appear here for feasibility review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-600 dark:text-brand-400">
                  Incoming Department Requests ({intakeTasks.length})
                </p>
                <span className="text-xs text-slate-400">
                  Visible exclusively to Marketing Supervisors
                </span>
              </div>

              {intakeTasks.map((task) => {
                const requestor = profilesMap[task.requestor_id]
                const requestorName = requestor ? requestor.display_name : 'Department Requester'

                return (
                  <div
                    key={task.id}
                    className="card p-6 border-l-4 border-l-brand-500 space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-500/30">
                          {task.task_code}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                          {task.department || 'Department'}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {task.priority || 'NORMAL'}
                        </span>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                          {task.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <Clock size={13} />
                        <span>Submitted {formatTimeAgo(task.created_at)}</span>
                      </div>
                    </div>

                    {/* Metadata Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-50 dark:bg-navy-800/60 p-3 rounded-lg border border-surface-100 dark:border-navy-700">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Requesting Dept: </span>
                        <strong className="text-slate-700 dark:text-slate-200">{task.department || 'Department'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Submitted by: </span>
                        <strong className="text-slate-700 dark:text-slate-200">{requestorName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Requested Due Date: </span>
                        <strong className="text-slate-700 dark:text-slate-200">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None requested'}
                        </strong>
                      </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-navy-800 p-3.5 rounded-lg border border-surface-200 dark:border-navy-700 whitespace-pre-wrap">
                        {task.description}
                      </p>
                    )}

                    {/* Attachment Link */}
                    {task.attachment_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Reference / Attachment:</span>
                        <a
                          href={task.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 font-semibold underline"
                        >
                          <ExternalLink size={13} />
                          {task.attachment_url}
                        </a>
                      </div>
                    )}

                    {/* Collapsible Comments Thread */}
                    <ReviewTaskComments
                      task={task}
                      profilesMap={profilesMap}
                      sendNotification={sendNotification}
                      currentUserId={profile?.id}
                      currentUserName={profile?.display_name}
                    />

                    {/* Supervisor Feasibility Review Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-surface-200 dark:border-navy-700">
                      {/* Decline */}
                      <button
                        onClick={() => {
                          setIntakeDeclineTask(task)
                          setIntakeDeclineReason('')
                        }}
                        disabled={submittingAction}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-colors"
                      >
                        <XCircle size={15} />
                        Decline Request
                      </button>

                      {/* Approve & Assign */}
                      <button
                        onClick={() => {
                          setIntakeApproveTask(task)
                          setIntakeAssigneeId('')
                        }}
                        disabled={submittingAction}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={15} />
                        Approve & Assign
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MARKETING DELIVERABLES REVIEW */}
      {/* ============================================================ */}
      {(!isSupervisor || activeTab === 'review') && (
        <div>
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
                Everything is up to date. Marketing deliverables submitted for review will appear here.
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
    </div>
  )}

      {/* Request Revision Modal */}
      {revisionModalTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setRevisionModalTask(null)} />
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
        </div>,
        document.body
      )}

      {/* Disapprove Modal */}
      {disapproveModalTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDisapproveModalTask(null)} />
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
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* Intake: Approve & Assign Modal */}
      {/* ============================================================ */}
      {intakeApproveTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIntakeApproveTask(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                Approve & Assign
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Approve <strong>{intakeApproveTask.task_code}</strong> — <em>"{intakeApproveTask.title}"</em> — and assign it to a Marketing team member.
              </p>
            </div>

            {/* Request summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-50 dark:bg-navy-800/60 p-3 rounded-lg border border-surface-100 dark:border-navy-700">
              <div>
                <span className="text-slate-400">Department:</span>
                <strong className="ml-1 text-slate-700 dark:text-slate-200">{intakeApproveTask.department}</strong>
              </div>
              <div>
                <span className="text-slate-400">Priority:</span>
                <strong className="ml-1 text-slate-700 dark:text-slate-200 uppercase">{intakeApproveTask.priority || 'normal'}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Due Date:</span>
                <strong className="ml-1 text-slate-700 dark:text-slate-200">
                  {intakeApproveTask.due_date ? new Date(intakeApproveTask.due_date).toLocaleDateString() : 'None'}
                </strong>
              </div>
            </div>

            <form onSubmit={handleIntakeApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  <UserCircle2 size={14} className="inline mr-1 -mt-0.5" />
                  Assign to Marketing Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={intakeAssigneeId}
                  onChange={(e) => setIntakeAssigneeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                >
                  <option value="">Select a team member...</option>
                  {marketingMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.role === 'supervisor' ? '(Supervisor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIntakeApproveTask(null)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !intakeAssigneeId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors"
                >
                  {submittingAction && <Loader2 size={14} className="animate-spin" />}
                  Approve & Assign
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* Intake: Decline Request Modal */}
      {/* ============================================================ */}
      {intakeDeclineTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIntakeDeclineTask(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                Decline Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Decline <strong>{intakeDeclineTask.task_code}</strong> — <em>"{intakeDeclineTask.title}"</em> — and provide a reason to the requesting department.
              </p>
            </div>

            <form onSubmit={handleIntakeDecline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Reason for Declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={intakeDeclineReason}
                  onChange={(e) => setIntakeDeclineReason(e.target.value)}
                  placeholder="E.g. Not feasible within the requested timeline, insufficient details, not within marketing scope..."
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIntakeDeclineTask(null)}
                  className="px-4 py-2 rounded-lg border border-surface-300 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !intakeDeclineReason.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  {submittingAction && <Loader2 size={14} className="animate-spin" />}
                  Confirm Decline
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

// ============================================================
// Inline component: Collapsible comment thread per review task
// (Separate component so useCommentsAndLogs hook can be called per task)
// ============================================================
function ReviewTaskComments({ task, profilesMap, sendNotification, currentUserId, currentUserName }) {
  const [expanded, setExpanded] = useState(false)
  const { comments, addComment } = useCommentsAndLogs(task.id)

  // Derive profilesList from profilesMap for the mention dropdown
  const profilesList = Object.values(profilesMap)

  async function handleAddComment(body) {
    // Extract mentioned user IDs from the comment body
    const mentionedIds = extractMentionedUserIds(body, profilesList)
    await addComment(body, mentionedIds)

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
            profilesList={profilesList}
            onAddComment={handleAddComment}
          />
        </div>
      )}
    </div>
  )
}
