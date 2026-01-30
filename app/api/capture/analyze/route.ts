import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { detectContentType, isUrl, extractBulletPoints, isQuoteLike } from "@/lib/ai/content-detector"
// NOTE: Do NOT import from url-extractor here - it loads JSDOM which crashes Vercel serverless
import { extractSourceAttribution } from "@/lib/ai/content-splitter"
import type { CaptureItem, ContentType, CaptureAnalyzeResponse } from "@/lib/types/capture"
import { randomUUID } from "crypto"
import { CAPTURE_ANALYSIS_PROMPT, IMAGE_ANALYSIS_PROMPT, DEFAULT_CONTEXTS } from "@/lib/ai/prompts"

// Inline URL utility functions to avoid loading JSDOM
function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    const segments = path.split("/").filter(Boolean)

    if (segments.length === 0) {
      return parsed.hostname
    }

    let bestSegment = segments[segments.length - 1]
    let bestScore = 0

    for (const segment of segments) {
      const cleaned = segment.replace(/\.[^.]+$/, "")
      if (cleaned.length < 10 && /^[a-z]{1,3}[-_]?[A-Za-z0-9]+$/i.test(cleaned)) {
        continue
      }
      const hyphenCount = (cleaned.match(/-/g) || []).length
      const score = cleaned.length + (hyphenCount * 5)
      if (score > bestScore) {
        bestScore = score
        bestSegment = cleaned
      }
    }

    return bestSegment
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return "Untitled"
  }
}

function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Build capture analysis prompt with default contexts
function buildCapturePrompt(): string {
  return CAPTURE_ANALYSIS_PROMPT.replace('{contexts_list}', DEFAULT_CONTEXTS)
}

interface ImageInput {
  mimeType: string
  data: string
}

// Validation constants
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    return await handleAnalyzeRequest(request)
  } catch (outerError) {
    console.error("CRITICAL: Unhandled error in capture/analyze:", outerError)
    return NextResponse.json(
      { error: outerError instanceof Error ? outerError.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleAnalyzeRequest(request: NextRequest) {
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

    // If we have images, validate and use multimodal analysis
    if (hasImages) {
      // Validate each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        // Validate MIME type
        if (!SUPPORTED_IMAGE_TYPES.includes(image.mimeType)) {
          return NextResponse.json(
            { error: `Image ${i + 1}: Unsupported format "${image.mimeType}". Please use JPEG, PNG, GIF, or WebP.` },
            { status: 400 }
          )
        }

        // Validate size (base64 is ~33% larger than binary)
        const estimatedSize = (image.data.length * 3) / 4
        if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
          const sizeMB = (estimatedSize / 1024 / 1024).toFixed(1)
          return NextResponse.json(
            { error: `Image ${i + 1}: Too large (${sizeMB}MB). Maximum size is 4MB.` },
            { status: 400 }
          )
        }
      }

      return handleImageAnalysis(content?.trim() || '', images)
    }

    const trimmedContent = content!.trim()
    const contentType = detectContentType(trimmedContent)

    // Handle URL content - simplified version without JSDOM (which doesn't work on Vercel serverless)
    if (contentType === 'url' && isUrl(trimmedContent)) {
      // For URLs, create a simple source entry using URL metadata only
      // NOTE: Full content extraction is disabled because JSDOM doesn't work in Vercel serverless
      const extractedTitle = extractTitleFromUrl(trimmedContent)
      const siteName = extractDomainFromUrl(trimmedContent)

      const suggestion: CaptureItem = {
        id: randomUUID(),
        type: 'source',
        content: extractedTitle !== 'Untitled' ? extractedTitle : trimmedContent,
        source: siteName,
        sourceUrl: trimmedContent,
        selected: true,
      }

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
      { text: buildCapturePrompt() },
      { text: `Content to analyze:\n\n${trimmedContent}` },
    ])

    const response = result.response
    const text = response.text()

    // Handle empty AI response
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(text)

    const suggestions: CaptureItem[] = (parsed.items || []).map((item: {
      type?: string
      content?: string
      source?: string
      sourceUrl?: string
    }) => ({
      id: randomUUID(),
      type: item.type === 'note' ? 'note' : item.type === 'source' ? 'source' : 'thought',
      content: String(item.content || '').slice(0, item.type === 'note' ? 5000 : 300),
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
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze content"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Export config to set a reasonable timeout
export const maxDuration = 30 // 30 seconds max

async function handleImageAnalysis(textContent: string, images: ImageInput[]) {
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

    // Handle empty AI response
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(text)

    const suggestions: CaptureItem[] = (parsed.items || []).map((item: {
      type?: string
      content?: string
      source?: string
      sourceUrl?: string
    }) => ({
      id: randomUUID(),
      type: item.type === 'note' ? 'note' : item.type === 'source' ? 'source' : 'thought',
      content: String(item.content || '').slice(0, item.type === 'note' ? 5000 : 300),
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

    // Provide more specific error message
    let errorMessage = "Failed to analyze images"
    if (error instanceof Error) {
      if (error.message.includes("SAFETY")) {
        errorMessage = "Image was blocked by safety filters. Please try a different image."
      } else if (error.message.includes("quota") || error.message.includes("rate")) {
        errorMessage = "API rate limit reached. Please try again in a moment."
      } else if (error.message.includes("Invalid") || error.message.includes("invalid")) {
        errorMessage = "Invalid image data. Please try pasting the image again."
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
