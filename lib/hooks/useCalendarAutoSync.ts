"use client"

import { useEffect, useRef, useCallback, useState } from "react"
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
 * Best-effort client-side calendar sync supplement (Story 16.1 / 16.2).
 *
 * The primary sync driver is the server-side cron job at /api/cron/calendar-sync.
 * This hook acts as a supplement: it syncs on app load, runs catch-up for missed
 * events (Story 16.2), and polls every 5 minutes as a fallback.
 *
 * Returns sync state for the sync health indicator (Story 16.3).
 */
export function useCalendarAutoSync() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false)
  const hasDoneCatchUp = useRef(false)

  // Sync health state (Story 16.3)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [catchUpCount, setCatchUpCount] = useState(0)

  const runAutoSync = useCallback(async () => {
    if (isSyncingRef.current) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: connections } = await supabase
        .from("calendar_connections")
        .select("id, sync_frequency_minutes, last_sync_at, sync_error")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gt("sync_frequency_minutes", 0)

      if (!connections || connections.length === 0) return

      // Expose sync state from the first connection
      if (connections[0].last_sync_at) {
        setLastSyncAt(connections[0].last_sync_at)
      }
      if (connections[0].sync_error) {
        setSyncError(connections[0].sync_error)
      }

      const now = new Date()

      const connectionsToSync: CalendarConnectionForSync[] = connections.filter(
        (conn: CalendarConnectionForSync) => {
          if (!conn.last_sync_at) return true
          const lastSync = new Date(conn.last_sync_at)
          const nextSyncTime = new Date(
            lastSync.getTime() + conn.sync_frequency_minutes * 60 * 1000
          )
          return now >= nextSyncTime
        }
      )

      if (connectionsToSync.length === 0) return

      isSyncingRef.current = true
      setIsSyncing(true)
      setSyncError(null)

      for (const conn of connectionsToSync) {
        try {
          await syncCalendarEvents(conn.id)
        } catch (err) {
          console.error(`Auto-sync failed for connection ${conn.id}:`, err)
          setSyncError("Sync failed")
        }
      }

      // After syncing, check for events that should become moments
      const result = await checkForUpcomingEvents()
      setLastSyncAt(new Date().toISOString())

      // Story 16.2: Catch-up on first mount — report created moments
      if (!hasDoneCatchUp.current && result.momentsCreated > 0) {
        setCatchUpCount(result.momentsCreated)
      }
      hasDoneCatchUp.current = true
    } catch (err) {
      console.error("Calendar auto-sync error:", err)
      setSyncError("Sync failed")
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    // Run initial sync + catch-up on mount
    runAutoSync()

    // Poll every 5 minutes as a best-effort supplement to cron
    intervalRef.current = setInterval(runAutoSync, 5 * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [runAutoSync])

  return {
    runAutoSync,
    lastSyncAt,
    syncError,
    isSyncing,
    catchUpCount,
    clearCatchUp: () => setCatchUpCount(0),
  }
}
