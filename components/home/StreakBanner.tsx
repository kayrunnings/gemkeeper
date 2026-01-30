"use client"

import { cn } from "@/lib/utils"
import { Fire } from "@phosphor-icons/react"

interface StreakBannerProps {
  currentStreak: number
  bestStreak: number
  weeklyActivity: boolean[] // Array of 7 booleans for each day (Mon-Sun), true = active
  className?: string
}

export function StreakBanner({
  currentStreak,
  bestStreak,
  weeklyActivity,
  className,
}: StreakBannerProps) {
  // Get today's day index (0 = Sunday, but we display Mon-Sun so adjust)
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1 // Convert to Mon=0, Sun=6

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3",
        "bg-gradient-to-br from-orange-500/15 to-red-500/10",
        "border border-orange-500/20 rounded-[calc(var(--radius)-2px)]",
        className
      )}
    >
      {/* Streak info */}
      <div className="flex items-center gap-2">
        <Fire weight="fill" className="w-5 h-5 text-orange-500" />
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-foreground">
            {currentStreak} day streak
          </span>
          <span className="text-[11px] text-muted-foreground">
            Best: {bestStreak} days
          </span>
        </div>
      </div>

      {/* Weekly dots */}
      <div className="flex gap-0.5">
        {weeklyActivity.map((isActive, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-sm border",
              index === todayIndex
                ? "bg-primary border-primary shadow-[0_0_6px_var(--ai-glow)]"
                : isActive
                  ? "bg-orange-500/60 border-orange-500/80"
                  : "bg-[var(--glass-input-bg)] border-[var(--glass-card-border)]"
            )}
          />
        ))}
      </div>
    </div>
  )
}
