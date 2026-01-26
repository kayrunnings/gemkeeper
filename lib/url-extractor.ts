import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"

export type UrlType = "article" | "youtube" | "unknown"

export interface ExtractedContent {
  title: string
  content: string
  byline?: string
  siteName?: string
  excerpt?: string
  url: string
  type: UrlType
}

/**
 * Detect the type of URL (article, YouTube, or unknown)
 */
export function detectUrlType(url: string): UrlType {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    // YouTube URLs
    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "youtu.be" ||
      hostname === "m.youtube.com"
    ) {
      return "youtube"
    }

    // Common article sites / blogs
    // Substack, Medium, dev.to, etc. are all articles
    return "article"
  } catch {
    return "unknown"
  }
}

/**
 * Extract the YouTube video ID from a URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    if (hostname === "youtu.be") {
      return parsed.pathname.slice(1)
    }

    if (hostname.includes("youtube.com")) {
      // Standard watch URL
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v")
      }
      // Embed URL
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2]
      }
      // Shorts URL
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2]
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Extract article content using Readability
 */
export async function extractArticleContent(
  url: string,
  timeoutMs: number = 10000
): Promise<{
  content: ExtractedContent | null
  error: string | null
}> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Fetch the page
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GemkeeperBot/1.0; +https://gemkeeper.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 404) {
        return { content: null, error: "Page not found (404)" }
      }
      if (response.status === 403) {
        return { content: null, error: "Access denied (403) - page may be behind a paywall" }
      }
      if (response.status === 429) {
        return { content: null, error: "Too many requests - please try again later" }
      }
      return { content: null, error: `HTTP error: ${response.status}` }
    }

    const html = await response.text()

    // Check for common paywall indicators
    if (isPaywalled(html)) {
      return { content: null, error: "Content appears to be behind a paywall" }
    }

    // Parse with JSDOM
    const dom = new JSDOM(html, { url })
    const document = dom.window.document

    // Extract with Readability
    const reader = new Readability(document)
    const article = reader.parse()

    if (!article || !article.textContent || article.textContent.trim().length < 100) {
      return { content: null, error: "Could not extract meaningful content from this page" }
    }

    return {
      content: {
        title: article.title || extractTitleFromUrl(url),
        content: article.textContent.trim(),
        byline: article.byline || undefined,
        siteName: article.siteName || extractDomainFromUrl(url),
        excerpt: article.excerpt || undefined,
        url,
        type: "article",
      },
      error: null,
    }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { content: null, error: "Request timed out after 10 seconds" }
      }
      return { content: null, error: err.message }
    }
    return { content: null, error: "Unknown error occurred while extracting content" }
  }
}

/**
 * Check if HTML contains common paywall indicators
 */
function isPaywalled(html: string): boolean {
  const paywallIndicators = [
    "paywall",
    "subscribe to read",
    "subscribe to continue",
    "already a subscriber",
    "sign in to continue reading",
    "become a member",
    "get unlimited access",
    "start your free trial",
    "premium content",
    'class="paywall"',
    'id="paywall"',
    "data-paywall",
  ]

  const lowerHtml = html.toLowerCase()
  return paywallIndicators.some((indicator) => lowerHtml.includes(indicator))
}

/**
 * Extract a reasonable title from URL if no title found
 */
function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    const segments = path.split("/").filter(Boolean)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      // Remove file extension and convert hyphens/underscores to spaces
      return lastSegment
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return parsed.hostname
  } catch {
    return "Untitled"
  }
}

/**
 * Extract domain from URL for site name
 */
function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

/**
 * Main extraction function that handles both articles and YouTube
 * (YouTube extraction is handled separately in Task 10.0)
 */
export async function extractFromUrl(
  url: string,
  timeoutMs: number = 10000
): Promise<{
  content: ExtractedContent | null
  error: string | null
}> {
  // Validate URL
  try {
    new URL(url)
  } catch {
    return { content: null, error: "Invalid URL format" }
  }

  const urlType = detectUrlType(url)

  if (urlType === "youtube") {
    // YouTube will be handled by a separate function (Task 10.0)
    return { content: null, error: "YouTube extraction requires transcript API - not yet implemented" }
  }

  if (urlType === "article") {
    return extractArticleContent(url, timeoutMs)
  }

  return { content: null, error: "Unknown URL type - cannot extract content" }
}
