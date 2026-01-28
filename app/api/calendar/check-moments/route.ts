import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPendingEventsForMoments } from "@/lib/calendar"
import type { CalendarEvent } from "@/types/calendar"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pending events within lead time
    const { events: pendingEvents, error: fetchError } = await getPendingEventsForMoments()

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 })
    }

    if (pendingEvents.length === 0) {
      return NextResponse.json({ momentsCreated: 0, events: [] })
    }

    const createdMoments: Array<{ event: CalendarEvent; momentId: string }> = []

    for (const event of pendingEvents) {
      try {
        // Create moment for this event
        const { data: moment, error: momentError } = await supabase
          .from("moments")
          .insert({
            user_id: user.id,
            description: event.title,
            source: "calendar",
            calendar_event_id: event.external_event_id,
            calendar_event_title: event.title,
            calendar_event_start: event.start_time,
            status: "active",
            gems_matched_count: 0,
          })
          .select()
          .single()

        if (!momentError && moment) {
          // Mark event as having moment created
          await supabase
            .from("calendar_events_cache")
            .update({
              moment_created: true,
              moment_id: moment.id,
            })
            .eq("id", event.id)

          createdMoments.push({ event, momentId: moment.id })
        }
      } catch (err) {
        console.error(`Failed to create moment for event: ${event.title}`, err)
      }
    }

    return NextResponse.json({
      momentsCreated: createdMoments.length,
      events: createdMoments,
    })
  } catch (error) {
    console.error("Check moments error:", error)
    return NextResponse.json(
      { error: "Failed to check for upcoming events" },
      { status: 500 }
    )
  }
}
