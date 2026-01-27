import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get days parameter (default 7)
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get("days") || "7", 10)

    // Get user's active calendar connection
    const { data: connection } = await supabase
      .from("calendar_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!connection) {
      return NextResponse.json({ events: [] })
    }

    // Calculate date range
    const now = new Date()
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    // Fetch cached events
    const { data: events, error } = await supabase
      .from("calendar_events_cache")
      .select("id, external_event_id, title, description, start_time, end_time")
      .eq("user_id", user.id)
      .eq("connection_id", connection.id)
      .gte("start_time", now.toISOString())
      .lte("start_time", endDate.toISOString())
      .order("start_time", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error fetching calendar events:", error)
      return NextResponse.json({ events: [] })
    }

    // Transform to expected format
    const transformedEvents = (events || []).map((event) => ({
      id: event.external_event_id || event.id,
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
    }))

    return NextResponse.json({ events: transformedEvents })

  } catch (error) {
    console.error("Calendar events error:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}
