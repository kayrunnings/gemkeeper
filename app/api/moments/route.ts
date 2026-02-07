import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { MomentWithThoughts, CalendarEventData } from "@/types/moments"
import { MAX_MOMENT_DESCRIPTION_LENGTH } from "@/types/moments"
import type { EventType } from "@/lib/moments/title-analysis"
import { createMomentWithMatching } from "@/lib/moments/create-moment"

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

    const { moment, error } = await createMomentWithMatching(supabase, {
      userId: user.id,
      description,
      source,
      calendarData,
      user_context,
      detected_event_type,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ moment: moment as MomentWithThoughts })
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
