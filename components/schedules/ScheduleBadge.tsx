"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getScheduleCountForGem, getNextTriggerForGem } from "@/lib/schedules"

interface ScheduleBadgeProps {
  gemId: string
  className?: string
  showNextTrigger?: boolean
}

export function ScheduleBadge({ gemId, className, showNextTrigger = false }: ScheduleBadgeProps) {
  const [count, setCount] = useState(0)
  const [nextTrigger, setNextTrigger] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadScheduleInfo() {
      setIsLoading(true)
      const { count: scheduleCount } = await getScheduleCountForGem(gemId)
      setCount(scheduleCount)

      if (showNextTrigger && scheduleCount > 0) {
        const { nextTrigger: trigger } = await getNextTriggerForGem(gemId)
        setNextTrigger(trigger)
      }
      setIsLoading(false)
    }

    loadScheduleInfo()
  }, [gemId, showNextTrigger])

  if (isLoading || count === 0) {
    return null
  }

  const formatNextTrigger = (date: Date): string => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 1) {
      return `in ${diffDays} days`
    } else if (diffDays === 1) {
      return "tomorrow"
    } else if (diffHours > 1) {
      return `in ${diffHours}h`
    } else if (diffHours === 1) {
      return "in 1 hour"
    } else {
      return "soon"
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-info/10 text-info border-info/30 gap-1",
        className
      )}
      title={
        nextTrigger
          ? `Next check-in: ${nextTrigger.toLocaleString()}`
          : `${count} active schedule${count > 1 ? "s" : ""}`
      }
    >
      <Clock className="h-3 w-3" />
      {showNextTrigger && nextTrigger ? (
        <span>{formatNextTrigger(nextTrigger)}</span>
      ) : (
        <span>{count}</span>
      )}
    </Badge>
  )
}
