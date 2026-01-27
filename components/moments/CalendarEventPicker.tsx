"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2, AlertCircle, CalendarX, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  description?: string
}

interface CalendarEventPickerProps {
  onClose: () => void
}

export function CalendarEventPicker({ onClose }: CalendarEventPickerProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch upcoming events (next 7 days)
      const response = await fetch("/api/calendar/events?days=7")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to load events")
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar events")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectEvent = async (event: CalendarEvent) => {
    setIsCreating(event.id)
    setError(null)

    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: event.title,
          source: 'calendar',
          calendarData: {
            event_id: event.id,
            title: event.title,
            start_time: event.start_time,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create moment")
      }

      const data = await response.json()

      // Navigate to prep card
      router.push(`/moments/${data.moment.id}/prepare`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsCreating(null)
    }
  }

  const formatEventTime = (startTime: string) => {
    const date = new Date(startTime)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`
    }

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${format(date, 'h:mm a')}`
    }

    return format(date, "EEE, MMM d 'at' h:mm a")
  }

  return (
    <div
      className={cn(
        "absolute bottom-16 right-0 mb-2",
        "bg-card border border-border rounded-xl shadow-xl",
        "w-[320px] sm:w-[360px]",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-500" />
          Upcoming Events
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[350px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadEvents}>
              Try Again
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <CalendarX className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No upcoming events in the next 7 days
            </p>
          </div>
        ) : (
          <div className="py-1">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                disabled={isCreating !== null}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3",
                  "text-left hover:bg-muted transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isCreating === event.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-1 shrink-0" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventTime(event.start_time)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
