import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDiscoveryUsage, getBootstrapStatus } from "@/lib/discovery"
import { BOOTSTRAP_MIN_CONTEXTS, BOOTSTRAP_MIN_THOUGHTS } from "@/lib/types/discovery"

/**
 * GET /api/discover/usage
 * Get the user's discovery usage for today
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
    // Get usage status
    const { usage, error: usageError } = await getDiscoveryUsage(user.id)
    if (usageError) {
      console.error("Usage fetch error:", usageError)
      return NextResponse.json(
        { error: "Failed to fetch usage" },
        { status: 500 }
      )
    }

    // Get bootstrap status
    const { contextCount, thoughtCount, error: bootstrapError } = await getBootstrapStatus(user.id)
    if (bootstrapError) {
      console.error("Bootstrap status error:", bootstrapError)
      // Continue with zeros
    }

    // Determine if user needs bootstrap
    const needsBootstrap =
      contextCount < BOOTSTRAP_MIN_CONTEXTS || thoughtCount < BOOTSTRAP_MIN_THOUGHTS

    return NextResponse.json({
      ...usage,
      needs_bootstrap: needsBootstrap,
      context_count: contextCount,
      thought_count: thoughtCount,
      min_contexts: BOOTSTRAP_MIN_CONTEXTS,
      min_thoughts: BOOTSTRAP_MIN_THOUGHTS,
    })
  } catch (error) {
    console.error("Discovery usage API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
