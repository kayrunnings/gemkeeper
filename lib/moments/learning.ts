/**
 * Learning Service for Moment Intelligence (Epic 14)
 *
 * Records and retrieves learned thought associations based on patterns
 * from user feedback (helpful/not helpful).
 */

import { createClient } from "@/lib/supabase/client"
import type {
  MomentLearning,
  PatternType,
  LearnedThought,
  MomentPatterns,
  RecurringMatch,
} from "@/lib/types/learning"
import {
  LEARNING_HELPFUL_THRESHOLD,
  LEARNING_CONFIDENCE_THRESHOLD,
  STOP_WORDS,
} from "@/lib/types/learning"
import type { EventType } from "@/lib/moments/title-analysis"
import type { Moment } from "@/types/moments"

// Re-export constants for convenience
export { LEARNING_HELPFUL_THRESHOLD, LEARNING_CONFIDENCE_THRESHOLD } from "@/lib/types/learning"

/**
 * Extract keywords from text for pattern matching
 */
export function extractKeywords(text: string): string[] {
  if (!text) return []

  // Tokenize and normalize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2)  // Skip very short words
    .filter(word => !STOP_WORDS.has(word))  // Remove stop words

  // Deduplicate
  return [...new Set(words)]
}

/**
 * Extract all patterns from a moment for learning
 */
export function extractPatterns(moment: Moment): MomentPatterns {
  const keywords = extractKeywords(
    `${moment.description} ${moment.user_context || ''}`
  )

  return {
    eventType: moment.detected_event_type as EventType | undefined,
    keywords,
    externalEventId: moment.calendar_event_id || undefined,
    userContext: moment.user_context || undefined,
  }
}

/**
 * Record that a thought was helpful for a moment
 */
export async function recordHelpfulThought(
  userId: string,
  momentId: string,
  gemId: string,
  moment: Moment
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // Extract patterns from the moment
  const patterns = extractPatterns(moment)
  const learningsToUpsert: Array<{
    user_id: string
    pattern_type: PatternType
    pattern_key: string
    gem_id: string
  }> = []

  // Pattern 1: Event type
  if (patterns.eventType && patterns.eventType !== 'unknown') {
    learningsToUpsert.push({
      user_id: userId,
      pattern_type: 'event_type',
      pattern_key: patterns.eventType,
      gem_id: gemId,
    })
  }

  // Pattern 2: Keywords (top 5 to avoid noise)
  const topKeywords = patterns.keywords.slice(0, 5)
  for (const keyword of topKeywords) {
    learningsToUpsert.push({
      user_id: userId,
      pattern_type: 'keyword',
      pattern_key: keyword,
      gem_id: gemId,
    })
  }

  // Pattern 3: Recurring event (calendar event ID)
  if (patterns.externalEventId) {
    // Extract base event ID (Google Calendar uses the same base ID for recurring events)
    const baseEventId = patterns.externalEventId.split('_')[0]
    learningsToUpsert.push({
      user_id: userId,
      pattern_type: 'recurring',
      pattern_key: `event:${baseEventId}`,
      gem_id: gemId,
    })
  }

  // Upsert each learning (increment helpful_count if exists)
  for (const learning of learningsToUpsert) {
    // Check if exists
    const { data: existing } = await supabase
      .from('moment_learnings')
      .select('id, helpful_count')
      .eq('user_id', learning.user_id)
      .eq('pattern_type', learning.pattern_type)
      .eq('pattern_key', learning.pattern_key)
      .eq('gem_id', learning.gem_id)
      .single()

    if (existing) {
      // Increment helpful count
      const { error } = await supabase
        .from('moment_learnings')
        .update({
          helpful_count: existing.helpful_count + 1,
          last_helpful_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating learning:', error)
      }
    } else {
      // Create new learning
      const { error } = await supabase
        .from('moment_learnings')
        .insert(learning)

      if (error) {
        // Ignore unique constraint violations (race condition)
        if (!error.message.includes('unique')) {
          console.error('Error creating learning:', error)
        }
      }
    }
  }

  return { error: null }
}

/**
 * Record that a thought was NOT helpful for a moment
 */
export async function recordNotHelpfulThought(
  userId: string,
  momentId: string,
  gemId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // Update all learnings for this gem to increment not_helpful_count
  const { data: learnings, error: fetchError } = await supabase
    .from('moment_learnings')
    .select('id, helpful_count, not_helpful_count')
    .eq('user_id', userId)
    .eq('gem_id', gemId)

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!learnings || learnings.length === 0) {
    return { error: null } // No learnings to update
  }

  // Update each learning
  for (const learning of learnings) {
    const { error } = await supabase
      .from('moment_learnings')
      .update({
        not_helpful_count: learning.not_helpful_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', learning.id)

    if (error) {
      console.error('Error updating learning:', error)
    }
  }

  return { error: null }
}

/**
 * Get learned thoughts for a moment based on matching patterns
 */
export async function getLearnedThoughts(
  userId: string,
  patterns: MomentPatterns
): Promise<{ thoughts: LearnedThought[]; error: string | null }> {
  const supabase = createClient()

  // Build pattern keys to search for
  const patternConditions: Array<{ type: PatternType; key: string }> = []

  // Event type pattern
  if (patterns.eventType && patterns.eventType !== 'unknown') {
    patternConditions.push({ type: 'event_type', key: patterns.eventType })
  }

  // Keyword patterns
  for (const keyword of patterns.keywords) {
    patternConditions.push({ type: 'keyword', key: keyword })
  }

  // Recurring event pattern
  if (patterns.externalEventId) {
    const baseEventId = patterns.externalEventId.split('_')[0]
    patternConditions.push({ type: 'recurring', key: `event:${baseEventId}` })
  }

  if (patternConditions.length === 0) {
    return { thoughts: [], error: null }
  }

  // Query learnings that match any pattern
  const { data: learnings, error } = await supabase
    .from('moment_learnings')
    .select(`
      id,
      pattern_type,
      pattern_key,
      gem_id,
      helpful_count,
      not_helpful_count
    `)
    .eq('user_id', userId)
    .gte('helpful_count', LEARNING_HELPFUL_THRESHOLD) // Only established patterns

  if (error) {
    return { thoughts: [], error: error.message }
  }

  if (!learnings || learnings.length === 0) {
    return { thoughts: [], error: null }
  }

  // Filter learnings that match our patterns
  const matchingLearnings = learnings.filter(learning => {
    return patternConditions.some(
      p => p.type === learning.pattern_type && p.key === learning.pattern_key
    )
  })

  if (matchingLearnings.length === 0) {
    return { thoughts: [], error: null }
  }

  // Group by gem_id and aggregate
  const gemMap = new Map<string, {
    helpful_count: number
    not_helpful_count: number
    pattern_sources: string[]
  }>()

  for (const learning of matchingLearnings) {
    const existing = gemMap.get(learning.gem_id)
    const patternSource = `${learning.pattern_type}:${learning.pattern_key}`

    if (existing) {
      existing.helpful_count += learning.helpful_count
      existing.not_helpful_count += learning.not_helpful_count
      existing.pattern_sources.push(patternSource)
    } else {
      gemMap.set(learning.gem_id, {
        helpful_count: learning.helpful_count,
        not_helpful_count: learning.not_helpful_count,
        pattern_sources: [patternSource],
      })
    }
  }

  // Calculate confidence and filter
  const learnedThoughts: LearnedThought[] = []

  for (const [gemId, data] of gemMap.entries()) {
    const total = data.helpful_count + data.not_helpful_count
    const confidence = data.helpful_count / total

    // Only include if confidence >= 0.7
    if (confidence >= 0.7) {
      // Fetch gem content
      const { data: gem } = await supabase
        .from('gems')
        .select('content')
        .eq('id', gemId)
        .single()

      if (gem) {
        learnedThoughts.push({
          gem_id: gemId,
          gem_content: gem.content,
          confidence_score: confidence,
          pattern_sources: data.pattern_sources,
          helpful_count: data.helpful_count,
        })
      }
    }
  }

  // Sort by confidence (descending)
  learnedThoughts.sort((a, b) => b.confidence_score - a.confidence_score)

  return { thoughts: learnedThoughts, error: null }
}

/**
 * Check if a moment is recurring (has been seen before)
 */
export async function checkRecurring(
  userId: string,
  eventId?: string,
  title?: string
): Promise<RecurringMatch> {
  const supabase = createClient()

  // Method A: Check for exact event ID match
  if (eventId) {
    const baseEventId = eventId.split('_')[0]

    const { data: previousMoments } = await supabase
      .from('moments')
      .select(`
        id,
        calendar_event_id
      `)
      .eq('user_id', userId)
      .like('calendar_event_id', `${baseEventId}%`)
      .neq('calendar_event_id', eventId) // Exclude current event
      .order('created_at', { ascending: false })
      .limit(1)

    if (previousMoments && previousMoments.length > 0) {
      // Get helpful thoughts from previous moment
      const { data: helpfulThoughts } = await supabase
        .from('moment_gems')
        .select('gem_id')
        .eq('moment_id', previousMoments[0].id)
        .eq('was_helpful', true)

      return {
        isRecurring: true,
        matchType: 'exact_event_id',
        previousMomentId: previousMoments[0].id,
        previousHelpfulThoughts: helpfulThoughts?.map(t => t.gem_id) || [],
      }
    }
  }

  // Method B: Fuzzy title match
  if (title) {
    const normalizedTitle = title.toLowerCase().trim()

    const { data: similarMoments } = await supabase
      .from('moments')
      .select(`
        id,
        calendar_event_title,
        created_at
      `)
      .eq('user_id', userId)
      .not('calendar_event_title', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50) // Check recent moments

    if (similarMoments) {
      // Find fuzzy match
      const match = similarMoments.find(m => {
        if (!m.calendar_event_title) return false
        const prevTitle = m.calendar_event_title.toLowerCase().trim()
        // Simple similarity: exact match or one contains the other
        return prevTitle === normalizedTitle ||
          prevTitle.includes(normalizedTitle) ||
          normalizedTitle.includes(prevTitle)
      })

      if (match) {
        // Get helpful thoughts
        const { data: helpfulThoughts } = await supabase
          .from('moment_gems')
          .select('gem_id')
          .eq('moment_id', match.id)
          .eq('was_helpful', true)

        return {
          isRecurring: true,
          matchType: 'fuzzy_pattern',
          previousMomentId: match.id,
          previousHelpfulThoughts: helpfulThoughts?.map(t => t.gem_id) || [],
        }
      }
    }
  }

  return { isRecurring: false }
}

/**
 * Get learning statistics for a user (for debugging/analytics)
 */
export async function getLearningStats(
  userId: string
): Promise<{
  totalLearnings: number
  byPatternType: Record<PatternType, number>
  topThoughts: Array<{ gemId: string; totalHelpful: number }>
  error: string | null
}> {
  const supabase = createClient()

  const { data: learnings, error } = await supabase
    .from('moment_learnings')
    .select('pattern_type, gem_id, helpful_count')
    .eq('user_id', userId)

  if (error) {
    return {
      totalLearnings: 0,
      byPatternType: { event_type: 0, keyword: 0, recurring: 0, attendee: 0 },
      topThoughts: [],
      error: error.message,
    }
  }

  // Aggregate stats
  const byPatternType: Record<PatternType, number> = {
    event_type: 0,
    keyword: 0,
    recurring: 0,
    attendee: 0,
  }

  const thoughtHelpful = new Map<string, number>()

  for (const learning of learnings || []) {
    byPatternType[learning.pattern_type as PatternType]++

    const current = thoughtHelpful.get(learning.gem_id) || 0
    thoughtHelpful.set(learning.gem_id, current + learning.helpful_count)
  }

  // Top thoughts by helpful count
  const topThoughts = [...thoughtHelpful.entries()]
    .map(([gemId, totalHelpful]) => ({ gemId, totalHelpful }))
    .sort((a, b) => b.totalHelpful - a.totalHelpful)
    .slice(0, 10)

  return {
    totalLearnings: learnings?.length || 0,
    byPatternType,
    topThoughts,
    error: null,
  }
}
