import { createClient } from "@/lib/supabase/client"
import { Thought, CreateThoughtInput, MAX_ACTIVE_THOUGHTS } from "@/lib/types/thought"

// Create multiple thoughts at once (for AI extraction)
export async function createMultipleThoughts(
  thoughts: Array<{
    content: string
    context_tag: CreateThoughtInput["context_tag"]
    source?: string
    source_url?: string
  }>
): Promise<{ thoughts: Thought[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thoughts: [], error: "Not authenticated" }
  }

  // Check current active thought count
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (countError) {
    return { thoughts: [], error: countError.message }
  }

  const currentCount = count || 0
  const availableSlots = MAX_ACTIVE_THOUGHTS - currentCount

  if (availableSlots <= 0) {
    return {
      thoughts: [],
      error: `You have ${MAX_ACTIVE_THOUGHTS} active thoughts. Retire some before adding more.`
    }
  }

  if (thoughts.length > availableSlots) {
    return {
      thoughts: [],
      error: `You can only add ${availableSlots} more thought${availableSlots === 1 ? "" : "s"}. You selected ${thoughts.length}.`
    }
  }

  // Prepare thoughts for insertion
  const thoughtsToInsert = thoughts.map((thought) => ({
    user_id: user.id,
    content: thought.content,
    context_tag: thought.context_tag,
    source: thought.source || null,
    source_url: thought.source_url || null,
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

// Get the daily thought (least recently surfaced active thought)
export async function getDailyThought(): Promise<{ thought: Thought | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { thought: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("last_surfaced_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No thoughts found
      return { thought: null, error: null }
    }
    return { thought: null, error: error.message }
  }

  return { thought: data, error: null }
}

// Log a check-in for a thought
export async function logCheckin(
  thoughtId: string,
  type: "morning_prompt" | "evening_checkin",
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

  // If evening check-in with "yes", increment application_count and update last_applied_at
  if (type === "evening_checkin" && response === "yes") {
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

  // If evening check-in with "no", increment skip_count
  if (type === "evening_checkin" && response === "no") {
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

// Legacy aliases for backward compatibility during migration
export const createMultipleGems = createMultipleThoughts
export const updateGem = updateThought
export const retireGem = retireThought
export const graduateGem = graduateThought
export const getDailyGem = getDailyThought
export const getGraduatedGems = getGraduatedThoughts
