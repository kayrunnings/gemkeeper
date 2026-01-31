"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Thought, CreateThoughtInput } from "@/lib/types/thought"

export async function getActiveThoughts(): Promise<{ thoughts: Thought[]; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", thoughts: [] }
  }

  // Get active and passive thoughts (not retired/graduated)
  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, thoughts: [] }
  }

  return { thoughts: data as Thought[], error: null }
}

export async function getActiveThoughtCount(): Promise<{ count: number; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", count: 0 }
  }

  // Count active and passive thoughts (not retired/graduated)
  const { count, error } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])

  if (error) {
    return { error: error.message, count: 0 }
  }

  return { count: count ?? 0, error: null }
}

export async function createThought(input: CreateThoughtInput): Promise<{ thought: Thought | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", thought: null }
  }

  // Note: No limit on total thoughts. The Active List limit (10) is enforced
  // separately when adding thoughts to the Active List via toggleActiveList().
  // New thoughts are created with is_on_active_list = false (Passive) by default.

  const { data, error } = await supabase
    .from("gems")
    .insert({
      user_id: user.id,
      content: input.content,
      source: input.source || null,
      source_url: input.source_url || null,
      source_id: input.source_id || null,
      context_tag: input.context_tag,
      custom_context: input.context_tag === "other" ? input.custom_context || null : null,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, thought: null }
  }

  revalidatePath("/thoughts")
  return { thought: data as Thought, error: null }
}

export async function deleteThought(thoughtId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("gems")
    .delete()
    .eq("id", thoughtId)
    .eq("user_id", user.id) // Extra safety check

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/thoughts")
  return { error: null }
}

// Legacy aliases for backward compatibility
export const getActiveGems = getActiveThoughts
export const getActiveGemCount = getActiveThoughtCount
export const createGem = createThought
export const deleteGem = deleteThought
