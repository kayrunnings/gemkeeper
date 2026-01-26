import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { MomentWithGems, CalendarEventData } from "@/types/moments"
import { MAX_MOMENT_DESCRIPTION_LENGTH } from "@/types/moments"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { description, source = 'manual', calendarData } = body as {
      description?: string
      source?: 'manual' | 'calendar'
      calendarData?: CalendarEventData
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
    }

    if (calendarData) {
      insertData.calendar_event_id = calendarData.event_id
      insertData.calendar_event_title = calendarData.title
      insertData.calendar_event_start = calendarData.start_time
    }

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

    // Call AI matching endpoint
    const startTime = Date.now()
    let matchedGems: Array<{
      gem_id: string
      relevance_score: number
      relevance_reason: string | null
    }> = []

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
            moment_description: description,
            gems: gems.map(g => ({
              id: g.id,
              content: g.content,
              context_tag: g.context_tag,
              source: g.source,
            })),
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
        gem:gems(*)
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
