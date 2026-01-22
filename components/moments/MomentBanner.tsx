"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, X, Clock } from "lucide-react"
import type { Moment } from "@/types/moments"

interface MomentBannerProps {
  moment: Moment
  onDismiss: () => void
}

export function MomentBanner({ moment, onDismiss }: MomentBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()

  const getTimeUntil = (): string => {
    if (!moment.calendar_event_start) return ""

    const start = new Date(moment.calendar_event_start)
    const now = new Date()
    const diffMs = start.getTime() - now.getTime()

    if (diffMs <= 0) return "now"

    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 60) return `in ${diffMins}m`

    const diffHours = Math.floor(diffMins / 60)
    return `in ${diffHours}h ${diffMins % 60}m`
  }

  const [timeUntil, setTimeUntil] = useState(getTimeUntil())

  // Update time until every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getTimeUntil()
      setTimeUntil(newTime)

      // Auto-dismiss when event has started
      if (newTime === "now" && moment.calendar_event_start) {
        const start = new Date(moment.calendar_event_start)
        if (Date.now() > start.getTime() + 5 * 60 * 1000) {
          // 5 min after start
          handleDismiss()
        }
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [moment.calendar_event_start])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  const handleTap = () => {
    router.push(`/moments/${moment.id}/prepare`)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-amber-500 text-white",
        "shadow-lg"
      )}
    >
      <div className="container flex items-center justify-between gap-4 py-3 px-4">
        <button
          onClick={handleTap}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {moment.calendar_event_title || moment.description}
            </p>
            {timeUntil && (
              <p className="text-sm text-amber-100 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Starting {timeUntil}</span>
                <span className="mx-1">•</span>
                <span>Tap to prepare</span>
              </p>
            )}
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-white hover:bg-amber-600 shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Container component that manages multiple banners
 */
interface MomentBannerContainerProps {
  moments: Moment[]
  onDismiss: (momentId: string) => void
}

export function MomentBannerContainer({
  moments,
  onDismiss,
}: MomentBannerContainerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleDismiss = (momentId: string) => {
    setDismissedIds((prev) => new Set([...prev, momentId]))
    onDismiss(momentId)
  }

  const visibleMoments = moments.filter((m) => !dismissedIds.has(m.id))

  // Only show the most urgent banner
  const urgentMoment = visibleMoments[0]

  if (!urgentMoment) return null

  return (
    <MomentBanner
      moment={urgentMoment}
      onDismiss={() => handleDismiss(urgentMoment.id)}
    />
  )
}
