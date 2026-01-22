import { GoogleGenerativeAI } from "@google/generative-ai"
import { ContextTag } from "@/lib/types/gem"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export interface ExtractedGem {
  content: string
  context_tag: ContextTag
  source_quote?: string
}

export interface ExtractionResult {
  gems: ExtractedGem[]
  tokens_used: number
}

const EXTRACTION_SYSTEM_PROMPT = `You are a wisdom extractor for GemKeeper, an app that helps users capture and apply insights.

Given text content, identify 3-7 key insights that would be valuable to remember and apply in daily life.

For each insight:
1. Extract a concise, memorable phrase (under 200 characters)
2. Focus on actionable wisdom, not facts or summaries
3. Prefer direct quotes when they're powerful, otherwise paraphrase
4. Suggest the most appropriate context tag

Context tags (pick the best fit):
- meetings: Insights for professional meetings, 1:1s, standups
- feedback: Giving or receiving feedback, performance conversations
- conflict: Handling disagreements, difficult conversations
- focus: Productivity, deep work, concentration
- health: Physical/mental wellness, self-care
- relationships: Personal relationships, communication
- parenting: Child-rearing, family dynamics
- other: Doesn't fit above categories

Return valid JSON only, no markdown code blocks:
{
  "gems": [
    {
      "content": "The extracted insight text",
      "context_tag": "feedback",
      "source_quote": "Original text this came from (if applicable)"
    }
  ]
}`

const MULTIMEDIA_EXTRACTION_PROMPT = `You are a wisdom extractor for GemKeeper, an app that helps users capture and apply insights.

Analyze the provided content (which may include images, audio transcripts, or video content) and identify 3-7 key insights that would be valuable to remember and apply in daily life.

For each insight:
1. Extract a concise, memorable phrase (under 200 characters)
2. Focus on actionable wisdom, not facts or summaries
3. Describe visual or audio insights when relevant
4. Suggest the most appropriate context tag

Context tags (pick the best fit):
- meetings: Insights for professional meetings, 1:1s, standups
- feedback: Giving or receiving feedback, performance conversations
- conflict: Handling disagreements, difficult conversations
- focus: Productivity, deep work, concentration
- health: Physical/mental wellness, self-care
- relationships: Personal relationships, communication
- parenting: Child-rearing, family dynamics
- other: Doesn't fit above categories

Return valid JSON only, no markdown code blocks:
{
  "gems": [
    {
      "content": "The extracted insight text",
      "context_tag": "feedback",
      "source_quote": "Description of where this insight came from"
    }
  ]
}`

export async function extractGemsFromContent(
  content: string,
  source?: string
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
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

  // Validate and sanitize the extracted gems
  const validatedGems: ExtractedGem[] = (parsed.gems || []).map((gem: Record<string, unknown>) => ({
    content: String(gem.content || "").slice(0, 200),
    context_tag: isValidContextTag(gem.context_tag) ? gem.context_tag : "other",
    source_quote: gem.source_quote ? String(gem.source_quote) : undefined,
  }))

  return {
    gems: validatedGems,
    tokens_used: tokensUsed,
  }
}

export async function extractGemsFromMultimedia(
  textContent: string,
  mediaData: Array<{ mimeType: string; data: string }>,
  source?: string
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
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

  // Validate and sanitize the extracted gems
  const validatedGems: ExtractedGem[] = (parsed.gems || []).map((gem: Record<string, unknown>) => ({
    content: String(gem.content || "").slice(0, 200),
    context_tag: isValidContextTag(gem.context_tag) ? gem.context_tag : "other",
    source_quote: gem.source_quote ? String(gem.source_quote) : undefined,
  }))

  return {
    gems: validatedGems,
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
