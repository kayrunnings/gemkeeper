/**
 * Content detection utilities for AI Quick Capture
 */

import type { ContentType } from "@/lib/types/capture"

// URL regex pattern
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
const URL_EXTRACT_REGEX = /(https?:\/\/[^\s]+)/gi

// Quote detection patterns
const QUOTE_PATTERNS = [
  /^[""].*[""]$/,           // Quoted text
  /^[''].*['']$/,           // Single quoted
  /^\u201C.*\u201D$/,       // Smart quotes
  /^>.*$/,                  // Block quote style
  /—\s*[A-Z][a-z]+.*$/,     // Em-dash attribution
  /-\s*[A-Z][a-z]+.*$/,     // Dash attribution
]

const ATTRIBUTION_PATTERNS = [
  /—\s*(.+)$/,              // Em-dash attribution
  /-\s*([A-Z][a-z]+.*)$/,   // Dash attribution
  /\(([^)]+)\)$/,           // Parenthetical attribution
  /~\s*(.+)$/,              // Tilde attribution
]

/**
 * Detect the type of content being captured
 */
export function detectContentType(content: string): ContentType {
  const trimmed = content.trim()

  // Check if it's a URL
  if (isUrl(trimmed)) {
    return 'url'
  }

  // Check if it contains multiple URLs (mixed content with links)
  const urls = trimmed.match(URL_EXTRACT_REGEX)
  if (urls && urls.length > 1) {
    return 'mixed'
  }

  // Check if it's a bullet list
  if (isBulletList(trimmed)) {
    return 'list'
  }

  // Length-based classification
  if (trimmed.length <= 200) {
    return 'short_text'
  }

  // Check if it's mixed content (quote + reflection)
  if (hasQuoteAndReflection(trimmed)) {
    return 'mixed'
  }

  return 'long_text'
}

/**
 * Check if text is a valid URL
 */
export function isUrl(text: string): boolean {
  const trimmed = text.trim()

  // Quick check for common URL prefixes
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed)
      return true
    } catch {
      return false
    }
  }

  // Check for URL pattern without protocol
  if (URL_REGEX.test(trimmed)) {
    try {
      new URL(`https://${trimmed}`)
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * Check if text appears to be a quote
 */
export function isQuoteLike(text: string): boolean {
  const trimmed = text.trim()

  // Check against quote patterns
  for (const pattern of QUOTE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true
    }
  }

  // Check for attribution patterns at the end
  for (const pattern of ATTRIBUTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true
    }
  }

  // Check for quotation marks anywhere
  const quoteChars = ['"', '"', '"', "'", "'", "'", '「', '」', '«', '»']
  const hasOpeningQuote = quoteChars.some(q => trimmed.startsWith(q))
  const hasClosingQuote = quoteChars.some(q => trimmed.endsWith(q))

  if (hasOpeningQuote && hasClosingQuote) {
    return true
  }

  return false
}

/**
 * Check if text is a bullet list
 */
export function isBulletList(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    return false
  }

  // Count lines that start with bullet indicators
  const bulletPatterns = [
    /^\s*[-*•·]\s+/,        // Dash, asterisk, bullets
    /^\s*\d+[.)]\s+/,       // Numbered list
    /^\s*[a-z][.)]\s+/i,    // Lettered list
    /^\s*\[\s*[x ]?\s*\]/i, // Checkbox style
  ]

  let bulletCount = 0
  for (const line of lines) {
    for (const pattern of bulletPatterns) {
      if (pattern.test(line)) {
        bulletCount++
        break
      }
    }
  }

  // Consider it a list if most lines are bullets
  return bulletCount >= lines.length * 0.5
}

/**
 * Check if content has both a quote and reflection/commentary
 */
function hasQuoteAndReflection(text: string): boolean {
  // Look for paragraph breaks
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())

  if (paragraphs.length < 2) {
    return false
  }

  // Check if any paragraph looks like a quote
  const hasQuote = paragraphs.some(p => isQuoteLike(p.trim()))

  // Check if there's other substantial content (reflection)
  const nonQuoteParagraphs = paragraphs.filter(p => !isQuoteLike(p.trim()))
  const hasReflection = nonQuoteParagraphs.some(p => p.trim().length > 50)

  return hasQuote && hasReflection
}

/**
 * Extract all URLs from text
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_EXTRACT_REGEX)
  return matches || []
}

/**
 * Extract bullet points from text
 */
export function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim())

  const bulletPatterns = [
    /^\s*[-*•·]\s+(.+)$/,        // Dash, asterisk, bullets
    /^\s*\d+[.)]\s+(.+)$/,       // Numbered list
    /^\s*[a-z][.)]\s+(.+)$/i,    // Lettered list
    /^\s*\[\s*[x ]?\s*\]\s*(.+)$/i, // Checkbox style
  ]

  const bullets: string[] = []

  for (const line of lines) {
    for (const pattern of bulletPatterns) {
      const match = line.match(pattern)
      if (match && match[1]) {
        bullets.push(match[1].trim())
        break
      }
    }
  }

  return bullets
}
