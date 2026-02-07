import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { MomentWithGems, CalendarEventData } from "@/types/moments"
import { MAX_MOMENT_DESCRIPTION_LENGTH } from "@/types/moments"
import type { EventType } from "@/lib/moments/title-analysis"
import { combineContextForMatching } from "@/lib/moments/title-analysis"
import { LEARNING_HELPFUL_THRESHOLD } from "@/lib/types/learning"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      description,
      source = 'manual',
      calendarData,
      // Epic 14: Moment Intelligence fields
      user_context,
      detected_event_type,
    } = body as {
      description?: string
      source?: 'manual' | 'calendar'
      calendarData?: CalendarEventData
      user_context?: string | null
      detected_event_type?: EventType | null
    }

    // Validate description
    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      )
    }

    if (description.length > MAX_MOMENT_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${MAX_MOMENT_DESCRIPTION_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    // Create the moment
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      description: description.trim(),
      source,
      status: 'active',
      gems_matched_count: 0,
      // Epic 14: Store enrichment data
      user_context: user_context || null,
      detected_event_type: detected_event_type || null,
    }

    if (calendarData) {
      insertData.calendar_event_id = calendarData.event_id
      insertData.calendar_event_title = calendarData.title
      insertData.calendar_event_start = calendarData.start_time
    }

    // Epic 14: Combine description with user context for better matching
    const matchingDescription = combineContextForMatching(
      description.trim(),
      user_context || undefined
    )

    const { data: moment, error: momentError } = await supabase
      .from("moments")
      .insert(insertData)
      .select()
      .single()

    if (momentError) {
      console.error("Moment creation error:", momentError)
      return NextResponse.json(
        { error: "Failed to create moment" },
        { status: 500 }
      )
    }

    // Get all active and passive gems for the user (not retired/graduated)
    // Moments should search the full wisdom library
    const { data: gems, error: gemsError } = await supabase
      .from("gems")
      .select("id, content, context_tag, source")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])

    if (gemsError) {
      console.error("Gems fetch error:", gemsError)
      // Return moment with no matches
      return NextResponse.json({
        moment: {
          ...moment,
          matched_thoughts: [],
        } as MomentWithGems
      })
    }

    // If no gems, return moment with empty matches
    if (!gems || gems.length === 0) {
      return NextResponse.json({
        moment: {
          ...moment,
          matched_thoughts: [],
        } as MomentWithGems
      })
    }

    // Epic 14: Fetch learned thoughts that might be relevant
    // Build pattern conditions based on event type and keywords
    let learnedGemIds: string[] = []
    try {
      const patternConditions: Array<{ type: string; key: string }> = []

      // Event type pattern
      if (detected_event_type && detected_event_type !== 'unknown') {
        patternConditions.push({ type: 'event_type', key: detected_event_type })
      }

      // Recurring event pattern (if calendar event)
      if (calendarData?.event_id) {
        const baseEventId = calendarData.event_id.split('_')[0]
        patternConditions.push({ type: 'recurring', key: `event:${baseEventId}` })
      }

      // Extract keywords from description for keyword patterns
      const keywords = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5)

      for (const keyword of keywords) {
        patternConditions.push({ type: 'keyword', key: keyword })
      }

      if (patternConditions.length > 0) {
        // Fetch learnings that match any of our patterns
        const { data: learnings } = await supabase
          .from('moment_learnings')
          .select('gem_id, helpful_count, not_helpful_count')
          .eq('user_id', user.id)
          .gte('helpful_count', LEARNING_HELPFUL_THRESHOLD)

        if (learnings && learnings.length > 0) {
          // Filter and aggregate by gem_id
          const gemHelpfulness = new Map<string, { helpful: number; total: number }>()

          for (const learning of learnings) {
            const existing = gemHelpfulness.get(learning.gem_id)
            const helpful = learning.helpful_count || 0
            const notHelpful = learning.not_helpful_count || 0

            if (existing) {
              existing.helpful += helpful
              existing.total += helpful + notHelpful
            } else {
              gemHelpfulness.set(learning.gem_id, {
                helpful,
                total: helpful + notHelpful,
              })
            }
          }

          // Get gem IDs with confidence >= 0.7
          learnedGemIds = [...gemHelpfulness.entries()]
            .filter(([, data]) => data.total > 0 && data.helpful / data.total >= 0.7)
            .map(([gemId]) => gemId)
        }
      }
    } catch (learnedError) {
      console.error("Error fetching learned thoughts:", learnedError)
      // Continue without learned thoughts
    }

    // Call AI matching endpoint
    const startTime = Date.now()
    let matchedGems: Array<{
      gem_id: string
      relevance_score: number
      relevance_reason: string | null
    }> = []

    // Epic 14: Build learned thoughts array with content for prompt
    const learnedThoughtsForPrompt = learnedGemIds.length > 0
      ? gems
          .filter(g => learnedGemIds.includes(g.id))
          .map(g => ({
            gem_id: g.id,
            gem_content: g.content,
            confidence_score: 0.8, // Simplified confidence for now
          }))
      : []

    try {
      const matchResponse = await fetch(
        new URL("/api/moments/match", request.url).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            // Epic 14: Use combined description with user context for better matching
            moment_description: matchingDescription,
            gems: gems.map(g => ({
              id: g.id,
              content: g.content,
              context_tag: g.context_tag,
              source: g.source,
            })),
            // Epic 14: Pass learned thoughts
            learned_thoughts: learnedThoughtsForPrompt,
          }),
        }
      )

      if (matchResponse.ok) {
        const matchData = await matchResponse.json()
        matchedGems = matchData.matches || []
      }
    } catch (matchError) {
      console.error("AI matching error:", matchError)
      // Continue without matches
    }

    const processingTimeMs = Date.now() - startTime

    // Insert matched gems
    if (matchedGems.length > 0) {
      const momentGemsData = matchedGems.map((match) => ({
        moment_id: moment.id,
        gem_id: match.gem_id,
        user_id: user.id,
        relevance_score: match.relevance_score,
        relevance_reason: match.relevance_reason,
        was_helpful: null,
        was_reviewed: false,
      }))

      await supabase.from("moment_gems").insert(momentGemsData)
    }

    // Update moment with match count and processing time
    await supabase
      .from("moments")
      .update({
        gems_matched_count: matchedGems.length,
        ai_processing_time_ms: processingTimeMs,
      })
      .eq("id", moment.id)

    // Fetch the complete moment with gems
    const { data: fullMoment } = await supabase
      .from("moments")
      .select("*")
      .eq("id", moment.id)
      .single()

    const { data: momentGemRecords } = await supabase
      .from("moment_gems")
      .select(`
        *,
        thought:gems(*)
      `)
      .eq("moment_id", moment.id)
      .order("relevance_score", { ascending: false })

    return NextResponse.json({
      moment: {
        ...(fullMoment || moment),
        matched_thoughts: momentGemRecords || [],
      } as MomentWithGems
    })
  } catch (error) {
    console.error("Moment API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "10")
  const source = searchParams.get("source") as 'manual' | 'calendar' | null

  let query = supabase
    .from("moments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (source) {
    query = query.eq("source", source)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ moments: data || [] })
}
