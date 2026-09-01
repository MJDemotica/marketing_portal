import { useState, useRef, useEffect } from 'react'
import { formatTimeAgo } from '../hooks/useTasksData'
import { MentionInput } from './MentionInput'
import { parseMentions } from '../utils/mentionUtils'

export function CommentsThread({ comments, profilesMap, profilesList = [], onAddComment }) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const commentsEndRef = useRef(null)

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length])

  async function handleSubmit() {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      await onAddComment(newComment)
      setNewComment('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const author = profilesMap[comment.user_id]
            const authorName = author ? author.display_name : 'Team Member'
            const initials = authorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <div
                key={comment.id}
                className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-navy-800/60 rounded-xl border border-surface-200 dark:border-navy-700"
              >
                <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-brand-600 dark:text-brand-300 font-bold text-xs">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {authorName}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {parseMentions(comment.body, profilesMap)}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
            No comments yet. Start the discussion below.
          </div>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Form — with @mention support */}
      <MentionInput
        value={newComment}
        onChange={setNewComment}
        onSubmit={handleSubmit}
        profilesList={profilesList}
        placeholder="Add a comment... Type @ to mention"
        disabled={submitting}
        submitting={submitting}
      />
    </div>
  )
}

