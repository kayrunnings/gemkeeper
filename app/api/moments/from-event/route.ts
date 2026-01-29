import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { matchGemsToMoment } from "@/lib/matching"
import type { GemForMatching } from "@/types/matching"

/**
 * Create a moment from a calendar event on-demand
 * This allows users to prepare for events before they're within the lead time window
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event_cache_id } = body as { event_cache_id: string }

    if (!event_cache_id) {
      return NextResponse.json({ error: "event_cache_id is required" }, { status: 400 })
    }

    // Get the cached calendar event
    const { data: event, error: eventError } = await supabase
      .from("calendar_events_cache")
      .select("*")
      .eq("id", event_cache_id)
      .eq("user_id", user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Calendar event not found" }, { status: 404 })
    }

    // If moment already exists, return it
    if (event.moment_created && event.moment_id) {
      return NextResponse.json({ moment_id: event.moment_id, already_exists: true })
    }

    // Get all active and passive gems for AI matching
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

    // Create the moment
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

    if (momentError || !moment) {
      console.error("Moment creation error:", momentError)
      return NextResponse.json({ error: "Failed to create moment" }, { status: 500 })
    }

    let matchedCount = 0
    let processingTimeMs = 0

    // Run AI matching if we have gems
    if (gemsForMatching.length > 0) {
      try {
        const matchResult = await matchGemsToMoment(event.title, gemsForMatching)
        processingTimeMs = matchResult.processing_time_ms

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
              ai_processing_time_ms: processingTimeMs,
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

    return NextResponse.json({
      moment_id: moment.id,
      matched_count: matchedCount,
      processing_time_ms: processingTimeMs,
    })
  } catch (error) {
    console.error("Create moment from event error:", error)
    return NextResponse.json(
      { error: "Failed to create moment from event" },
      { status: 500 }
    )
  }
}
