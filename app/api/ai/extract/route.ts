import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractGemsFromContent, extractGemsFromMultimedia } from "@/lib/ai/gemini"
import {
  checkUsageLimit,
  recordUsage,
  getCachedExtraction,
  cacheExtraction,
  hashContent,
} from "@/lib/ai/rate-limit"

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Check AI consent
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_consent_given")
    .eq("id", user.id)
    .single()

  if (!profile?.ai_consent_given) {
    return NextResponse.json({ error: "AI consent required" }, { status: 403 })
  }

  // 3. Parse request
  const body = await request.json()
  const { content, source, media } = body as {
    content?: string
    source?: string
    media?: Array<{ mimeType: string; data: string }>
  }

  // Validate input
  const hasContent = content && typeof content === "string" && content.length > 0
  const hasMedia = media && Array.isArray(media) && media.length > 0

  if (!hasContent && !hasMedia) {
    return NextResponse.json(
      { error: "Content or media is required" },
      { status: 400 }
    )
  }

  if (content && content.length > 10000) {
    return NextResponse.json(
      { error: "Content exceeds 10,000 character limit" },
      { status: 400 }
    )
  }

  if (content && content.length < 100 && !hasMedia) {
    return NextResponse.json(
      { error: "Please paste at least 100 characters for extraction" },
      { status: 400 }
    )
  }

  // 4. Check rate limit
  const usage = await checkUsageLimit(user.id)
  if (!usage.canExtract) {
    return NextResponse.json(
      {
        error: "Daily limit reached",
        usage,
      },
      { status: 429 }
    )
  }

  // 5. Check cache (only for text-only extractions)
  if (hasContent && !hasMedia) {
    const contentHash = hashContent(content!)
    const cached = await getCachedExtraction(user.id, contentHash)
    if (cached) {
      return NextResponse.json({
        gems: cached.gems,
        cached: true,
        usage,
      })
    }
  }

  // 6. Call Gemini API
  try {
    let result

    if (hasMedia) {
      // Multimedia extraction
      result = await extractGemsFromMultimedia(content || "", media!, source)
    } else {
      // Text-only extraction
      result = await extractGemsFromContent(content!, source)
    }

    // Check if no gems were extracted
    if (result.gems.length === 0) {
      return NextResponse.json(
        {
          error: "No actionable insights found. Try pasting different content.",
          usage,
        },
        { status: 422 }
      )
    }

    // 7. Record usage and cache result (only cache text-only extractions)
    await recordUsage(user.id, result.tokens_used)

    if (hasContent && !hasMedia) {
      const contentHash = hashContent(content!)
      await cacheExtraction(
        user.id,
        contentHash,
        content!,
        source ?? null,
        result
      )
    }

    // 8. Return extracted gems
    const updatedUsage = await checkUsageLimit(user.id)
    return NextResponse.json({
      gems: result.gems,
      cached: false,
      usage: updatedUsage,
    })
  } catch (error) {
    console.error("AI extraction error:", error)

    // Check for JSON parsing errors (invalid AI response)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid response. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to extract gems. Please try again." },
      { status: 500 }
    )
  }
}
