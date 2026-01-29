/**
 * Client-safe calendar functions that only use Supabase
 * These can be imported in client components without bundling googleapis
 */

import { createClient } from "@/lib/supabase/client"
import type { CalendarConnection } from "@/types/calendar"

/**
 * Disconnect a calendar connection
 */
export async function disconnectCalendar(
  connectionId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("calendar_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Get all calendar connections for a user
 */
export async function getCalendarConnections(): Promise<{
  connections: CalendarConnection[]
  error: string | null
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { connections: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("user_id", user.id)

  if (error) {
    return { connections: [], error: error.message }
  }

  // Don't return tokens to client
  const sanitizedConnections = (data || []).map((conn) => ({
    ...conn,
    access_token: undefined,
    refresh_token: undefined,
    token_expires_at: undefined,
  })) as CalendarConnection[]

  return { connections: sanitizedConnections, error: null }
}

/**
 * Update calendar connection settings
 */
export async function updateCalendarSettings(
  connectionId: string,
  settings: {
    auto_moment_enabled?: boolean
    lead_time_minutes?: number
    event_filter?: 'all' | 'meetings' | 'custom'
    custom_keywords?: string[]
    sync_frequency_minutes?: number
  }
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("calendar_connections")
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Sync calendar events via API route
 * This calls the server-side API which uses googleapis
 */
export async function syncCalendarEvents(
  connectionId: string
): Promise<{ error: string | null }> {
  try {
    const response = await fetch("/api/calendar/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ connectionId }),
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || "Failed to sync calendar" }
    }

    return { error: null }
  } catch (error) {
    return { error: "Failed to sync calendar" }
  }
}
