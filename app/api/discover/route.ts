import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getDiscoveryUsage,
  createDiscoveries,
  incrementUsage,
  checkContentSkipped,
  getSampleThoughts,
} from "@/lib/discovery"
import { generateDiscoveries } from "@/lib/ai/gemini"
import type { DiscoverySessionType } from "@/lib/types/discovery"

/**
 * POST /api/discover
 * Generate discoveries for the user
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
    const { mode, query, context_id } = body as {
      mode?: DiscoverySessionType
      query?: string
      context_id?: string
    }

    // Validate mode
    if (!mode || !["curated", "directed"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'curated' or 'directed'" },
        { status: 400 }
      )
    }

    // Validate directed mode requires a query
    if (mode === "directed" && (!query || query.trim().length === 0)) {
      return NextResponse.json(
        { error: "Query is required for directed mode" },
        { status: 400 }
      )
    }

    // Check usage limits
    const { usage, error: usageError } = await getDiscoveryUsage(user.id)
    if (usageError) {
      console.error("Usage check error:", usageError)
      return NextResponse.json(
        { error: "Failed to check usage limits" },
        { status: 500 }
      )
    }

    // Check if user has remaining sessions
    if (mode === "curated" && usage.curated_used) {
      return NextResponse.json(
        { error: "You've used your curated discovery session for today. Try again tomorrow!" },
        { status: 429 }
      )
    }

    if (mode === "directed" && usage.directed_used) {
      return NextResponse.json(
        { error: "You've used your directed discovery session for today. Try again tomorrow!" },
        { status: 429 }
      )
    }

    // Get user's contexts
    const { data: contexts, error: contextsError } = await supabase
      .from("contexts")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })

    if (contextsError || !contexts || contexts.length === 0) {
      console.error("Contexts fetch error:", contextsError)
      return NextResponse.json(
        { error: "No contexts found. Please create some contexts first." },
        { status: 400 }
      )
    }

    // Get sample thoughts for AI context
    const { thoughts: sampleThoughts } = await getSampleThoughts(user.id, 15)

    // Generate discoveries using Gemini
    let generatedDiscoveries
    try {
      const result = await generateDiscoveries(
        mode,
        contexts,
        sampleThoughts,
        query?.trim(),
        context_id
      )
      generatedDiscoveries = result.discoveries
    } catch (error) {
      console.error("AI generation error:", error)
      return NextResponse.json(
        { error: "Failed to generate discoveries. Please try again." },
        { status: 500 }
      )
    }

    if (!generatedDiscoveries || generatedDiscoveries.length === 0) {
      return NextResponse.json(
        { error: "No discoveries found. Try a different search or context." },
        { status: 404 }
      )
    }

    // Filter out previously skipped content
    const filteredDiscoveries = []
    for (const discovery of generatedDiscoveries) {
      const { skipped } = await checkContentSkipped(user.id, discovery.source_url)
      if (!skipped) {
        filteredDiscoveries.push(discovery)
      }
    }

    // Store discoveries in database
    const { discoveries: savedDiscoveries, error: saveError } = await createDiscoveries(
      user.id,
      mode,
      mode === "directed" ? query?.trim() || null : null,
      context_id || null,
      filteredDiscoveries,
      contexts
    )

    if (saveError) {
      console.error("Discovery save error:", saveError)
      return NextResponse.json(
        { error: "Failed to save discoveries" },
        { status: 500 }
      )
    }

    // Increment usage counter
    const { error: incrementError } = await incrementUsage(user.id, mode)
    if (incrementError) {
      console.error("Usage increment error:", incrementError)
      // Don't fail the request, just log
    }

    // Get updated usage
    const { usage: updatedUsage } = await getDiscoveryUsage(user.id)

    return NextResponse.json({
      discoveries: savedDiscoveries,
      session_type: mode,
      remaining_curated: updatedUsage?.curated_remaining ?? 0,
      remaining_directed: updatedUsage?.directed_remaining ?? 0,
    })
  } catch (error) {
    console.error("Discover API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
