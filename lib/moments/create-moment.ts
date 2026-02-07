/**
 * Consolidated moment creation service (Epic 15.5)
 *
 * Single source of truth for creating moments with AI matching.
 * Used by the API route and calendar sync.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { MomentWithThoughts, MomentSource, CalendarEventData } from "@/types/moments"
import { MAX_MOMENT_DESCRIPTION_LENGTH } from "@/types/moments"
import type { EventType } from "@/lib/moments/title-analysis"
import { combineContextForMatching } from "@/lib/moments/title-analysis"
import { matchGemsToMoment } from "@/lib/matching"
import { LEARNING_HELPFUL_THRESHOLD, LEARNING_CONFIDENCE_THRESHOLD } from "@/lib/types/learning"

export interface CreateMomentParams {
  userId: string
  description: string
  source?: MomentSource
  calendarData?: CalendarEventData
  user_context?: string | null
  detected_event_type?: EventType | null
}

export interface CreateMomentResult {
  moment: MomentWithThoughts | null
  error: string | null
}

/**
 * Create a moment with full AI matching pipeline.
 *
 * Handles: DB insert, gem fetch, learned thoughts lookup,
 * AI matching, moment_gems insert, and match count update.
 */
export async function createMomentWithMatching(
  supabase: SupabaseClient,
  params: CreateMomentParams
): Promise<CreateMomentResult> {
  const {
    userId,
    description,
    source = 'manual',
    calendarData,
    user_context,
    detected_event_type,
  } = params

  // Validate description
  if (!description || typeof description !== "string") {
    return { moment: null, error: "Description is required" }
  }

  if (description.length > MAX_MOMENT_DESCRIPTION_LENGTH) {
    return { moment: null, error: `Description must be ${MAX_MOMENT_DESCRIPTION_LENGTH} characters or less` }
  }

  // Build insert data
  const insertData: Record<string, unknown> = {
    user_id: userId,
    description: description.trim(),
    source,
    status: 'active',
    gems_matched_count: 0,
    user_context: user_context || null,
    detected_event_type: detected_event_type || null,
  }

  if (calendarData) {
    insertData.calendar_event_id = calendarData.event_id
    insertData.calendar_event_title = calendarData.title
    insertData.calendar_event_start = calendarData.start_time
  }

  // Combine description with user context for better matching
  const matchingDescription = combineContextForMatching(
    description.trim(),
    user_context || undefined
  )

  // Insert the moment
  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .insert(insertData)
    .select()
    .single()

  if (momentError) {
    console.error("Moment creation error:", momentError)
    return { moment: null, error: "Failed to create moment" }
  }

  // Fetch active and passive gems for matching
  const { data: gems, error: gemsError } = await supabase
    .from("gems")
    .select("id, content, context_tag, source")
    .eq("user_id", userId)
    .in("status", ["active", "passive"])

  if (gemsError || !gems || gems.length === 0) {
    if (gemsError) {
      console.error("Gems fetch error:", gemsError)
    }
    return {
      moment: { ...moment, matched_thoughts: [] },
      error: null,
    }
  }

  // Fetch learned thoughts that might be relevant
  let learnedGemIds: string[] = []
  try {
    const patternConditions: Array<{ type: string; key: string }> = []

    if (detected_event_type && detected_event_type !== 'unknown') {
      patternConditions.push({ type: 'event_type', key: detected_event_type })
    }

    if (calendarData?.event_id) {
      const baseEventId = calendarData.event_id.split('_')[0]
      patternConditions.push({ type: 'recurring', key: `event:${baseEventId}` })
    }

    const keywords = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5)

    for (const keyword of keywords) {
      patternConditions.push({ type: 'keyword', key: keyword })
    }

    if (patternConditions.length > 0) {
      const { data: learnings } = await supabase
        .from('moment_learnings')
        .select('gem_id, helpful_count, not_helpful_count')
        .eq('user_id', userId)
        .gte('helpful_count', LEARNING_HELPFUL_THRESHOLD)

      if (learnings && learnings.length > 0) {
        const gemHelpfulness = new Map<string, { helpful: number; total: number }>()

        for (const learning of learnings) {
          const existing = gemHelpfulness.get(learning.gem_id)
          const helpful = learning.helpful_count || 0
          const notHelpful = learning.not_helpful_count || 0

          if (existing) {
            existing.helpful += helpful
            existing.total += helpful + notHelpful
          } else {
            gemHelpfulness.set(learning.gem_id, {
              helpful,
              total: helpful + notHelpful,
            })
          }
        }

        learnedGemIds = [...gemHelpfulness.entries()]
          .filter(([, data]) => data.total > 0 && data.helpful / data.total >= LEARNING_CONFIDENCE_THRESHOLD)
          .map(([gemId]) => gemId)
      }
    }
  } catch (learnedError) {
    console.error("Error fetching learned thoughts:", learnedError)
  }

  // Build learned thoughts for AI prompt
  const learnedThoughtsForPrompt = learnedGemIds.length > 0
    ? gems
        .filter(g => learnedGemIds.includes(g.id))
        .map(g => ({
          gem_id: g.id,
          gem_content: g.content,
          confidence_score: 0.8,
          pattern_sources: [] as string[],
          helpful_count: 1,
        }))
    : []

  // Call AI matching directly
  let matchedGems: Array<{
    gem_id: string
    relevance_score: number
    relevance_reason: string | null
  }> = []
  let processingTimeMs = 0

  try {
    const matchResult = await matchGemsToMoment(
      matchingDescription,
      gems.map(g => ({
        id: g.id,
        content: g.content,
        context_tag: g.context_tag,
        source: g.source,
      })),
      learnedThoughtsForPrompt
    )
    matchedGems = matchResult.matches || []
    processingTimeMs = matchResult.processing_time_ms
  } catch (matchError) {
    console.error("AI matching error:", matchError)
  }

  // Insert matched gems
  if (matchedGems.length > 0) {
    const momentGemsData = matchedGems.map((match) => ({
      moment_id: moment.id,
      gem_id: match.gem_id,
      user_id: userId,
      relevance_score: match.relevance_score,
      relevance_reason: match.relevance_reason,
      was_helpful: null,
      was_reviewed: false,
    }))

    await supabase.from("moment_gems").insert(momentGemsData)
  }

  // Update moment with match count and processing time
  await supabase
    .from("moments")
    .update({
      gems_matched_count: matchedGems.length,
      ai_processing_time_ms: processingTimeMs,
    })
    .eq("id", moment.id)

  // Fetch the complete moment with matched thoughts
  const { data: fullMoment } = await supabase
    .from("moments")
    .select("*")
    .eq("id", moment.id)
    .single()

  const { data: momentGemRecords } = await supabase
    .from("moment_gems")
    .select(`
      *,
      thought:gems(*)
    `)
    .eq("moment_id", moment.id)
    .order("relevance_score", { ascending: false })

  return {
    moment: {
      ...(fullMoment || moment),
      matched_thoughts: momentGemRecords || [],
    },
    error: null,
  }
}
