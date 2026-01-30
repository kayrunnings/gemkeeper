import { GoogleGenerativeAI } from "@google/generative-ai"
import { ContextTag } from "@/lib/types/thought"
import type { GeneratedDiscovery, DiscoverySourceType, DiscoveryContentType } from "@/lib/types/discovery"
import type { Context } from "@/lib/types/context"
import {
  THOUGHT_EXTRACTION_PROMPT,
  MULTIMEDIA_EXTRACTION_PROMPT,
  DISCOVERY_WEB_SEARCH_PROMPT,
  DISCOVERY_FALLBACK_PROMPT,
  DEFAULT_CONTEXTS,
  formatContextsForPrompt,
} from "./prompts"

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

// Build extraction prompt with user's contexts
function buildExtractionPrompt(contexts?: Context[]): string {
  const contextsList = contexts && contexts.length > 0
    ? formatContextsForPrompt(contexts)
    : DEFAULT_CONTEXTS
  return THOUGHT_EXTRACTION_PROMPT.replace('{contexts_list}', contextsList)
}

// Build multimedia extraction prompt with user's contexts
function buildMultimediaPrompt(contexts?: Context[]): string {
  const contextsList = contexts && contexts.length > 0
    ? formatContextsForPrompt(contexts)
    : DEFAULT_CONTEXTS
  return MULTIMEDIA_EXTRACTION_PROMPT.replace('{contexts_list}', contextsList)
}

export async function extractThoughtsFromContent(
  content: string,
  source?: string,
  contexts?: Context[]
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
    { text: buildExtractionPrompt(contexts) },
    { text: userPrompt },
  ])

  const response = result.response
  const text = response.text()
  const parsed = JSON.parse(text)

  const usage = response.usageMetadata
  const tokensUsed = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0)

  // Validate and sanitize the extracted thoughts (300 char limit)
  const validatedThoughts: ExtractedThought[] = (parsed.thoughts || []).map((thought: Record<string, unknown>) => ({
    content: String(thought.content || "").slice(0, 300),
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
  source?: string,
  contexts?: Context[]
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  })

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: buildMultimediaPrompt(contexts) },
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

  // Validate and sanitize the extracted thoughts (300 char limit)
  const validatedThoughts: ExtractedThought[] = (parsed.thoughts || []).map((thought: Record<string, unknown>) => ({
    content: String(thought.content || "").slice(0, 300),
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

    // Validate and sanitize discoveries (300 char limit)
    const validatedDiscoveries: GeneratedDiscovery[] = (parsed.discoveries || [])
      .slice(0, 8)
      .map((d: unknown) => {
        const discovery = d as Record<string, unknown>
        return {
          thought_content: String(discovery.thought_content || "").slice(0, 300),
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
