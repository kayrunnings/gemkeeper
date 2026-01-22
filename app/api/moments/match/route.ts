import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { matchGemsToMoment } from "@/lib/matching"
import type { GemForMatching } from "@/types/matching"

// Rate limiting: track user requests
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20 // 20 matches per hour
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check rate limit
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in an hour." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { moment_description, gems } = body as {
      moment_description?: string
      gems?: GemForMatching[]
    }

    // Validate moment description
    if (!moment_description || typeof moment_description !== "string") {
      return NextResponse.json(
        { error: "Moment description is required" },
        { status: 400 }
      )
    }

    // Validate gems
    if (!gems || !Array.isArray(gems)) {
      return NextResponse.json(
        { error: "Gems array is required" },
        { status: 400 }
      )
    }

    // Validate each gem has required fields
    const validGems = gems.filter(
      (g) =>
        g &&
        typeof g.id === "string" &&
        typeof g.content === "string" &&
        typeof g.context_tag === "string"
    )

    if (validGems.length === 0) {
      return NextResponse.json({
        matches: [],
        processing_time_ms: 0,
      })
    }

    // Call matching service
    const result = await matchGemsToMoment(moment_description, validGems)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Match API error:", error)
    return NextResponse.json(
      { error: "Failed to match gems" },
      { status: 500 }
    )
  }
}
