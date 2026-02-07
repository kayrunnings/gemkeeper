import { google } from "googleapis"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CalendarConnection,
  CalendarEvent,
  CalendarSyncResult,
} from "@/types/calendar"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

// Google OAuth2 client setup
function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  )
}

/**
 * Generate Google Calendar OAuth URL
 */
export function getGoogleAuthUrl(): string {
  const oauth2Client = getGoogleOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

/**
 * Exchange authorization code for tokens and create calendar connection
 */
export async function connectGoogleCalendar(
  code: string
): Promise<{ connection: CalendarConnection | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { connection: null, error: "Not authenticated" }
  }

  try {
    const oauth2Client = getGoogleOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return { connection: null, error: "Failed to get tokens" }
    }

    // Get user email from Google
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const email = userInfo.data.email

    if (!email) {
      return { connection: null, error: "Failed to get email" }
    }

    // Store connection in database
    const { data, error } = await supabase
      .from("calendar_connections")
      .upsert({
        user_id: user.id,
        provider: 'google',
        email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
        is_active: true,
        auto_moment_enabled: true,
        lead_time_minutes: 30,
        event_filter: 'all',
        custom_keywords: [],
        sync_frequency_minutes: 15, // Default to sync every 15 minutes
      }, {
        onConflict: 'user_id,provider',
      })
      .select()
      .single()

    if (error) {
      return { connection: null, error: error.message }
    }

    return { connection: data, error: null }
  } catch (err) {
    console.error("Google Calendar connection error:", err)
    return { connection: null, error: "Failed to connect to Google Calendar" }
  }
}

/**
 * Disconnect a calendar
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
 * Refresh Google OAuth token
 * @param connectionId - The calendar connection ID
 * @param externalSupabase - Optional Supabase client (use server client when calling from API routes)
 */
export async function refreshGoogleToken(
  connectionId: string,
  externalSupabase?: AnySupabaseClient
): Promise<{ error: string | null }> {
  const supabase = externalSupabase || createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get connection with tokens (server-side only)
  const { data: connection, error: fetchError } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !connection) {
    return { error: "Connection not found" }
  }

  try {
    const oauth2Client = getGoogleOAuth2Client()
    oauth2Client.setCredentials({
      refresh_token: connection.refresh_token,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    await supabase
      .from("calendar_connections")
      .update({
        access_token: credentials.access_token,
        token_expires_at: new Date(credentials.expiry_date || Date.now() + 3600000).toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    return { error: null }
  } catch (err) {
    console.error("Token refresh error:", err)

    await supabase
      .from("calendar_connections")
      .update({
        sync_error: "Token refresh failed. Please reconnect.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    return { error: "Failed to refresh token" }
  }
}

/**
 * Sync calendar events from Google Calendar
 * @param connectionId - The calendar connection ID
 * @param externalSupabase - Optional Supabase client (use server client when calling from API routes)
 */
export async function syncCalendarEvents(
  connectionId: string,
  externalSupabase?: AnySupabaseClient
): Promise<{ result: CalendarSyncResult | null; error: string | null }> {
  const supabase = externalSupabase || createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { result: null, error: "Not authenticated" }
  }

  // Get connection with tokens
  const { data: connection, error: fetchError } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !connection) {
    return { result: null, error: "Connection not found" }
  }

  const result: CalendarSyncResult = {
    events_synced: 0,
    events_added: 0,
    events_updated: 0,
    errors: [],
  }

  try {
    // Check if token needs refresh
    const tokenExpiry = new Date(connection.token_expires_at)
    if (tokenExpiry < new Date()) {
      const refreshResult = await refreshGoogleToken(connectionId, supabase)
      if (refreshResult.error) {
        return { result: null, error: refreshResult.error }
      }

      // Re-fetch connection with new token
      const { data: refreshedConn } = await supabase
        .from("calendar_connections")
        .select("*")
        .eq("id", connectionId)
        .single()

      if (refreshedConn) {
        connection.access_token = refreshedConn.access_token
      }
    }

    // Set up Google Calendar API client
    const oauth2Client = getGoogleOAuth2Client()
    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Fetch events based on lead_time_minutes setting
    // This ensures we have events cached before they're needed for moments
    const now = new Date()
    const leadTimeMs = (connection.lead_time_minutes || 1440) * 60 * 1000 // Default to 1 day
    const syncWindowEnd = new Date(now.getTime() + leadTimeMs)

    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: syncWindowEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100, // Increased to handle longer time windows
    })

    const events = eventsResponse.data.items || []
    result.events_synced = events.length

    for (const event of events) {
      if (!event.id || !event.summary || !event.start?.dateTime) {
        continue
      }

      // Check if event should be filtered
      if (connection.event_filter === 'meetings') {
        // Only include events with attendees (meetings)
        if (!event.attendees || event.attendees.length === 0) {
          continue
        }
      } else if (connection.event_filter === 'custom' && connection.custom_keywords?.length > 0) {
        // Only include events matching keywords
        const title = event.summary.toLowerCase()
        const hasKeyword = connection.custom_keywords.some((kw: string) =>
          title.includes(kw.toLowerCase())
        )
        if (!hasKeyword) {
          continue
        }
      }

      // Upsert event to cache
      const { error: upsertError } = await supabase
        .from("calendar_events_cache")
        .upsert({
          connection_id: connectionId,
          user_id: user.id,
          external_event_id: event.id,
          title: event.summary,
          description: event.description || null,
          start_time: event.start.dateTime,
          end_time: event.end?.dateTime || event.start.dateTime,
        }, {
          onConflict: 'connection_id,external_event_id',
        })

      if (upsertError) {
        result.errors.push(`Failed to sync event: ${event.summary}`)
      } else {
        result.events_added++
      }
    }

    // Update last sync time
    await supabase
      .from("calendar_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    return { result, error: null }
  } catch (err) {
    console.error("Calendar sync error:", err)

    await supabase
      .from("calendar_connections")
      .update({
        sync_error: "Sync failed. Please try again.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    return { result: null, error: "Failed to sync calendar" }
  }
}

/**
 * Get pending events that need moments created
 * @param externalSupabase - Optional Supabase client (use server client when calling from API routes)
 * @param options.catchUp - If true, also include events that already started
 *   but are still ongoing (within 1 hour of start time). Story 16.2.
 */
export async function getPendingEventsForMoments(
  externalSupabase?: AnySupabaseClient,
  options?: { catchUp?: boolean }
): Promise<{
  events: CalendarEvent[]
  error: string | null
}> {
  const supabase = externalSupabase || createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { events: [], error: "Not authenticated" }
  }

  // Get user's calendar connections with auto-moment enabled
  const { data: connections } = await supabase
    .from("calendar_connections")
    .select("id, lead_time_minutes")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("auto_moment_enabled", true)

  if (!connections || connections.length === 0) {
    return { events: [], error: null }
  }

  const allEvents: CalendarEvent[] = []
  const now = new Date()

  for (const conn of connections) {
    const leadTimeMs = conn.lead_time_minutes * 60 * 1000
    const windowEnd = new Date(now.getTime() + leadTimeMs)

    // Story 16.2: In catch-up mode, look back 1 hour for events that
    // already started but are still ongoing (late prep opportunity)
    const windowStart = options?.catchUp
      ? new Date(now.getTime() - 60 * 60 * 1000)
      : now

    const { data: events } = await supabase
      .from("calendar_events_cache")
      .select("*")
      .eq("connection_id", conn.id)
      .eq("user_id", user.id)
      .eq("moment_created", false)
      .gte("start_time", windowStart.toISOString())
      .lte("start_time", windowEnd.toISOString())

    if (events) {
      allEvents.push(...events)
    }
  }

  return { events: allEvents, error: null }
}
