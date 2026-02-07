import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncCalendarEvents, getPendingEventsForMoments } from "@/lib/calendar"
import { createMomentWithMatching } from "@/lib/moments/create-moment"

/**
 * Server-side cron job for calendar sync (Story 16.1)
 *
 * Runs every 10 minutes via Vercel Cron. Iterates all active calendar
 * connections that are due for sync, syncs events from Google Calendar,
 * and creates moments for events within each user's lead_time_minutes.
 *
 * Protected by CRON_SECRET — not publicly callable.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  const results = {
    connections_checked: 0,
    connections_synced: 0,
    moments_created: 0,
    errors: [] as string[],
  }

  try {
    // Get all active calendar connections that are due for sync
    const { data: connections, error: connError } = await supabase
      .from("calendar_connections")
      .select("id, user_id, sync_frequency_minutes, last_sync_at, auto_moment_enabled, lead_time_minutes")
      .eq("is_active", true)
      .gt("sync_frequency_minutes", 0)

    if (connError) {
      return NextResponse.json(
        { error: "Failed to fetch connections", details: connError.message },
        { status: 500 }
      )
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ message: "No connections to sync", ...results })
    }

    results.connections_checked = connections.length

    // Filter to connections that are due for sync
    const dueConnections = connections.filter((conn) => {
      if (!conn.last_sync_at) return true
      const lastSync = new Date(conn.last_sync_at)
      const nextSyncTime = new Date(
        lastSync.getTime() + conn.sync_frequency_minutes * 60 * 1000
      )
      return now >= nextSyncTime
    })

    // Process each connection
    for (const conn of dueConnections) {
      try {
        // Sync calendar events (handles token refresh internally)
        const { error: syncError } = await syncCalendarEvents(conn.id, supabase)

        if (syncError) {
          results.errors.push(`Sync failed for connection ${conn.id}: ${syncError}`)
          continue
        }

        results.connections_synced++

        // Check for events that need moments created
        if (conn.auto_moment_enabled) {
          const leadTimeMs = conn.lead_time_minutes * 60 * 1000
          const windowEnd = new Date(now.getTime() + leadTimeMs)

          const { data: pendingEvents } = await supabase
            .from("calendar_events_cache")
            .select("*")
            .eq("user_id", conn.user_id)
            .eq("moment_created", false)
            .gte("start_time", now.toISOString())
            .lte("start_time", windowEnd.toISOString())

          if (pendingEvents && pendingEvents.length > 0) {
            for (const event of pendingEvents) {
              try {
                const { moment, error: momentError } = await createMomentWithMatching(supabase, {
                  userId: conn.user_id,
                  description: event.title,
                  source: "calendar",
                  calendarData: {
                    event_id: event.external_event_id,
                    title: event.title,
                    start_time: event.start_time,
                  },
                })

                if (!momentError && moment) {
                  await supabase
                    .from("calendar_events_cache")
                    .update({
                      moment_created: true,
                      moment_id: moment.id,
                    })
                    .eq("id", event.id)

                  results.moments_created++
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                results.errors.push(`Moment creation failed for event "${event.title}": ${msg}`)
              }
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`Connection ${conn.id} processing failed: ${msg}`)
      }
    }

    return NextResponse.json({
      message: "Cron sync complete",
      ...results,
    })
  } catch (error) {
    console.error("Cron calendar sync error:", error)
    return NextResponse.json(
      { error: "Cron sync failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
