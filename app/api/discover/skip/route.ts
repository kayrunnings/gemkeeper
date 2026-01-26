import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDiscoveryById, updateDiscoveryStatus, addSkippedContent } from "@/lib/discovery"

/**
 * POST /api/discover/skip
 * Skip a discovery (won't be shown again)
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
    const { discovery_id } = body as { discovery_id?: string }

    // Validate required fields
    if (!discovery_id) {
      return NextResponse.json(
        { error: "Discovery ID is required" },
        { status: 400 }
      )
    }

    // Verify discovery exists and belongs to user
    const { discovery, error: fetchError } = await getDiscoveryById(
      discovery_id,
      user.id
    )

    if (fetchError || !discovery) {
      return NextResponse.json(
        { error: "Discovery not found" },
        { status: 404 }
      )
    }

    if (discovery.status !== "pending") {
      return NextResponse.json(
        { error: "This discovery has already been processed" },
        { status: 409 }
      )
    }

    // Update discovery status to skipped
    const { error: updateError } = await updateDiscoveryStatus(
      discovery_id,
      user.id,
      "skipped"
    )

    if (updateError) {
      console.error("Discovery update error:", updateError)
      return NextResponse.json(
        { error: "Failed to skip discovery" },
        { status: 500 }
      )
    }

    // Add URL to skip list so it won't appear again
    const { error: skipError } = await addSkippedContent(user.id, discovery.source_url)
    if (skipError) {
      console.error("Skip list error:", skipError)
      // Don't fail - the discovery was already marked as skipped
    }

    return NextResponse.json({
      success: true,
      message: "Discovery skipped",
    })
  } catch (error) {
    console.error("Skip discovery API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
