import { GoogleGenerativeAI } from "@google/generative-ai"
import { ContextTag } from "@/lib/types/thought"
import type { GeneratedDiscovery, DiscoverySourceType, DiscoveryContentType } from "@/lib/types/discovery"
import type { Context } from "@/lib/types/context"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export interface ExtractedThought {
  content: string
  context_tag: ContextTag
  source_quote?: string
}

export interface ExtractionResult {
  thoughts: ExtractedThought[]
  tokens_used: number
}

const EXTRACTION_SYSTEM_PROMPT = `You are a wisdom extractor for ThoughtFolio, an app that helps users capture and apply insights in specific contexts.

Given text content, identify 3-7 key insights that would be valuable to remember and apply in daily life.

For each insight:
1. Extract a concise, memorable phrase (under 200 characters)
2. Focus on actionable wisdom, not facts or summaries
3. Prefer direct quotes when they're powerful, otherwise paraphrase
4. Suggest the most appropriate context where this insight would be useful

Available contexts (pick the best fit for when to apply this insight):
- meetings: Insights for professional meetings, 1:1s, standups, team discussions
- feedback: Giving or receiving feedback, performance conversations, reviews
- conflict: Handling disagreements, difficult conversations, negotiations
- focus: Productivity, deep work, concentration, time management
- health: Physical/mental wellness, self-care, exercise, mindfulness
- relationships: Personal relationships, communication, social interactions
- parenting: Child-rearing, family dynamics, teaching kids
- other: General wisdom that doesn't fit above categories

Return valid JSON only, no markdown code blocks:
{
  "thoughts": [
    {
      "content": "The extracted insight text",
      "context_tag": "feedback",
      "source_quote": "Original text this came from (if applicable)"
    }
  ]
}`

const MULTIMEDIA_EXTRACTION_PROMPT = `You are a wisdom extractor for ThoughtFolio, an app that helps users capture and apply insights in specific contexts.

Analyze the provided content (which may include images, audio transcripts, or video content) and identify 3-7 key insights that would be valuable to remember and apply in daily life.

For each insight:
1. Extract a concise, memorable phrase (under 200 characters)
2. Focus on actionable wisdom, not facts or summaries
3. Describe visual or audio insights when relevant
4. Suggest the most appropriate context where this insight would be useful

Available contexts (pick the best fit for when to apply this insight):
- meetings: Insights for professional meetings, 1:1s, standups, team discussions
- feedback: Giving or receiving feedback, performance conversations, reviews
- conflict: Handling disagreements, difficult conversations, negotiations
- focus: Productivity, deep work, concentration, time management
- health: Physical/mental wellness, self-care, exercise, mindfulness
- relationships: Personal relationships, communication, social interactions
- parenting: Child-rearing, family dynamics, teaching kids
- other: General wisdom that doesn't fit above categories

Return valid JSON only, no markdown code blocks:
{
  "thoughts": [
    {
      "content": "The extracted insight text",
      "context_tag": "feedback",
      "source_quote": "Description of where this insight came from"
    }
  ]
}`

export async function extractThoughtsFromContent(
  content: string,
  source?: string
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  })

  const userPrompt = source
    ? `Source: ${source}\n\nContent:\n${content}`
    : content

  const result = await model.generateContent([
    { text: EXTRACTION_SYSTEM_PROMPT },
    { text: userPrompt },
  ])

  const response = result.response
  const text = response.text()
  const parsed = JSON.parse(text)

  const usage = response.usageMetadata
  const tokensUsed = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0)

  // Validate and sanitize the extracted thoughts
  const validatedThoughts: ExtractedThought[] = (parsed.thoughts || []).map((thought: Record<string, unknown>) => ({
    content: String(thought.content || "").slice(0, 200),
    context_tag: isValidContextTag(thought.context_tag) ? thought.context_tag : "other",
    source_quote: thought.source_quote ? String(thought.source_quote) : undefined,
  }))

  return {
    thoughts: validatedThoughts,
    tokens_used: tokensUsed,
  }
}

export async function extractThoughtsFromMultimedia(
  textContent: string,
  mediaData: Array<{ mimeType: string; data: string }>,
  source?: string
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  })

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: MULTIMEDIA_EXTRACTION_PROMPT },
  ]

  // Add media files
  for (const media of mediaData) {
    parts.push({
      inlineData: {
        mimeType: media.mimeType,
        data: media.data,
      },
    })
  }

  // Add text content
  const userPrompt = source
    ? `Source: ${source}\n\nAdditional context:\n${textContent}`
    : textContent || "Please analyze the provided media and extract insights."

  parts.push({ text: userPrompt })

  const result = await model.generateContent(parts)

  const response = result.response
  const text = response.text()
  const parsed = JSON.parse(text)

  const usage = response.usageMetadata
  const tokensUsed = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0)

  // Validate and sanitize the extracted thoughts
  const validatedThoughts: ExtractedThought[] = (parsed.thoughts || []).map((thought: Record<string, unknown>) => ({
    content: String(thought.content || "").slice(0, 200),
    context_tag: isValidContextTag(thought.context_tag) ? thought.context_tag : "other",
    source_quote: thought.source_quote ? String(thought.source_quote) : undefined,
  }))

  return {
    thoughts: validatedThoughts,
    tokens_used: tokensUsed,
  }
}

function isValidContextTag(tag: unknown): tag is ContextTag {
  const validTags: ContextTag[] = [
    "meetings",
    "feedback",
    "conflict",
    "focus",
    "health",
    "relationships",
    "parenting",
    "other",
  ]
  return typeof tag === "string" && validTags.includes(tag as ContextTag)
}

// Discovery Generation

export interface DiscoveryGenerationResult {
  discoveries: GeneratedDiscovery[]
  tokens_used: number
}

// Prompt for web search grounding mode
const DISCOVERY_WEB_SEARCH_PROMPT = `You are a knowledge curator helping users discover new insights from the web.

Search the web and find 8 high-quality articles, blog posts, or resources that contain actionable wisdom.

For each piece of content you find:
1. Extract ONE key insight (max 200 characters) - a concise, memorable phrase
2. Provide the source title and URL from your search results
3. Write a 2-3 sentence summary of the content
4. Explain why this is relevant to the user's interests
5. Classify as "trending" (recent/current) or "evergreen" (timeless)
6. Suggest which context it fits best

Return valid JSON only:
{
  "discoveries": [
    {
      "thought_content": "The key insight (max 200 chars)",
      "source_title": "Article title",
      "source_url": "https://example.com/article",
      "source_type": "article|video|research|blog",
      "article_summary": "2-3 sentence summary",
      "relevance_reason": "Why relevant to user",
      "content_type": "trending|evergreen",
      "suggested_context_slug": "context-slug"
    }
  ]
}`

// Fallback prompt when web search is not available
const DISCOVERY_FALLBACK_PROMPT = `You are a knowledge curator for ThoughtFolio, helping users discover valuable insights and wisdom.

Your task is to recommend 8 pieces of wisdom, insights, or knowledge that would be valuable based on the user's interests.

For each recommendation:
1. Create ONE key insight (max 200 characters) - a concise, memorable, actionable phrase
2. Attribute it to a real source (book, thought leader, research, article)
3. Write a 2-3 sentence explanation of why this insight is valuable
4. Explain how it relates to the user's interests
5. Classify as "trending" (contemporary/modern) or "evergreen" (timeless wisdom)
6. Suggest which context it fits best (from the available contexts)

Focus on:
- Actionable wisdom that can be applied in daily life
- Insights from reputable sources (books, research, experts)
- Practical advice relevant to the user's contexts
- A mix of classic wisdom and modern insights

Return valid JSON only, no markdown code blocks:
{
  "discoveries": [
    {
      "thought_content": "The key insight (max 200 chars)",
      "source_title": "Book title, article, or source name",
      "source_url": "https://example.com/source",
      "source_type": "article|video|research|blog",
      "article_summary": "2-3 sentence explanation of the insight",
      "relevance_reason": "Why this is relevant to the user",
      "content_type": "trending|evergreen",
      "suggested_context_slug": "the-context-slug"
    }
  ]
}`

/**
 * Generate discoveries using Gemini with Google Search grounding (with fallback)
 */
export async function generateDiscoveries(
  mode: "curated" | "directed",
  contexts: Context[],
  existingThoughts: Array<{ content: string; context_name?: string }>,
  query?: string,
  specificContextId?: string
): Promise<DiscoveryGenerationResult> {
  // Use gemini-1.5-flash for Google Search grounding (2.0-flash doesn't support it)
  const useGrounding = true
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 2048,
    },
    // Google Search grounding tool (googleSearchRetrieval is the correct SDK property)
    tools: [
      {
        googleSearchRetrieval: {},
      },
    ],
  })

  // Build context information
  const contextList = contexts.map((c) => `- ${c.name} (slug: ${c.slug})`).join("\n")

  // Build sample thoughts for personalization
  let thoughtSamples = ""
  if (existingThoughts.length > 0) {
    const samples = existingThoughts.slice(0, 10).map((t) => {
      return t.context_name ? `[${t.context_name}] ${t.content}` : t.content
    })
    thoughtSamples = `User's existing thoughts (for context):\n${samples.join("\n")}`
  }

  // Build mode-specific instructions
  let modeInstructions = ""
  if (mode === "directed" && query) {
    modeInstructions = `The user is searching for: "${query}"

Find 8 articles/content pieces related to this specific topic. Focus on:
- Practical, actionable content
- Reputable sources
- Recent or timeless wisdom depending on the topic`
  } else if (specificContextId) {
    const specificContext = contexts.find((c) => c.id === specificContextId)
    if (specificContext) {
      modeInstructions = `The user wants discoveries for their "${specificContext.name}" context.

Find 8 articles/content pieces that would be valuable for someone interested in ${specificContext.name.toLowerCase()}-related topics. Focus on:
- Insights applicable to ${specificContext.name.toLowerCase()} situations
- Mix of trending and evergreen content
- Practical wisdom they can apply`
    }
  } else {
    // Curated mode - mix across contexts
    modeInstructions = `Find 8 diverse articles/content pieces across the user's interest areas.

Distribute discoveries across these contexts based on the user's interests:
${contextList}

Aim for variety - different contexts, mix of trending and evergreen content.`
  }

  const userPrompt = `${modeInstructions}

Available contexts to suggest:
${contextList}

${thoughtSamples}

Find 8 high-quality discoveries and return them as JSON.`

  // Helper function to call the model and parse response
  async function callModel(
    modelInstance: ReturnType<typeof genAI.getGenerativeModel>,
    systemPrompt: string
  ): Promise<DiscoveryGenerationResult> {
    const result = await modelInstance.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ])

    const response = result.response
    const text = response.text()

    // Try to parse the JSON response
    let parsed: { discoveries?: unknown[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Could not parse discovery response")
      }
    }

    const usage = response.usageMetadata
    const tokensUsed = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0)

    // Validate and sanitize discoveries
    const validatedDiscoveries: GeneratedDiscovery[] = (parsed.discoveries || [])
      .slice(0, 8)
      .map((d: unknown) => {
        const discovery = d as Record<string, unknown>
        return {
          thought_content: String(discovery.thought_content || "").slice(0, 200),
          source_title: String(discovery.source_title || "Unknown Source"),
          source_url: String(discovery.source_url || ""),
          source_type: isValidSourceType(discovery.source_type) ? discovery.source_type : "article",
          article_summary: String(discovery.article_summary || ""),
          relevance_reason: String(discovery.relevance_reason || ""),
          content_type: isValidContentType(discovery.content_type) ? discovery.content_type : "evergreen",
          suggested_context_slug: isValidContextSlug(discovery.suggested_context_slug, contexts)
            ? discovery.suggested_context_slug as string
            : "other",
        }
      })
      .filter((d) => d.thought_content && d.source_url)

    return {
      discoveries: validatedDiscoveries,
      tokens_used: tokensUsed,
    }
  }

  // Try with Google Search grounding first
  if (useGrounding) {
    try {
      console.log("Attempting discovery with Google Search grounding...")
      return await callModel(model, DISCOVERY_WEB_SEARCH_PROMPT)
    } catch (groundingError) {
      console.warn("Google Search grounding failed, falling back to standard model:", groundingError)
      // Fall through to fallback
    }
  }

  // Fallback: use standard model without grounding
  try {
    console.log("Using fallback model without grounding...")
    const fallbackModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    })
    return await callModel(fallbackModel, DISCOVERY_FALLBACK_PROMPT)
  } catch (error) {
    console.error("Error generating discoveries:", error)
    throw error
  }
}

function isValidSourceType(type: unknown): type is DiscoverySourceType {
  const validTypes: DiscoverySourceType[] = ["article", "video", "research", "blog"]
  return typeof type === "string" && validTypes.includes(type as DiscoverySourceType)
}

function isValidContentType(type: unknown): type is DiscoveryContentType {
  const validTypes: DiscoveryContentType[] = ["trending", "evergreen"]
  return typeof type === "string" && validTypes.includes(type as DiscoveryContentType)
}

function isValidContextSlug(slug: unknown, contexts: Context[]): boolean {
  if (typeof slug !== "string") return false
  return contexts.some((c) => c.slug === slug)
}
