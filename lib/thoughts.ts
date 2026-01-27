import { createClient } from "@/lib/supabase/client"
import { Thought, CreateThoughtInput, MAX_ACTIVE_LIST } from "@/lib/types/thought"

/**
 * Create multiple thoughts at once (for AI extraction)
 * Note: New thoughts default to is_on_active_list = false (Passive)
 * Per-context limits should be checked by caller before calling this
 */
export async function createMultipleThoughts(
  thoughts: Array<{
    content: string
    context_id?: string
    context_tag?: CreateThoughtInput["context_tag"]
    source?: string
    source_url?: string
    is_on_active_list?: boolean
  }>
): Promise<{ thoughts: Thought[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thoughts: [], error: "Not authenticated" }
  }

  // If any thoughts want to be on Active List, check the limit
  const wantActiveCount = thoughts.filter(t => t.is_on_active_list).length
  if (wantActiveCount > 0) {
    const { count: currentActiveListCount } = await supabase
      .from("gems")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_on_active_list", true)

    const availableActiveSlots = MAX_ACTIVE_LIST - (currentActiveListCount || 0)
    if (wantActiveCount > availableActiveSlots) {
      return {
        thoughts: [],
        error: `Active List is limited to ${MAX_ACTIVE_LIST} thoughts. You have ${availableActiveSlots} slot${availableActiveSlots === 1 ? "" : "s"} available.`
      }
    }
  }

  // Prepare thoughts for insertion
  // New thoughts default to Passive (is_on_active_list = false)
  const thoughtsToInsert = thoughts.map((thought) => ({
    user_id: user.id,
    content: thought.content,
    context_id: thought.context_id || null,
    context_tag: thought.context_tag || "other",
    source: thought.source || null,
    source_url: thought.source_url || null,
    is_on_active_list: thought.is_on_active_list ?? false,
    status: "active" as const,
    application_count: 0,
    skip_count: 0,
  }))

  const { data, error } = await supabase
    .from("gems")
    .insert(thoughtsToInsert)
    .select()

  if (error) {
    return { thoughts: [], error: error.message }
  }

  return { thoughts: data || [], error: null }
}

// Update a thought with partial data
export async function updateThought(
  id: string,
  input: Partial<CreateThoughtInput>
): Promise<{ thought: Thought | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thought: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gems")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { thought: null, error: error.message }
  }

  return { thought: data, error: null }
}

// Retire a thought (archive or release)
export async function retireThought(
  id: string,
  mode: "release" | "archive"
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (mode === "release") {
    // Permanently delete the thought
    const { error } = await supabase
      .from("gems")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Archive the thought (set status to retired)
    const { error } = await supabase
      .from("gems")
      .update({
        status: "retired",
        retired_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return { error: error.message }
    }
  }

  return { error: null }
}

// Graduate a thought (requires 5+ applications)
export async function graduateThought(
  id: string
): Promise<{ thought: Thought | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thought: null, error: "Not authenticated" }
  }

  // First check if thought has 5+ applications
  const { data: existingThought, error: fetchError } = await supabase
    .from("gems")
    .select("application_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !existingThought) {
    return { thought: null, error: "Thought not found" }
  }

  if (existingThought.application_count < 5) {
    return { thought: null, error: "Thought must have at least 5 applications to graduate" }
  }

  const { data, error } = await supabase
    .from("gems")
    .update({
      status: "graduated",
      graduated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { thought: null, error: error.message }
  }

  return { thought: data, error: null }
}

/**
 * Get the daily thought for prompts
 * IMPORTANT: Only returns thoughts on the Active List (is_on_active_list = true)
 * This is the core accountability feature - only Active List thoughts surface in daily prompts
 */
export async function getDailyThought(): Promise<{ thought: Thought | null; alreadyCheckedIn: boolean; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thought: null, alreadyCheckedIn: false, error: "Not authenticated" }
  }

  // Check if user has already done a daily check-in today (also check legacy evening_checkin)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data: todayCheckin } = await supabase
    .from("gem_checkins")
    .select("id, response")
    .eq("user_id", user.id)
    .in("checkin_type", ["daily_checkin", "evening_checkin"])
    .gte("created_at", todayISO)
    .limit(1)
    .maybeSingle()

  if (todayCheckin) {
    // User already checked in today - return null thought but mark as done
    return { thought: null, alreadyCheckedIn: true, error: null }
  }

  // Only get thoughts that are on the Active List with active or passive status
  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])
    .eq("is_on_active_list", true)
    .order("last_surfaced_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No thoughts found on Active List
      return { thought: null, alreadyCheckedIn: false, error: null }
    }
    return { thought: null, alreadyCheckedIn: false, error: error.message }
  }

  return { thought: data, alreadyCheckedIn: false, error: null }
}

/**
 * Toggle a thought's Active List status
 * Returns error if trying to add when Active List is at limit (10)
 */
export async function toggleActiveList(
  thoughtId: string
): Promise<{ thought: Thought | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thought: null, error: "Not authenticated" }
  }

  // Get current thought to check its status
  const { data: currentThought, error: fetchError } = await supabase
    .from("gems")
    .select("*")
    .eq("id", thoughtId)
    .eq("user_id", user.id)
    .single()

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return { thought: null, error: "Thought not found" }
    }
    return { thought: null, error: fetchError.message }
  }

  const newActiveStatus = !currentThought.is_on_active_list

  // If adding to Active List, check limit
  if (newActiveStatus) {
    const { count } = await supabase
      .from("gems")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_on_active_list", true)

    if ((count || 0) >= MAX_ACTIVE_LIST) {
      return {
        thought: null,
        error: `Active List is limited to ${MAX_ACTIVE_LIST} thoughts. Remove one before adding another.`
      }
    }
  }

  // Update the thought
  const { data, error } = await supabase
    .from("gems")
    .update({
      is_on_active_list: newActiveStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", thoughtId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { thought: null, error: error.message }
  }

  return { thought: data, error: null }
}

/**
 * Get the current count of thoughts on the Active List
 */
export async function getActiveListCount(): Promise<{ count: number; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0, error: "Not authenticated" }
  }

  const { count, error } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_on_active_list", true)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}

/**
 * Get all thoughts for Moments matching
 * IMPORTANT: Returns ALL thoughts (Active + Passive) from ALL contexts
 * This is intentional - Moments should search the full wisdom library
 */
export async function getAllThoughtsForMoments(): Promise<{ thoughts: Thought[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thoughts: [], error: "Not authenticated" }
  }

  // Get ALL active and passive thoughts regardless of is_on_active_list or context
  // Retired and graduated thoughts are excluded
  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])

  if (error) {
    return { thoughts: [], error: error.message }
  }

  return { thoughts: data || [], error: null }
}

// Log a check-in for a thought
export async function logCheckin(
  thoughtId: string,
  type: "morning_prompt" | "evening_checkin" | "daily_checkin",
  response: "yes" | "no" | "maybe",
  note?: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Create the check-in record
  const { error: checkinError } = await supabase
    .from("gem_checkins")
    .insert({
      gem_id: thoughtId,
      user_id: user.id,
      checkin_type: type,
      response,
      note: note || null,
    })

  if (checkinError) {
    return { error: checkinError.message }
  }

  // Update the thought's last_surfaced_at
  const updateData: Record<string, unknown> = {
    last_surfaced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // If daily check-in (or legacy evening check-in) with "yes", increment application_count and update last_applied_at
  if ((type === "daily_checkin" || type === "evening_checkin") && response === "yes") {
    const { data: thought } = await supabase
      .from("gems")
      .select("application_count")
      .eq("id", thoughtId)
      .single()

    if (thought) {
      updateData.application_count = thought.application_count + 1
      updateData.last_applied_at = new Date().toISOString()
    }
  }

  // If daily check-in (or legacy evening check-in) with "no", increment skip_count
  if ((type === "daily_checkin" || type === "evening_checkin") && response === "no") {
    const { data: thought } = await supabase
      .from("gems")
      .select("skip_count")
      .eq("id", thoughtId)
      .single()

    if (thought) {
      updateData.skip_count = thought.skip_count + 1
    }
  }

  const { error: updateError } = await supabase
    .from("gems")
    .update(updateData)
    .eq("id", thoughtId)
    .eq("user_id", user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { error: null }
}

// Reset skip count (for keeping a stale thought)
export async function resetSkipCount(thoughtId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("gems")
    .update({
      skip_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", thoughtId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// Get graduated thoughts for thought bank
export async function getGraduatedThoughts(): Promise<{ thoughts: Thought[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thoughts: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "graduated")
    .order("graduated_at", { ascending: false })

  if (error) {
    return { thoughts: [], error: error.message }
  }

  return { thoughts: data || [], error: null }
}

/**
 * Get retired thoughts for the Retired page
 */
export async function getRetiredThoughts(): Promise<{ thoughts: Thought[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thoughts: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "retired")
    .order("retired_at", { ascending: false })

  if (error) {
    return { thoughts: [], error: error.message }
  }

  return { thoughts: data || [], error: null }
}

/**
 * Restore a retired thought back to active status
 */
export async function restoreThought(
  id: string
): Promise<{ thought: Thought | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thought: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gems")
    .update({
      status: "active",
      retired_at: null,
      is_on_active_list: false, // Restored thoughts go to passive list
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { thought: null, error: error.message }
  }

  return { thought: data, error: null }
}

/**
 * Permanently delete a thought (hard delete)
 */
export async function deleteThought(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("gems")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// Legacy aliases for backward compatibility during migration
export const createMultipleGems = createMultipleThoughts
export const updateGem = updateThought
export const retireGem = retireThought
export const graduateGem = graduateThought
export const getDailyGem = getDailyThought
export const getGraduatedGems = getGraduatedThoughts
export const getRetiredGems = getRetiredThoughts
export const restoreGem = restoreThought
export const deleteGem = deleteThought
