"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Gem, CreateGemInput, MAX_ACTIVE_GEMS } from "@/lib/types/gem"

export async function getActiveGems(): Promise<{ gems: Gem[]; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", gems: [] }
  }

  const { data, error } = await supabase
    .from("gems")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, gems: [] }
  }

  return { gems: data as Gem[], error: null }
}

export async function getActiveGemCount(): Promise<{ count: number; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", count: 0 }
  }

  const { count, error } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (error) {
    return { error: error.message, count: 0 }
  }

  return { count: count ?? 0, error: null }
}

export async function createGem(input: CreateGemInput): Promise<{ gem: Gem | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", gem: null }
  }

  // Check the 10-gem limit before inserting
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (countError) {
    return { error: countError.message, gem: null }
  }

  if ((count ?? 0) >= MAX_ACTIVE_GEMS) {
    return {
      error: `You've reached the maximum of ${MAX_ACTIVE_GEMS} active gems. Please retire or graduate a gem before adding a new one.`,
      gem: null,
    }
  }

  const { data, error } = await supabase
    .from("gems")
    .insert({
      user_id: user.id,
      content: input.content,
      source: input.source || null,
      source_url: input.source_url || null,
      context_tag: input.context_tag,
      custom_context: input.context_tag === "other" ? input.custom_context || null : null,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, gem: null }
  }

  revalidatePath("/gems")
  return { gem: data as Gem, error: null }
}

export async function deleteGem(gemId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("gems")
    .delete()
    .eq("id", gemId)
    .eq("user_id", user.id) // Extra safety check

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/gems")
  return { error: null }
}
