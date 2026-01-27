import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { saveDiscoveryForLater, unsaveDiscovery } from "@/lib/discovery"

/**
 * POST /api/discover/bookmark
 * Save a discovery for later (bookmark to reading list)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { discovery_id } = body

    if (!discovery_id) {
      return NextResponse.json(
        { error: "Discovery ID is required" },
        { status: 400 }
      )
    }

    const { discovery, error } = await saveDiscoveryForLater(discovery_id, user.id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      discovery,
      message: "Discovery saved for later",
    })
  } catch (error) {
    console.error("Bookmark discovery API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/discover/bookmark
 * Remove a discovery from the reading list
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { discovery_id } = body

    if (!discovery_id) {
      return NextResponse.json(
        { error: "Discovery ID is required" },
        { status: 400 }
      )
    }

    const { discovery, error } = await unsaveDiscovery(discovery_id, user.id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      discovery,
      message: "Discovery removed from saved list",
    })
  } catch (error) {
    console.error("Unbookmark discovery API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
