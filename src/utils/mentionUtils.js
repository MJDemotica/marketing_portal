import React from 'react'

/**
 * Scans comment text for @DisplayName patterns and returns an array of
 * React elements — plain text segments interleaved with highlighted badges
 * for each valid mention.
 *
 * Matches "@First Last" or "@FirstName" patterns.
 */
export function parseMentions(text, profilesMap) {
  if (!text || !profilesMap) return text

  // Build a lookup: lowercased display_name → profile
  const nameToProfile = {}
  Object.values(profilesMap).forEach((p) => {
    if (p?.display_name) {
      nameToProfile[p.display_name.toLowerCase()] = p
    }
  })

  if (Object.keys(nameToProfile).length === 0) return text

  // Build a regex that matches @DisplayName for every known profile
  // Sort by length descending so "John Smith" is matched before "John"
  const names = Object.values(profilesMap)
    .map((p) => p?.display_name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`@(${escaped.join('|')})`, 'gi')

  const parts = []
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    // Push text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const mentionedName = match[1]
    const profile = nameToProfile[mentionedName.toLowerCase()]

    parts.push(
      React.createElement(
        'span',
        {
          key: `mention-${match.index}`,
          className:
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold text-[11px] cursor-default',
          title: profile?.email || mentionedName,
        },
        `@${profile?.display_name || mentionedName}`
      )
    )

    lastIndex = pattern.lastIndex
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  // If no mentions were found, return the original string
  if (parts.length === 0) return text

  return parts
}

/**
 * Extracts user IDs from all valid @DisplayName occurrences in the text.
 * Returns a deduplicated array of user IDs.
 */
export function extractMentionedUserIds(text, profilesList) {
  if (!text || !profilesList || profilesList.length === 0) return []

  const ids = new Set()

  // Sort by display_name length descending to match longer names first
  const sorted = [...profilesList]
    .filter((p) => p?.display_name)
    .sort((a, b) => b.display_name.length - a.display_name.length)

  const escaped = sorted.map((p) =>
    p.display_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  const pattern = new RegExp(`@(${escaped.join('|')})`, 'gi')

  let match
  while ((match = pattern.exec(text)) !== null) {
    const mentionedName = match[1].toLowerCase()
    const profile = sorted.find(
      (p) => p.display_name.toLowerCase() === mentionedName
    )
    if (profile) {
      ids.add(profile.id)
    }
  }

  return Array.from(ids)
}
