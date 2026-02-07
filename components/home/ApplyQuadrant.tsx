"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Target, CheckCircle, Shuffle } from "@phosphor-icons/react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { HomeQuadrant } from "./HomeQuadrant"
import { Button } from "@/components/ui/button"
import { Thought } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import type { Moment } from "@/types/moments"
import type { CalendarEvent } from "@/types/calendar"
import { format, differenceInMinutes } from "date-fns"

// Unified item for the combined list of moments + un-momentified events
interface ApplyItem {
  type: "moment" | "event"
  id: string
  title: string
  startTime: string | null
  momentId?: string
  eventCacheId?: string
  matchCount: number
}

interface ApplyQuadrantProps {
  dailyThought: Thought | null
  alreadyCheckedIn: boolean
  contexts: ContextWithCount[]
  upcomingMoments: Moment[]
  upcomingEvents?: CalendarEvent[]
  todayMomentsCount: number
  onShuffle?: () => void
  className?: string
}

export function ApplyQuadrant({
  dailyThought,
  alreadyCheckedIn,
  contexts,
  upcomingMoments,
  upcomingEvents = [],
  todayMomentsCount,
  onShuffle,
  className,
}: ApplyQuadrantProps) {
  const router = useRouter()
  const [creatingMomentForEvent, setCreatingMomentForEvent] = useState<string | null>(null)

  const getContextName = (contextId: string | null | undefined) => {
    if (!contextId) return undefined
    const context = contexts.find((c) => c.id === contextId)
    return context?.name
  }

  const getContextColor = (contextId: string | null | undefined): string | undefined => {
    if (!contextId) return undefined
    const context = contexts.find((c) => c.id === contextId)
    return context?.color ?? undefined
  }

  const graduationProgress = dailyThought
    ? Math.min((dailyThought.application_count || 0) / 5 * 100, 100)
    : 0

  // Story 17.1: Build combined list of moments + un-momentified events
  const momentEventIds = new Set(
    upcomingMoments
      .filter((m) => m.calendar_event_id)
      .map((m) => m.calendar_event_id)
  )

  const momentItems: ApplyItem[] = upcomingMoments.map((m) => ({
    type: "moment",
    id: m.id,
    title: m.calendar_event_title || m.description,
    startTime: m.calendar_event_start || m.created_at,
    momentId: m.id,
    matchCount: m.gems_matched_count || 0,
  }))

  const unMomentifiedEvents: ApplyItem[] = upcomingEvents
    .filter((e) => !e.moment_created && !momentEventIds.has(e.external_event_id))
    .map((e) => ({
      type: "event",
      id: e.id,
      title: e.title,
      startTime: e.start_time,
      eventCacheId: e.id,
      matchCount: 0,
    }))

  const combinedItems = [...momentItems, ...unMomentifiedEvents]
    .sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0
      return aTime - bTime
    })
    .slice(0, 3)

  // Story 17.1: Handle tap on item
  const handleEventClick = async (item: ApplyItem) => {
    if (item.type === "moment" && item.momentId) {
      router.push(`/moments/${item.momentId}/prepare`)
      return
    }

    if (item.type === "event" && item.eventCacheId) {
      setCreatingMomentForEvent(item.eventCacheId)
      try {
        const response = await fetch("/api/moments/from-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_cache_id: item.eventCacheId }),
        })

        if (response.ok) {
          const data = await response.json()
          router.push(`/moments/${data.moment_id}/prepare`)
        }
      } catch (err) {
        console.error("Failed to create moment from event:", err)
      } finally {
        setCreatingMomentForEvent(null)
      }
    }
  }

  // Story 17.2: Urgency level for display styling
  const getUrgencyInfo = (startTime: string | null) => {
    if (!startTime) return { level: "normal" as const, label: "--:--" }
    const start = new Date(startTime)
    const now = new Date()
    const minutesAway = differenceInMinutes(start, now)

    if (minutesAway <= 0) {
      return { level: "imminent" as const, label: "Now" }
    }
    if (minutesAway < 30) {
      return { level: "imminent" as const, label: `${minutesAway}m` }
    }
    if (minutesAway < 120) {
      const hours = Math.floor(minutesAway / 60)
      const mins = minutesAway % 60
      return { level: "soon" as const, label: hours > 0 ? `${hours}h ${mins}m` : `${mins}m` }
    }
    return {
      level: "normal" as const,
      label: format(start, "MMM d, h:mm a"),
    }
  }

  // Story 17.3: Quality badge based on match count
  const getQualityBadge = (matchCount: number, isEvent: boolean) => {
    if (isEvent) {
      return { label: "Tap to prepare", className: "text-blue-500 bg-blue-500/10 border-blue-500/20" }
    }
    if (matchCount === 0) {
      return { label: "Needs context", className: "text-muted-foreground bg-muted/50 border-border" }
    }
    if (matchCount >= 3) {
      return { label: "Ready", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
    }
    return {
      label: `${matchCount} thought${matchCount !== 1 ? "s" : ""}`,
      className: "text-muted-foreground bg-[var(--glass-card-bg)] border-[var(--glass-card-border)]",
    }
  }

  return (
    <HomeQuadrant
      variant="apply"
      icon={<Target weight="bold" />}
      title="Apply"
      stat={`${todayMomentsCount} moments today`}
      footer={
        <button
          onClick={() => router.push("/moments")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View recent moments <span>→</span>
        </button>
      }
      className={className}
    >
      {/* Today's Thought */}
      {dailyThought && !alreadyCheckedIn ? (
        <div
          className={cn(
            "p-3.5 mb-3.5 rounded-[calc(var(--radius)-2px)]",
            "bg-gradient-to-br from-amber-500/10 to-orange-600/5",
            "border border-amber-500/20"
          )}
        >
          <div className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-1.5">
            Today&apos;s Thought
          </div>
          <div className="text-sm text-foreground font-medium leading-relaxed mb-2.5">
            &quot;{dailyThought.content}&quot;
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {dailyThought.context_id && (
              <span
                className="text-[10px] px-2 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${getContextColor(dailyThought.context_id)}20`,
                  color: getContextColor(dailyThought.context_id),
                }}
              >
                {getContextName(dailyThought.context_id)}
              </span>
            )}
            {dailyThought.source && (
              <span className="text-[11px] text-muted-foreground">
                from {dailyThought.source}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-500/10">
            <div className="flex-1 h-1 bg-amber-500/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full transition-all duration-300"
                style={{ width: `${graduationProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-500 whitespace-nowrap">
              {dailyThought.application_count || 0}/5 to graduate
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => router.push("/checkin")}
              className={cn(
                "flex-1 h-8 text-xs font-medium",
                "bg-primary text-primary-foreground",
                "hover:brightness-110 hover:-translate-y-px transition-all"
              )}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Check In
            </Button>
            <Button
              variant="ghost"
              onClick={onShuffle}
              className={cn(
                "h-8 px-3 text-xs font-medium",
                "bg-[var(--glass-card-bg)] border border-[var(--glass-card-border)]",
                "text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover-bg)]"
              )}
            >
              <Shuffle className="w-3.5 h-3.5 mr-1" />
              Shuffle
            </Button>
          </div>
        </div>
      ) : alreadyCheckedIn ? (
        <div
          className={cn(
            "p-3.5 mb-3.5 rounded-[calc(var(--radius)-2px)]",
            "bg-gradient-to-br from-emerald-500/10 to-green-600/5",
            "border border-emerald-500/20 text-center"
          )}
        >
          <CheckCircle weight="fill" className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <div className="text-sm text-foreground font-medium">
            You&apos;ve completed your check-in for today!
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Great job applying your knowledge
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "p-3.5 mb-3.5 rounded-[calc(var(--radius)-2px)]",
            "bg-[var(--glass-input-bg)] border border-[var(--glass-card-border)]",
            "text-center"
          )}
        >
          <div className="text-sm text-muted-foreground mb-2">
            No thoughts on your Active List yet
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/library?tab=thoughts")}
            className="text-xs"
          >
            Add some thoughts
          </Button>
        </div>
      )}

      {/* Upcoming moments + calendar events (Stories 17.1/17.2/17.3) */}
      {combinedItems.length > 0 && (
        <div className="mt-auto">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
            Upcoming
          </div>
          <div className="space-y-0">
            {combinedItems.map((item) => {
              const urgency = getUrgencyInfo(item.startTime)
              const quality = getQualityBadge(item.matchCount, item.type === "event")
              const isCreating = creatingMomentForEvent === item.eventCacheId

              return (
                <div
                  key={item.id}
                  onClick={() => !isCreating && handleEventClick(item)}
                  className={cn(
                    "flex items-center justify-between py-2 border-b border-[var(--glass-card-border)] last:border-b-0 cursor-pointer -mx-1 px-1 rounded transition-all",
                    urgency.level === "imminent"
                      ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500 pl-2"
                      : "hover:bg-[var(--glass-hover-bg)]",
                    isCreating && "opacity-60 pointer-events-none"
                  )}
                >
                  {/* Time badge (Story 17.2) */}
                  <span
                    className={cn(
                      "text-xs font-semibold w-20 flex-shrink-0",
                      urgency.level === "imminent" ? "text-amber-500" : "text-muted-foreground"
                    )}
                  >
                    {urgency.level === "imminent" && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse" />
                    )}
                    {urgency.label}
                  </span>

                  {/* Title */}
                  <span className="text-sm text-foreground flex-1 truncate mx-2">
                    {item.title}
                  </span>

                  {/* Quality badge (Story 17.3) */}
                  {isCreating ? (
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                  ) : (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap",
                        quality.className
                      )}
                    >
                      {quality.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </HomeQuadrant>
  )
}
