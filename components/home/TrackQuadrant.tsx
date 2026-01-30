"use client"

import { useRouter } from "next/navigation"
import { Star, TrendUp, TrendDown } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { HomeQuadrant } from "./HomeQuadrant"
import { StreakBanner } from "./StreakBanner"
import { GraduationCallout } from "./GraduationCallout"

interface WeekStats {
  applications: number
  applicationsTrend: number // positive = up, negative = down
  newCaptures: number
  newCapturesTrend: number
}

interface TrackQuadrantProps {
  streak: {
    current: number
    best: number
    weeklyActivity: boolean[]
  }
  weekStats: WeekStats
  nearGraduation: Array<{
    id: string
    content: string
    applicationCount: number
    remaining: number
  }>
  totals: {
    activeGems: number
    graduatedGems: number
    totalApplications: number
  }
  className?: string
}

export function TrackQuadrant({
  streak,
  weekStats,
  nearGraduation,
  totals,
  className,
}: TrackQuadrantProps) {
  const router = useRouter()

  const formatTrend = (value: number) => {
    if (value === 0) return null
    const isPositive = value > 0
    return {
      text: isPositive ? `+${value}` : `${value}`,
      isPositive,
    }
  }

  return (
    <HomeQuadrant
      variant="track"
      icon={<Star weight="fill" />}
      title="Track"
      footer={
        <button
          onClick={() => router.push("/trophy-case")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View Trophy Case <span>→</span>
        </button>
      }
      className={className}
    >
      {/* Streak Banner */}
      <StreakBanner
        currentStreak={streak.current}
        bestStreak={streak.best}
        weeklyActivity={streak.weeklyActivity}
        className="mb-3.5"
      />

      {/* This Week Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <div className="p-2.5 bg-[var(--glass-input-bg)] border border-[var(--glass-card-border)] rounded-[calc(var(--radius)-2px)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold text-foreground">
              {weekStats.applications}
            </span>
            {formatTrend(weekStats.applicationsTrend) && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  weekStats.applicationsTrend > 0
                    ? "bg-emerald-500/20 text-emerald-500"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {weekStats.applicationsTrend > 0 ? (
                  <span className="inline-flex items-center gap-0.5">
                    <TrendUp className="w-2.5 h-2.5" />
                    {Math.abs(weekStats.applicationsTrend)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5">
                    <TrendDown className="w-2.5 h-2.5" />
                    {Math.abs(weekStats.applicationsTrend)}%
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">Applications</div>
        </div>

        <div className="p-2.5 bg-[var(--glass-input-bg)] border border-[var(--glass-card-border)] rounded-[calc(var(--radius)-2px)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold text-foreground">
              {weekStats.newCaptures}
            </span>
            {formatTrend(weekStats.newCapturesTrend) && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  weekStats.newCapturesTrend > 0
                    ? "bg-emerald-500/20 text-emerald-500"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {weekStats.newCapturesTrend > 0 ? (
                  <span className="inline-flex items-center gap-0.5">
                    +{weekStats.newCapturesTrend}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5">
                    {weekStats.newCapturesTrend}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">New captures</div>
        </div>
      </div>

      {/* Close to Graduation */}
      {nearGraduation.length > 0 && (
        <GraduationCallout thoughts={nearGraduation} className="mb-3.5" />
      )}

      {/* Compact Stats Footer */}
      <div className="flex items-center justify-center gap-4 pt-3 border-t border-[var(--glass-card-border)]">
        <div className="flex items-center gap-1 text-xs">
          <span className="font-semibold text-foreground">{totals.activeGems}</span>
          <span className="text-muted-foreground">active</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <div className="flex items-center gap-1 text-xs">
          <span className="font-semibold text-foreground">{totals.graduatedGems}</span>
          <span className="text-muted-foreground">graduated</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <div className="flex items-center gap-1 text-xs">
          <span className="font-semibold text-foreground">{totals.totalApplications}</span>
          <span className="text-muted-foreground">applied</span>
        </div>
      </div>
    </HomeQuadrant>
  )
}
