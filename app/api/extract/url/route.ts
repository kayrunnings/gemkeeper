import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractFromUrl, detectUrlType, extractYouTubeVideoId } from "@/lib/url-extractor"

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    const urlType = detectUrlType(url)

    // Extract content (handles both articles and YouTube)
    const { content, error } = await extractFromUrl(url, 10000)

    if (error) {
      return NextResponse.json(
        {
          error,
          type: urlType,
          url,
          // Provide helpful fallback message
          fallbackMessage: "Unable to extract content automatically. Please paste the content manually.",
        },
        { status: 422 }
      )
    }

    if (!content) {
      return NextResponse.json(
        {
          error: "No content could be extracted from this URL",
          type: urlType,
          url,
          fallbackMessage: "Unable to extract content automatically. Please paste the content manually.",
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      content: {
        title: content.title,
        text: content.content,
        byline: content.byline,
        siteName: content.siteName,
        excerpt: content.excerpt,
        url: content.url,
        type: content.type,
      },
    })
  } catch (err) {
    console.error("URL extraction error:", err)
    return NextResponse.json(
      { error: "Failed to extract content from URL" },
      { status: 500 }
    )
  }
}
