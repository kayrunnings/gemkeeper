import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { syncCalendarEvents } from "@/lib/calendar"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { connectionId } = body as { connectionId?: string }

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      )
    }

    // Verify connection belongs to user
    const { data: connection } = await supabase
      .from("calendar_connections")
      .select("id")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single()

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      )
    }

    const { result, error } = await syncCalendarEvents(connectionId, supabase)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Calendar sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    )
  }
}
