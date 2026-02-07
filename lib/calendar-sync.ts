import { createClient } from "@/lib/supabase/server"
import { getPendingEventsForMoments, syncCalendarEvents } from "@/lib/calendar"
import { createMomentWithMatching } from "@/lib/moments/create-moment"
import type { CalendarEvent } from "@/types/calendar"

/**
 * Check for upcoming events and create moments for them.
 * Server-side only — uses createMomentWithMatching directly.
 */
export async function checkForUpcomingEvents(): Promise<{
  momentsCreated: number
  events: Array<{ event: CalendarEvent; momentId: string }>
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { momentsCreated: 0, events: [], error: "Not authenticated" }
  }

  // Get pending events within lead time
  const { events: pendingEvents, error: fetchError } = await getPendingEventsForMoments(supabase)

  if (fetchError) {
    return { momentsCreated: 0, events: [], error: fetchError }
  }

  if (pendingEvents.length === 0) {
    return { momentsCreated: 0, events: [], error: null }
  }

  const createdMoments: Array<{ event: CalendarEvent; momentId: string }> = []

  for (const event of pendingEvents) {
    try {
      const { moment, error } = await createMomentWithMatching(supabase, {
        userId: user.id,
        description: event.title,
        source: "calendar",
        calendarData: {
          event_id: event.external_event_id,
          title: event.title,
          start_time: event.start_time,
        },
      })

      if (!error && moment) {
        // Mark event as having moment created
        await supabase
          .from("calendar_events_cache")
          .update({
            moment_created: true,
            moment_id: moment.id,
          })
          .eq("id", event.id)

        createdMoments.push({ event, momentId: moment.id })
      }
    } catch (err) {
      console.error(`Failed to create moment for event: ${event.title}`, err)
    }
  }

  return {
    momentsCreated: createdMoments.length,
    events: createdMoments,
    error: null,
  }
}

/**
 * Sync all active calendar connections
 */
export async function syncAllCalendars(): Promise<{
  synced: number
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { synced: 0, error: "Not authenticated" }
  }

  const { data: connections } = await supabase
    .from("calendar_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (!connections || connections.length === 0) {
    return { synced: 0, error: null }
  }

  let synced = 0

  for (const conn of connections) {
    const { result } = await syncCalendarEvents(conn.id, supabase)
    if (result) {
      synced += result.events_synced
    }
  }

  return { synced, error: null }
}

/**
 * Hook to periodically check for upcoming events.
 * Server-side only — call from API routes or server actions.
 */
export async function runCalendarCheck(): Promise<void> {
  try {
    // First sync calendars
    await syncAllCalendars()

    // Then check for upcoming events
    await checkForUpcomingEvents()
  } catch (err) {
    console.error("Calendar check failed:", err)
  }
}
