import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { FOR_YOU_SUGGESTIONS_PROMPT } from "@/lib/ai/prompts"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

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
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's contexts
    const { data: contexts, error: contextsError } = await supabase
      .from("contexts")
      .select("id, name, slug, thought_count")
      .eq("user_id", user.id)
      .order("thought_count", { ascending: false })

    if (contextsError) {
      console.error("Contexts fetch error:", contextsError)
      return NextResponse.json(
        { error: "Failed to fetch contexts" },
        { status: 500 }
      )
    }

    // If user has no contexts or very few, return empty suggestions
    if (!contexts || contexts.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get recent activity for context
    const { data: recentThoughts } = await supabase
      .from("gems")
      .select("content, context_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Build recent activity context
    let recentActivity = ""
    if (recentThoughts && recentThoughts.length > 0) {
      const samples = recentThoughts.map((t) => {
        const context = contexts.find((c) => c.id === t.context_id)
        return context ? `[${context.name}] ${t.content.slice(0, 100)}...` : t.content.slice(0, 100)
      })
      recentActivity = `Recent thoughts the user captured:\n${samples.join("\n")}`
    }

    // Build the prompt - format contexts inline (simpler type handling)
    const contextsList = contexts
      .map((c) => `- ${c.slug}: ${c.name}`)
      .join('\n')
    const systemPrompt = FOR_YOU_SUGGESTIONS_PROMPT
      .replace("{contexts_list}", contextsList)
      .replace("{recent_activity}", recentActivity)

    let parsed: { suggestions?: unknown[] } = { suggestions: [] }

    // Try with Google Search grounding first
    try {
      console.log("Attempting For You suggestions with Google Search grounding...")
      const groundedModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 1024,
        },
        tools: [
          {
            googleSearchRetrieval: {},
          },
        ],
      })

      const result = await groundedModel.generateContent([
        { text: systemPrompt },
        { text: "Find 3 trending, high-quality articles that would interest this user based on their contexts and recent activity." },
      ])

      const response = result.response
      const text = response.text()
      console.log("Grounded response received:", text.slice(0, 200))

      try {
        parsed = JSON.parse(text)
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      }
    } catch (groundingError) {
      console.warn("Google Search grounding failed, trying fallback:", groundingError)
    }

    // Fallback: use standard model without grounding if no results
    if (!parsed.suggestions || parsed.suggestions.length === 0) {
      try {
        console.log("Using fallback model for suggestions...")
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-001",
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 1024,
          },
        })

        const fallbackPrompt = `Based on the user's interests, suggest 3 well-known books, articles, or resources they might find valuable.

User's interests:
${contextsList}

${recentActivity}

For each suggestion, provide:
- title: A real, well-known book or article title
- source: The author or publication
- url: Use format "https://www.google.com/search?q=" followed by the URL-encoded title
- context_slug: Which context this matches
- teaser: Why they should check this out (max 80 chars)

Return valid JSON: { "suggestions": [...] }`

        const result = await fallbackModel.generateContent([
          { text: fallbackPrompt },
        ])

        const text = result.response.text()
        console.log("Fallback response received:", text.slice(0, 200))

        try {
          parsed = JSON.parse(text)
        } catch {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0])
          }
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
    }

    // Validate and format suggestions
    const suggestions: ForYouSuggestion[] = (parsed.suggestions || [])
      .slice(0, 3)
      .map((s: unknown, index: number) => {
        const suggestion = s as Record<string, unknown>
        const contextSlug = String(suggestion.context_slug || "other")
        const matchedContext = contexts.find((c) => c.slug === contextSlug)

        return {
          id: `suggestion-${index}-${Date.now()}`,
          title: String(suggestion.title || "").slice(0, 60),
          source: String(suggestion.source || ""),
          url: String(suggestion.url || ""),
          contextSlug,
          contextName: matchedContext?.name,
          teaser: String(suggestion.teaser || "").slice(0, 80),
        }
      })
      .filter((s) => s.title && s.url && s.url.startsWith("http"))

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Home suggestions error:", error)
    // Return empty suggestions on error (graceful degradation)
    return NextResponse.json({ suggestions: [] })
  }
}
