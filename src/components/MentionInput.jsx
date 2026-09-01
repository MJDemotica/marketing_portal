import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, AtSign } from 'lucide-react'

/**
 * MentionInput — A comment input that shows a filterable @mention dropdown.
 *
 * Props:
 *   value          — current text value
 *   onChange        — (newValue: string) => void
 *   onSubmit        — () => void  (called on Enter without Shift)
 *   profilesList    — [{ id, display_name, avatar_url }]
 *   placeholder     — input placeholder
 *   disabled        — disable while submitting
 *   submitting      — show spinner on the send button
 */
export function MentionInput({
  value,
  onChange,
  onSubmit,
  profilesList = [],
  placeholder = 'Add a comment or feedback...',
  disabled = false,
  submitting = false,
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const [highlightedIdx, setHighlightedIdx] = useState(0)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter profiles by the current @query
  const filteredProfiles = profilesList.filter((p) =>
    p.display_name?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIdx(0)
  }, [mentionQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Detect @ trigger on input change
  const handleChange = useCallback(
    (e) => {
      const text = e.target.value
      onChange(text)

      const cursorPos = e.target.selectionStart
      // Walk backwards from cursor to find the nearest unescaped @
      const textBeforeCursor = text.slice(0, cursorPos)
      const lastAtIdx = textBeforeCursor.lastIndexOf('@')

      if (lastAtIdx >= 0) {
        const queryAfterAt = textBeforeCursor.slice(lastAtIdx + 1)
        // Only show dropdown if @ is at start or preceded by a space/newline
        const charBefore = lastAtIdx > 0 ? text[lastAtIdx - 1] : ' '
        if (/[\s]/.test(charBefore) || lastAtIdx === 0) {
          setMentionQuery(queryAfterAt)
          setMentionStartIndex(lastAtIdx)
          setShowDropdown(true)
          return
        }
      }

      setShowDropdown(false)
    },
    [onChange]
  )

  // Insert selected mention
  const insertMention = useCallback(
    (profile) => {
      const before = value.slice(0, mentionStartIndex)
      const after = value.slice(
        mentionStartIndex + 1 + mentionQuery.length // +1 for the @
      )
      const inserted = `${before}@${profile.display_name} ${after}`
      onChange(inserted)
      setShowDropdown(false)
      setMentionQuery('')
      setMentionStartIndex(-1)

      // Re-focus input and set cursor after the inserted mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const cursorPos = before.length + 1 + profile.display_name.length + 1
          inputRef.current.setSelectionRange(cursorPos, cursorPos)
        }
      }, 0)
    },
    [value, mentionStartIndex, mentionQuery, onChange]
  )

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e) => {
    if (showDropdown && filteredProfiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIdx((prev) =>
          prev < filteredProfiles.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIdx((prev) =>
          prev > 0 ? prev - 1 : filteredProfiles.length - 1
        )
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredProfiles[highlightedIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowDropdown(false)
        return
      }
    }

    // Submit on Enter (without Shift) when dropdown is closed
    if (e.key === 'Enter' && !e.shiftKey && !showDropdown) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  // Build initials for avatar fallback
  const getInitials = (name) =>
    (name || '')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="relative">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className="w-full px-3.5 py-2 rounded-lg border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 pr-8"
          />
          {/* @ hint icon */}
          <AtSign
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none"
          />
        </div>

        <button
          type="button"
          onClick={() => onSubmit?.()}
          disabled={disabled || submitting || !value.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Post
        </button>
      </div>

      {/* Mention Dropdown */}
      {showDropdown && filteredProfiles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1.5 w-72 max-h-48 overflow-y-auto bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-surface-200 dark:border-navy-600 z-50"
          style={{ animation: 'fadeInUp 150ms ease-out' }}
        >
          <div className="px-3 py-1.5 border-b border-surface-100 dark:border-navy-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Mention a member
            </span>
          </div>
          {filteredProfiles.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault() // Prevent input blur
                insertMention(p)
              }}
              onMouseEnter={() => setHighlightedIdx(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                idx === highlightedIdx
                  ? 'bg-brand-50 dark:bg-brand-500/10'
                  : 'hover:bg-surface-50 dark:hover:bg-navy-700/40'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-brand-600 dark:text-brand-300 font-bold text-[10px]">
                    {getInitials(p.display_name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {p.display_name}
                </p>
                {p.email && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {p.email}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
