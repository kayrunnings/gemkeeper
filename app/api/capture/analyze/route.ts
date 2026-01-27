import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { detectContentType, isUrl, extractBulletPoints, isQuoteLike } from "@/lib/ai/content-detector"
import { extractSourceAttribution } from "@/lib/ai/content-splitter"
import type { CaptureItem, ContentType, CaptureAnalyzeResponse } from "@/lib/types/capture"
import { randomUUID } from "crypto"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const CAPTURE_ANALYSIS_PROMPT = `You are a knowledge extraction assistant for ThoughtFolio, helping users capture insights from various content types.

Analyze the provided content and identify:
1. **Thoughts**: Key insights, quotes, or wisdom (max 200 characters each)
2. **Notes**: Longer reflections, meeting notes, or commentary
3. **Sources**: Books, articles, or media being referenced

For each item:
- Determine if it's a thought (short insight), note (longer content), or source (a referenced work)
- Extract the core content
- Identify any source attribution (author, book, article)
- Suggest the best context for applying this insight

Available contexts:
- meetings: Professional meetings, 1:1s, team discussions
- feedback: Giving/receiving feedback, reviews
- conflict: Difficult conversations, disagreements
- focus: Productivity, deep work, time management
- health: Physical/mental wellness, self-care
- relationships: Personal relationships, communication
- parenting: Family, teaching kids
- other: General wisdom

Guidelines:
- Quotes under 200 chars → thought
- Long reflections/notes → note
- Book/article references → source
- If content has both quotes and commentary, separate them
- For bullet lists, each bullet can be a separate thought

Return valid JSON only:
{
  "items": [
    {
      "type": "thought|note|source",
      "content": "The extracted content",
      "source": "Author or source name if mentioned",
      "sourceUrl": "URL if available"
    }
  ]
}`

interface ImageInput {
  mimeType: string
  data: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, images } = body as { content?: string; images?: ImageInput[] }

    const hasText = content && typeof content === "string" && content.trim().length > 0
    const hasImages = images && Array.isArray(images) && images.length > 0

    if (!hasText && !hasImages) {
      return NextResponse.json(
        { error: "Content or images are required" },
        { status: 400 }
      )
    }

    // If we have images, use multimodal analysis
    if (hasImages) {
      return handleImageAnalysis(content?.trim() || '', images)
    }

    const trimmedContent = content!.trim()
    const contentType = detectContentType(trimmedContent)

    // Handle URL content
    if (contentType === 'url' && isUrl(trimmedContent)) {
      // For URLs, return suggestion to use URL extractor
      const suggestion: CaptureItem = {
        id: randomUUID(),
        type: 'thought',
        content: `Content from: ${trimmedContent}`,
        sourceUrl: trimmedContent,
        selected: true,
      }

      // Try to extract URL content
      try {
        const urlResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/extract/url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedContent }),
        })

        if (urlResponse.ok) {
          const urlData = await urlResponse.json()

          const suggestions: CaptureItem[] = []

          // Add source
          if (urlData.source_title) {
            suggestions.push({
              id: randomUUID(),
              type: 'source',
              content: urlData.source_title,
              sourceUrl: trimmedContent,
              selected: true,
            })
          }

          // Add extracted thoughts
          if (urlData.thoughts && Array.isArray(urlData.thoughts)) {
            for (const thought of urlData.thoughts.slice(0, 5)) {
              suggestions.push({
                id: randomUUID(),
                type: 'thought',
                content: thought.content,
                source: urlData.source_title,
                sourceUrl: trimmedContent,
                selected: true,
              })
            }
          }

          if (suggestions.length > 0) {
            return NextResponse.json({
              success: true,
              contentType,
              suggestions,
            } satisfies CaptureAnalyzeResponse)
          }
        }
      } catch (err) {
        console.warn("URL extraction failed:", err)
      }

      // Fallback for URL
      return NextResponse.json({
        success: true,
        contentType,
        suggestions: [suggestion],
      } satisfies CaptureAnalyzeResponse)
    }

    // Handle bullet list
    if (contentType === 'list') {
      const bullets = extractBulletPoints(trimmedContent)
      const suggestions: CaptureItem[] = bullets.map((bullet) => ({
        id: randomUUID(),
        type: 'thought',
        content: bullet.slice(0, 200),
        selected: true,
      }))

      return NextResponse.json({
        success: true,
        contentType,
        suggestions,
      } satisfies CaptureAnalyzeResponse)
    }

    // Handle short text (likely a quote)
    if (contentType === 'short_text') {
      const attribution = extractSourceAttribution(trimmedContent)
      const suggestion: CaptureItem = {
        id: randomUUID(),
        type: 'thought',
        content: attribution.quote.slice(0, 200),
        source: attribution.author || attribution.source,
        selected: true,
      }

      return NextResponse.json({
        success: true,
        contentType,
        suggestions: [suggestion],
      } satisfies CaptureAnalyzeResponse)
    }

    // For long/mixed content, use AI analysis
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    })

    const result = await model.generateContent([
      { text: CAPTURE_ANALYSIS_PROMPT },
      { text: `Content to analyze:\n\n${trimmedContent}` },
    ])

    const response = result.response
    const text = response.text()
    const parsed = JSON.parse(text)

    const suggestions: CaptureItem[] = (parsed.items || []).map((item: {
      type?: string
      content?: string
      source?: string
      sourceUrl?: string
    }) => ({
      id: randomUUID(),
      type: item.type === 'note' ? 'note' : item.type === 'source' ? 'source' : 'thought',
      content: String(item.content || '').slice(0, item.type === 'note' ? 5000 : 200),
      source: item.source,
      sourceUrl: item.sourceUrl,
      selected: true,
    }))

    return NextResponse.json({
      success: true,
      contentType,
      suggestions,
    } satisfies CaptureAnalyzeResponse)

  } catch (error) {
    console.error("Capture analyze error:", error)
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    )
  }
}

async function handleImageAnalysis(textContent: string, images: ImageInput[]) {
  const IMAGE_ANALYSIS_PROMPT = `You are a knowledge extraction assistant. Analyze the provided image(s) and any accompanying text to extract valuable insights.

Identify:
1. **Thoughts**: Key insights, quotes, or wisdom from the image (max 200 characters each)
2. **Notes**: Longer observations, context, or commentary about the content
3. **Sources**: Any books, articles, or references visible/mentioned

For images of:
- Book pages/highlights: Extract the key quotes and insights
- Screenshots of articles: Extract main points
- Notes/handwriting: Transcribe and organize the content
- Diagrams/charts: Describe key takeaways
- Social media posts: Extract notable quotes or insights

Return valid JSON only:
{
  "items": [
    {
      "type": "thought|note|source",
      "content": "The extracted content",
      "source": "Author or source name if visible"
    }
  ]
}`

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    })

    // Build the content parts array
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: IMAGE_ANALYSIS_PROMPT },
    ]

    // Add images
    for (const image of images) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      })
    }

    // Add text content if present
    if (textContent) {
      parts.push({ text: `Additional context from user:\n${textContent}` })
    }

    const result = await model.generateContent(parts)
    const response = result.response
    const text = response.text()
    const parsed = JSON.parse(text)

    const suggestions: CaptureItem[] = (parsed.items || []).map((item: {
      type?: string
      content?: string
      source?: string
      sourceUrl?: string
    }) => ({
      id: randomUUID(),
      type: item.type === 'note' ? 'note' : item.type === 'source' ? 'source' : 'thought',
      content: String(item.content || '').slice(0, item.type === 'note' ? 5000 : 200),
      source: item.source,
      sourceUrl: item.sourceUrl,
      selected: true,
    }))

    return NextResponse.json({
      success: true,
      contentType: 'mixed' as ContentType,
      suggestions,
    } satisfies CaptureAnalyzeResponse)
  } catch (error) {
    console.error("Image analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze images" },
      { status: 500 }
    )
  }
}
