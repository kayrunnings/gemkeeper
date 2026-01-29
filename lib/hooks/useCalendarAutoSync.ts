"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { syncCalendarEvents } from "@/lib/calendar-client"

async function checkForUpcomingEvents(): Promise<{ momentsCreated: number }> {
  try {
    const response = await fetch("/api/calendar/check-moments", {
      method: "POST",
    })
    if (!response.ok) {
      return { momentsCreated: 0 }
    }
    return await response.json()
  } catch {
    return { momentsCreated: 0 }
  }
}

interface CalendarConnectionForSync {
  id: string
  sync_frequency_minutes: number
  last_sync_at: string | null
}

/**
 * Hook to automatically sync calendars based on user's configured frequency.
 * Checks every minute if any calendars need syncing based on their last_sync_at
 * and sync_frequency_minutes settings.
 */
export function useCalendarAutoSync() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false)

  const runAutoSync = useCallback(async () => {
    // Prevent concurrent sync operations
    if (isSyncingRef.current) {
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      // Get all active calendar connections with auto-sync enabled (frequency > 0)
      const { data: connections } = await supabase
        .from("calendar_connections")
        .select("id, sync_frequency_minutes, last_sync_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gt("sync_frequency_minutes", 0)

      if (!connections || connections.length === 0) {
        return
      }

      const now = new Date()

      // Find connections that need syncing
      const connectionsToSync: CalendarConnectionForSync[] = connections.filter(
        (conn: CalendarConnectionForSync) => {
          if (!conn.last_sync_at) {
            // Never synced, should sync now
            return true
          }

          const lastSync = new Date(conn.last_sync_at)
          const nextSyncTime = new Date(
            lastSync.getTime() + conn.sync_frequency_minutes * 60 * 1000
          )

          return now >= nextSyncTime
        }
      )

      if (connectionsToSync.length === 0) {
        return
      }

      isSyncingRef.current = true

      // Sync each connection that needs it
      for (const conn of connectionsToSync) {
        try {
          await syncCalendarEvents(conn.id)
        } catch (err) {
          console.error(`Auto-sync failed for connection ${conn.id}:`, err)
        }
      }

      // After syncing, check for events that should become moments
      await checkForUpcomingEvents()
    } catch (err) {
      console.error("Calendar auto-sync error:", err)
    } finally {
      isSyncingRef.current = false
    }
  }, [])

  useEffect(() => {
    // Run initial sync check on mount
    runAutoSync()

    // Check every minute if any calendars need syncing
    intervalRef.current = setInterval(runAutoSync, 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [runAutoSync])

  // Return a function to manually trigger sync if needed
  return { runAutoSync }
}
