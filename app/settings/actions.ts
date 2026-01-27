"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Profile } from "@/lib/types"

export async function getProfile(): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    // If profile doesn't exist, create one
    if (error.code === "PGRST116") {
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          onboarding_completed: false,
        })
        .select()
        .single()

      if (createError) {
        return { data: null, error: createError.message }
      }
      return { data: newProfile, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateProfile(updates: {
  name?: string
  timezone?: string
  daily_prompt_time?: string
  checkin_time?: string
}): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/settings")
  return { data, error: null }
}

export async function setOnboardingCompleted(completed: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/settings")
  return { error: null }
}

export async function grantAIConsent(): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ai_consent_given: true,
      ai_consent_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/settings")
  return { data, error: null }
}

export async function revokeAIConsent(): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ai_consent_given: false,
      ai_consent_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/settings")
  return { data, error: null }
}

export async function updateFocusMode(
  enabled: boolean,
  limit?: number
): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const updateData: Record<string, unknown> = {
    focus_mode_enabled: enabled,
    updated_at: new Date().toISOString(),
  }

  // Only update limit if focus mode is disabled and a limit is provided
  if (!enabled && limit !== undefined) {
    // Validate limit is between 10 and 25
    const validLimit = Math.max(10, Math.min(25, limit))
    updateData.active_list_limit = validLimit
  }

  // If enabling focus mode, reset limit to 10
  if (enabled) {
    updateData.active_list_limit = 10
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/settings")
  revalidatePath("/home")
  revalidatePath("/thoughts")
  return { data, error: null }
}

export async function updateActiveListLimit(
  limit: number
): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  // Validate limit is between 10 and 25
  const validLimit = Math.max(10, Math.min(25, limit))

  const { data, error } = await supabase
    .from("profiles")
    .update({
      active_list_limit: validLimit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/settings")
  revalidatePath("/home")
  revalidatePath("/thoughts")
  return { data, error: null }
}

export async function updateCheckinEnabled(
  enabled: boolean
): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      checkin_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/settings")
  revalidatePath("/home")
  return { data, error: null }
}
