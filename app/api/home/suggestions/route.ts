import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateDiscoveries } from "@/lib/ai/gemini"
import type { Context } from "@/lib/types/context"

export interface ForYouSuggestion {
  id: string
  title: string
  source: string
  url: string
  contextSlug: string
  contextName?: string
  teaser: string
}

/**
 * GET /api/home/suggestions
 * Fetch personalized "For You" suggestions for the home page
 * Reuses the existing discovery generation logic that powers the Discover feature
 */
export async function GET() {
  try {
    // Check if API key is available - return empty if not
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn("GOOGLE_AI_API_KEY not set, returning empty suggestions")
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's contexts (full data for generateDiscoveries)
    const { data: contexts, error: contextsError } = await supabase
      .from("contexts")
      .select("*")
      .eq("user_id", user.id)
      .order("thought_count", { ascending: false })

    if (contextsError) {
      console.error("Contexts fetch error:", contextsError)
      return NextResponse.json({ suggestions: [] })
    }

    // If user has no contexts or very few, return empty suggestions
    if (!contexts || contexts.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get sample thoughts for personalization (same as Discovery feature)
    const { data: sampleThoughts } = await supabase
      .from("gems")
      .select("content, context_id")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])
      .order("created_at", { ascending: false })
      .limit(10)

    // Format thoughts for the AI
    const thoughtsWithContext = (sampleThoughts || []).map((t) => {
      const context = contexts.find((c) => c.id === t.context_id)
      return {
        content: t.content,
        context_name: context?.name,
      }
    })

    // Use the existing generateDiscoveries function (curated mode)
    // This is the same function that powers the working Discover feature
    console.log("Generating For You suggestions using existing discovery logic...")
    const { discoveries } = await generateDiscoveries(
      "curated",
      contexts as Context[],
      thoughtsWithContext,
      undefined, // no specific query
      undefined  // no specific context
    )

    // Convert discoveries to ForYouSuggestion format (take top 3)
    const suggestions: ForYouSuggestion[] = discoveries
      .slice(0, 3)
      .map((d, index) => {
        const matchedContext = contexts.find((c) => c.slug === d.suggested_context_slug)
        // Extract hostname from URL for source display, or use source_type as fallback
        let sourceName: string = d.source_type
        if (d.source_url) {
          try {
            sourceName = new URL(d.source_url).hostname.replace("www.", "")
          } catch {
            // Keep source_type if URL parsing fails
          }
        }
        return {
          id: `suggestion-${index}-${Date.now()}`,
          title: d.source_title.slice(0, 60),
          source: sourceName,
          url: d.source_url || `https://www.google.com/search?q=${encodeURIComponent(d.source_title)}`,
          contextSlug: d.suggested_context_slug,
          contextName: matchedContext?.name,
          teaser: d.relevance_reason.slice(0, 80),
        }
      })
      .filter((s) => s.title && s.url)

    console.log(`Generated ${suggestions.length} For You suggestions`)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Home suggestions error:", error)
    // Return empty suggestions on error (graceful degradation)
    return NextResponse.json({ suggestions: [] })
  }
}
