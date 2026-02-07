"use client"

import { cn } from "@/lib/utils"
import { formatDistanceToNowStrict } from "date-fns"

interface SyncHealthIndicatorProps {
  lastSyncAt: string | null
  syncError: string | null
  isSyncing: boolean
  className?: string
}

/**
 * Compact sync health indicator (Story 16.3).
 * Shows last sync time, a pulsing dot while syncing, or an error badge.
 */
export function SyncHealthIndicator({
  lastSyncAt,
  syncError,
  isSyncing,
  className,
}: SyncHealthIndicatorProps) {
  if (!lastSyncAt && !syncError && !isSyncing) return null

  const timeAgo = lastSyncAt
    ? formatDistanceToNowStrict(new Date(lastSyncAt), { addSuffix: true })
    : null

  // Determine health status
  let status: "healthy" | "stale" | "error" | "syncing" = "healthy"
  if (isSyncing) {
    status = "syncing"
  } else if (syncError) {
    status = "error"
  } else if (lastSyncAt) {
    const minutesSince = (Date.now() - new Date(lastSyncAt).getTime()) / 60000
    if (minutesSince > 30) status = "stale"
  }

  const dotColor = {
    healthy: "bg-emerald-500",
    stale: "bg-amber-500",
    error: "bg-red-500",
    syncing: "bg-blue-500 animate-pulse",
  }[status]

  const label = {
    healthy: `Synced ${timeAgo}`,
    stale: `Last sync ${timeAgo}`,
    error: syncError || "Sync error",
    syncing: "Syncing...",
  }[status]

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
      <span
        className={cn(
          "text-[10px]",
          status === "error" ? "text-red-500" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  )
}
