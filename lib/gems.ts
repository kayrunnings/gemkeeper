import { createClient } from "@/lib/supabase/client"
import { Gem, CreateGemInput, MAX_ACTIVE_GEMS } from "@/lib/types/gem"

// Create multiple gems at once (for AI extraction)
export async function createMultipleGems(
  gems: Array<{
    content: string
    context_tag: CreateGemInput["context_tag"]
    source?: string
    source_url?: string
  }>
): Promise<{ gems: Gem[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { gems: [], error: "Not authenticated" }
  }

  // Check current active/passive gem count
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])

  if (countError) {
    return { gems: [], error: countError.message }
  }

  const currentCount = count || 0
  const availableSlots = MAX_ACTIVE_GEMS - currentCount

  if (availableSlots <= 0) {
    return {
      gems: [],
      error: `You have ${MAX_ACTIVE_GEMS} active gems. Retire some before adding more.`
    }
  }

  if (gems.length > availableSlots) {
    return {
      gems: [],
      error: `You can only add ${availableSlots} more gem${availableSlots === 1 ? "" : "s"}. You selected ${gems.length}.`
    }
  }

  // Prepare gems for insertion
  const gemsToInsert = gems.map((gem) => ({
    user_id: user.id,
    content: gem.content,
    context_tag: gem.context_tag,
    source: gem.source || null,
    source_url: gem.source_url || null,
    status: "active" as const,
    application_count: 0,
    skip_count: 0,
  }))

  const { data, error } = await supabase
    .from("gems")
    .insert(gemsToInsert)
    .select()

  if (error) {
    return { gems: [], error: error.message }
  }

  return { gems: data || [], error: null }
}

// Update a gem with partial data
export async function updateGem(
  id: string,
  input: Partial<CreateGemInput>
): Promise<{ gem: Gem | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { gem: null, error: "Not authenticated" }
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
    return { gem: null, error: error.message }
  }

  return { gem: data, error: null }
}

// Retire a gem (archive or release)
export async function retireGem(
  id: string,
  mode: "release" | "archive"
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (mode === "release") {
    // Permanently delete the gem
    const { error } = await supabase
      .from("gems")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Archive the gem (set status to retired)
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

// Graduate a gem (requires 5+ applications)
export async function graduateGem(
  id: string
): Promise<{ gem: Gem | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { gem: null, error: "Not authenticated" }
  }

  // First check if gem has 5+ applications
  const { data: existingGem, error: fetchError } = await supabase
    .from("gems")
    .select("application_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !existingGem) {
    return { gem: null, error: "Gem not found" }
  }

  if (existingGem.application_count < 5) {
    return { gem: null, error: "Gem must have at least 5 applications to graduate" }
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
    return { gem: null, error: error.message }
  }

  return { gem: data, error: null }
}

// Get the daily gem (least recently surfaced active gem on Active List)
// DEPRECATED: Use getDailyThought from lib/thoughts.ts instead
export async function getDailyGem(): Promise<{ gem: Gem | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { gem: null, error: "Not authenticated" }
  }

  // Get thoughts on the Active List with active or passive status
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
      // No gems found
      return { gem: null, error: null }
    }
    return { gem: null, error: error.message }
  }

  return { gem: data, error: null }
}

// Log a check-in for a gem
export async function logCheckin(
  gemId: string,
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
      gem_id: gemId,
      user_id: user.id,
      checkin_type: type,
      response,
      note: note || null,
    })

  if (checkinError) {
    return { error: checkinError.message }
  }

  // Update the gem's last_surfaced_at
  const updateData: Record<string, unknown> = {
    last_surfaced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // If evening check-in with "yes", increment application_count and update last_applied_at
  if (type === "evening_checkin" && response === "yes") {
    const { data: gem } = await supabase
      .from("gems")
      .select("application_count")
      .eq("id", gemId)
      .single()

    if (gem) {
      updateData.application_count = gem.application_count + 1
      updateData.last_applied_at = new Date().toISOString()
    }
  }

  // If evening check-in with "no", increment skip_count
  if (type === "evening_checkin" && response === "no") {
    const { data: gem } = await supabase
      .from("gems")
      .select("skip_count")
      .eq("id", gemId)
      .single()

    if (gem) {
      updateData.skip_count = gem.skip_count + 1
    }
  }

  const { error: updateError } = await supabase
    .from("gems")
    .update(updateData)
    .eq("id", gemId)
    .eq("user_id", user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { error: null }
}

// Reset skip count (for keeping a stale gem)
export async function resetSkipCount(gemId: string): Promise<{ error: string | null }> {
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
    .eq("id", gemId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// Get graduated gems for trophy case
export async function getGraduatedGems(): Promise<{ gems: Gem[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { gems: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "graduated")
    .order("graduated_at", { ascending: false })

  if (error) {
    return { gems: [], error: error.message }
  }

  return { gems: data || [], error: null }
}
