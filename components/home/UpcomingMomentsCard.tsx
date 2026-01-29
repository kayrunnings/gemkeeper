"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight, Clock, Target, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Moment } from "@/types/moments"

interface CalendarEventCache {
  id: string
  title: string
  start_time: string
  end_time: string
  moment_created: boolean
  moment_id: string | null
}

interface UpcomingMomentsCardProps {
  moments: Moment[]
  calendarConnected?: boolean
  className?: string
}

function formatEventTime(dateString: string | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function isToday(dateString: string | null): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function UpcomingMomentsCard({ moments, calendarConnected = false, className }: UpcomingMomentsCardProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventCache[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  // Fetch upcoming calendar events from cache
  useEffect(() => {
    async function fetchUpcomingEvents() {
      if (!calendarConnected) return

      setIsLoadingEvents(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        const { data: events } = await supabase
          .from("calendar_events_cache")
          .select("id, title, start_time, end_time, moment_created, moment_id")
          .eq("user_id", user.id)
          .gte("start_time", now.toISOString())
          .lte("start_time", tomorrow.toISOString())
          .order("start_time", { ascending: true })
          .limit(5)

        if (events) {
          setUpcomingEvents(events)
        }
      } catch (err) {
        console.error("Failed to fetch upcoming events:", err)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchUpcomingEvents()
  }, [calendarConnected])

  // Get moments that are from calendar and are upcoming
  const calendarMoments = moments.filter(m => m.source === 'calendar' && m.calendar_event_start)
  const upcomingMoments = calendarMoments
    .filter(m => new Date(m.calendar_event_start!) > new Date())
    .slice(0, 3)

  // Combine: show moments if they exist, otherwise show upcoming events from cache
  const hasUpcomingContent = upcomingMoments.length > 0 || upcomingEvents.length > 0

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Upcoming Moments</CardTitle>
          </div>
          <Link href="/moments">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingEvents ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasUpcomingContent ? (
          <div className="space-y-3">
            {/* Show moments that have been created */}
            {upcomingMoments.map((moment) => (
              <Link
                key={moment.id}
                href={`/moments/${moment.id}/prepare`}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {moment.calendar_event_title || moment.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatEventTime(moment.calendar_event_start)}</span>
                      {isToday(moment.calendar_event_start) && (
                        <Badge variant="outline" className="text-xs">Today</Badge>
                      )}
                    </div>
                  </div>
                  {moment.gems_matched_count > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {moment.gems_matched_count} gems
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
            {/* Show upcoming events that don't have moments yet */}
            {upcomingEvents
              .filter(event => !event.moment_created)
              .slice(0, 3 - upcomingMoments.length)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-dashed border-border"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-muted-foreground">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatEventTime(event.start_time)}</span>
                      {isToday(event.start_time) && (
                        <Badge variant="outline" className="text-xs">Today</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Upcoming
                  </Badge>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-1">No upcoming moments</p>
            <p className="text-sm text-muted-foreground mb-4">
              {calendarConnected
                ? "No events in the next 24 hours. Moments will appear as events approach."
                : "Connect your calendar or create moments manually"
              }
            </p>
            {!calendarConnected && (
              <Link href="/settings">
                <Button variant="outline" size="sm">Connect Calendar</Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
