import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPendingEventsForMoments } from "@/lib/calendar"
import { matchGemsToMoment } from "@/lib/matching"
import type { CalendarEvent } from "@/types/calendar"
import type { GemForMatching } from "@/types/matching"

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

    // Get all active and passive gems for AI matching
    // Moments should search the full knowledge library (both active and passive)
    const { data: gems, error: gemsError } = await supabase
      .from("gems")
      .select("id, content, context_tag, source")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])

    if (gemsError) {
      console.error("Gems fetch error:", gemsError)
    }

    const gemsForMatching: GemForMatching[] = gems?.map(g => ({
      id: g.id,
      content: g.content,
      context_tag: g.context_tag,
      source: g.source,
    })) || []

    const createdMoments: Array<{ event: CalendarEvent; momentId: string; matchedCount: number }> = []

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
          let matchedCount = 0

          // Run AI matching if we have gems
          if (gemsForMatching.length > 0) {
            try {
              const matchResult = await matchGemsToMoment(event.title, gemsForMatching)

              if (matchResult.matches.length > 0) {
                // Insert matched gems into moment_gems table
                const momentGemsData = matchResult.matches.map((match) => ({
                  moment_id: moment.id,
                  gem_id: match.gem_id,
                  user_id: user.id,
                  relevance_score: match.relevance_score,
                  relevance_reason: match.relevance_reason,
                  was_helpful: null,
                  was_reviewed: false,
                }))

                await supabase.from("moment_gems").insert(momentGemsData)
                matchedCount = matchResult.matches.length

                // Update moment with match count and processing time
                await supabase
                  .from("moments")
                  .update({
                    gems_matched_count: matchedCount,
                    ai_processing_time_ms: matchResult.processing_time_ms,
                  })
                  .eq("id", moment.id)
              }
            } catch (matchError) {
              console.error(`AI matching error for event: ${event.title}`, matchError)
              // Continue without matches - moment is still created
            }
          }

          // Mark event as having moment created
          await supabase
            .from("calendar_events_cache")
            .update({
              moment_created: true,
              moment_id: moment.id,
            })
            .eq("id", event.id)

          createdMoments.push({ event, momentId: moment.id, matchedCount })
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
