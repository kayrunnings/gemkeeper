/**
 * Content splitting utilities for AI Quick Capture
 * Uses Gemini AI to intelligently split content with rule-based fallback
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { SplitContentResult, SourceAttribution } from "@/lib/types/capture"
import { isQuoteLike } from "./content-detector"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const SPLIT_CONTENT_PROMPT = `You are helping split text content into quotes and personal reflections.

Analyze the given text and separate:
1. **Quotes**: Direct quotations, memorable phrases, or wisdom from external sources
2. **Reflections**: Personal thoughts, commentary, analysis, or notes

Guidelines:
- Quotes are typically in quotation marks, attributed to someone, or clearly from a book/article
- Reflections are the user's own thoughts, analysis, or notes
- If the whole text is a single quote with no commentary, return it as a quote
- If the whole text is personal notes/thoughts, return it as a reflection
- Preserve the original text as much as possible

Return valid JSON only:
{
  "quotes": ["quote 1", "quote 2"],
  "reflections": ["reflection 1", "reflection 2"]
}`

/**
 * Split mixed content into quotes and reflections using AI
 */
export async function splitMixedContent(content: string): Promise<SplitContentResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    })

    const result = await model.generateContent([
      { text: SPLIT_CONTENT_PROMPT },
      { text: `Content to analyze:\n\n${content}` },
    ])

    const response = result.response
    const text = response.text()
    const parsed = JSON.parse(text)

    return {
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes.map(String) : [],
      reflections: Array.isArray(parsed.reflections) ? parsed.reflections.map(String) : [],
    }
  } catch (error) {
    console.warn("AI split failed, falling back to rule-based:", error)
    return splitContentRuleBased(content)
  }
}

/**
 * Rule-based fallback for content splitting
 */
function splitContentRuleBased(content: string): SplitContentResult {
  const quotes: string[] = []
  const reflections: string[] = []

  // Split by paragraph breaks
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()

    if (isQuoteLike(trimmed)) {
      quotes.push(trimmed)
    } else {
      reflections.push(trimmed)
    }
  }

  // If no clear separation, treat short content as quote, long as reflection
  if (quotes.length === 0 && reflections.length === 0) {
    const trimmed = content.trim()
    if (trimmed.length <= 200) {
      quotes.push(trimmed)
    } else {
      reflections.push(trimmed)
    }
  }

  return { quotes, reflections }
}

/**
 * Extract source attribution from quoted text
 */
export function extractSourceAttribution(text: string): SourceAttribution {
  const trimmed = text.trim()

  // Attribution patterns to try (using [\s\S] instead of . with /s flag for broader compatibility)
  const attributionPatterns: Array<{ pattern: RegExp; groups: (match: RegExpMatchArray) => Partial<SourceAttribution> }> = [
    // "Quote" — Author Name, Book Title
    {
      pattern: /^[""']([\s\S]+?)[""']\s*[—–-]\s*([^,]+)(?:,\s*(.+))?$/,
      groups: (m) => ({ quote: m[1], author: m[2], source: m[3] }),
    },
    // "Quote" (Author Name)
    {
      pattern: /^[""']([\s\S]+?)[""']\s*\(([^)]+)\)$/,
      groups: (m) => ({ quote: m[1], author: m[2] }),
    },
    // "Quote" - Author Name
    {
      pattern: /^[""']([\s\S]+?)[""']\s*[—–-]\s*(.+)$/,
      groups: (m) => ({ quote: m[1], author: m[2] }),
    },
    // "Quote" ~ Author
    {
      pattern: /^[""']([\s\S]+?)[""']\s*~\s*(.+)$/,
      groups: (m) => ({ quote: m[1], author: m[2] }),
    },
    // Just quoted text
    {
      pattern: /^[""']([\s\S]+?)[""']$/,
      groups: (m) => ({ quote: m[1] }),
    },
    // Block quote style: > Quote — Author
    {
      pattern: /^>\s*([\s\S]+?)\s*[—–-]\s*(.+)$/,
      groups: (m) => ({ quote: m[1], author: m[2] }),
    },
    // Text ending with — Author, Source
    {
      pattern: /^([\s\S]+?)\s*[—–-]\s*([^,]+)(?:,\s*(.+))?$/,
      groups: (m) => ({ quote: m[1], author: m[2], source: m[3] }),
    },
  ]

  for (const { pattern, groups } of attributionPatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      const extracted = groups(match)
      return {
        quote: extracted.quote?.trim() || trimmed,
        author: extracted.author?.trim(),
        source: extracted.source?.trim(),
      }
    }
  }

  // No attribution found, return the whole text as the quote
  return { quote: trimmed }
}

/**
 * Detect if text looks like a book/source reference
 */
export function detectBookReference(text: string): { isBook: boolean; title?: string; author?: string } {
  const trimmed = text.trim()

  // Book title patterns
  const bookPatterns = [
    // "Book Title" by Author
    /^[""']?(.+?)[""']?\s+by\s+(.+)$/i,
    // Author - Book Title
    /^(.+?)\s*[—–-]\s*[""']?(.+?)[""']?$/,
    // Book Title (Author)
    /^[""']?(.+?)[""']?\s*\(([^)]+)\)$/,
  ]

  for (const pattern of bookPatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      // Check which group is author vs title based on capitalization/structure
      const [, group1, group2] = match

      // If first group is longer, it's probably the title
      if (group1.length > group2.length) {
        return { isBook: true, title: group1.trim(), author: group2.trim() }
      }
      return { isBook: true, author: group1.trim(), title: group2.trim() }
    }
  }

  // Check for ISBN patterns
  const isbnPattern = /ISBN[:\s-]*(\d{10}|\d{13})/i
  if (isbnPattern.test(trimmed)) {
    return { isBook: true }
  }

  return { isBook: false }
}
