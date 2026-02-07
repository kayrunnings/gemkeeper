import { createClient } from "@/lib/supabase/client"
import type {
  Moment,
  MomentWithThoughts,
  MomentThought,
  MomentSource,
  MomentStatus,
  CalendarEventData
} from "@/types/moments"

/**
 * DB-only moment insert — no AI matching or learned thoughts.
 * For full creation with matching, use createMomentWithMatching from
 * lib/moments/create-moment.ts instead.
 * @internal
 */
export async function createMoment(
  description: string,
  source: MomentSource = 'manual',
  calendarData?: CalendarEventData
): Promise<{ moment: Moment | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { moment: null, error: "Not authenticated" }
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    description,
    source,
    status: 'active',
    gems_matched_count: 0,
  }

  if (calendarData) {
    insertData.calendar_event_id = calendarData.event_id
    insertData.calendar_event_title = calendarData.title
    insertData.calendar_event_start = calendarData.start_time
  }

  const { data, error } = await supabase
    .from("moments")
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return { moment: null, error: error.message }
  }

  return { moment: data, error: null }
}

/**
 * Get a moment with its matched thoughts
 */
export async function getMoment(
  momentId: string
): Promise<{ moment: MomentWithThoughts | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { moment: null, error: "Not authenticated" }
  }

  // Get the moment
  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .select("*")
    .eq("id", momentId)
    .eq("user_id", user.id)
    .single()

  if (momentError) {
    if (momentError.code === "PGRST116") {
      return { moment: null, error: "Moment not found" }
    }
    return { moment: null, error: momentError.message }
  }

  // Get matched thoughts with thought data
  const { data: momentThoughts, error: thoughtsError } = await supabase
    .from("moment_gems")
    .select(`
      *,
      thought:gems(*)
    `)
    .eq("moment_id", momentId)
    .eq("user_id", user.id)
    .order("relevance_score", { ascending: false })

  if (thoughtsError) {
    return { moment: null, error: thoughtsError.message }
  }

  return {
    moment: {
      ...moment,
      matched_thoughts: momentThoughts || [],
    },
    error: null,
  }
}

/**
 * Get recent moments for a user
 */
export async function getRecentMoments(
  limit: number = 10,
  statusFilter?: MomentStatus
): Promise<{ moments: Moment[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { moments: [], error: "Not authenticated" }
  }

  let query = supabase
    .from("moments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (statusFilter) {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query

  if (error) {
    return { moments: [], error: error.message }
  }

  return { moments: data || [], error: null }
}

/**
 * Get all moments (for history page)
 */
export async function getAllMoments(
  sourceFilter?: MomentSource
): Promise<{ moments: Moment[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { moments: [], error: "Not authenticated" }
  }

  let query = supabase
    .from("moments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (sourceFilter) {
    query = query.eq("source", sourceFilter)
  }

  const { data, error } = await query

  if (error) {
    return { moments: [], error: error.message }
  }

  return { moments: data || [], error: null }
}

/**
 * Update a moment's status
 */
export async function updateMomentStatus(
  momentId: string,
  status: MomentStatus
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("moments")
    .update(updateData)
    .eq("id", momentId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Update moment with matched thoughts count and processing time
 */
export async function updateMomentMatchResults(
  momentId: string,
  thoughtsMatchedCount: number,
  processingTimeMs: number
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("moments")
    .update({
      gems_matched_count: thoughtsMatchedCount,  // Database column name (unchanged)
      ai_processing_time_ms: processingTimeMs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", momentId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Record feedback on a matched thought
 */
export async function recordMomentThoughtFeedback(
  momentGemId: string,
  wasHelpful: boolean
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("moment_gems")
    .update({
      was_helpful: wasHelpful,
      was_reviewed: true,
    })
    .eq("id", momentGemId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Mark a thought as reviewed in a moment
 */
export async function markThoughtReviewed(
  momentGemId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("moment_gems")
    .update({ was_reviewed: true })
    .eq("id", momentGemId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Add matched thoughts to a moment
 */
export async function addMomentThoughts(
  momentId: string,
  matches: Array<{
    gem_id: string  // Database column name (unchanged)
    relevance_score: number
    relevance_reason: string | null
  }>
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (matches.length === 0) {
    return { error: null }
  }

  const momentThoughts = matches.map((match) => ({
    moment_id: momentId,
    gem_id: match.gem_id,
    user_id: user.id,
    relevance_score: match.relevance_score,
    relevance_reason: match.relevance_reason,
    was_helpful: null,
    was_reviewed: false,
  }))

  const { error } = await supabase
    .from("moment_gems")
    .insert(momentThoughts)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// Legacy aliases for backward compatibility during migration
export const recordMomentGemFeedback = recordMomentThoughtFeedback
export const markGemReviewed = markThoughtReviewed
export const addMomentGems = addMomentThoughts
