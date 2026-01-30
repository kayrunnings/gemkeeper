"use client"

import { useRouter } from "next/navigation"
import { Target, CheckCircle, Shuffle, Clock, DiamondsFour } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { HomeQuadrant } from "./HomeQuadrant"
import { Button } from "@/components/ui/button"
import { Thought } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import type { Moment } from "@/types/moments"
import { format } from "date-fns"

interface ApplyQuadrantProps {
  dailyThought: Thought | null
  alreadyCheckedIn: boolean
  contexts: ContextWithCount[]
  upcomingMoments: Moment[]
  todayMomentsCount: number
  onShuffle?: () => void
  className?: string
}

export function ApplyQuadrant({
  dailyThought,
  alreadyCheckedIn,
  contexts,
  upcomingMoments,
  todayMomentsCount,
  onShuffle,
  className,
}: ApplyQuadrantProps) {
  const router = useRouter()

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

      {/* Upcoming moments */}
      {upcomingMoments.length > 0 && (
        <div className="mt-auto">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
            Upcoming moments
          </div>
          <div className="space-y-0">
            {upcomingMoments.slice(0, 2).map((moment) => {
              const eventTime = moment.calendar_event_start || moment.created_at
              return (
                <div
                  key={moment.id}
                  onClick={() => router.push(`/moments/${moment.id}/prepare`)}
                  className="flex items-center justify-between py-2 border-b border-[var(--glass-card-border)] last:border-b-0 cursor-pointer hover:bg-[var(--glass-hover-bg)] -mx-1 px-1 rounded transition-colors"
                >
                  <span className="text-xs text-amber-500 font-semibold w-14 flex-shrink-0">
                    {eventTime ? format(new Date(eventTime), "h:mm a") : "--:--"}
                  </span>
                  <span className="text-sm text-foreground flex-1 truncate mx-2">
                    {moment.calendar_event_title || moment.description}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-[var(--glass-card-bg)] px-2 py-0.5 rounded-full border border-[var(--glass-card-border)]">
                    {moment.gems_matched_count || 0} gems
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </HomeQuadrant>
  )
}
