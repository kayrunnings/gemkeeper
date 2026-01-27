import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSavedDiscoveries, getSavedDiscoveriesCount } from "@/lib/discovery"

/**
 * GET /api/discover/saved
 * Get all saved discoveries (reading list)
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [discoveriesResult, countResult] = await Promise.all([
      getSavedDiscoveries(user.id),
      getSavedDiscoveriesCount(user.id),
    ])

    if (discoveriesResult.error) {
      return NextResponse.json(
        { error: discoveriesResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      discoveries: discoveriesResult.discoveries,
      count: countResult.count,
    })
  } catch (error) {
    console.error("Get saved discoveries API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
