import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import { YoutubeTranscript } from "youtube-transcript"

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
        return { content: null, error: "Access denied - this site blocks automated requests" }
      }
      if (response.status === 429) {
        return { content: null, error: "Too many requests - please try again later" }
      }
      if (response.status >= 500) {
        return { content: null, error: "Website is temporarily unavailable" }
      }
      return { content: null, error: `Could not access page (HTTP ${response.status})` }
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
        return { content: null, error: "Request timed out - the website may be slow or blocking requests" }
      }
      // Check for common network errors
      if (err.message.includes("fetch failed") || err.message.includes("ECONNREFUSED")) {
        return { content: null, error: "Could not connect to website - it may be blocking automated requests" }
      }
      return { content: null, error: `Extraction failed: ${err.message}` }
    }
    return { content: null, error: "Could not extract content from this website" }
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
 * Extract YouTube video transcript
 */
export async function extractYouTubeTranscript(
  url: string
): Promise<{
  content: ExtractedContent | null
  error: string | null
}> {
  const videoId = extractYouTubeVideoId(url)

  if (!videoId) {
    return { content: null, error: "Could not extract video ID from YouTube URL" }
  }

  try {
    // Fetch transcript
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcriptItems || transcriptItems.length === 0) {
      return {
        content: null,
        error: "No transcript available for this video. The video may not have captions enabled.",
      }
    }

    // Combine transcript into a single text
    const transcriptText = transcriptItems.map((item) => item.text).join(" ")

    if (transcriptText.trim().length < 100) {
      return { content: null, error: "Transcript is too short to extract meaningful content" }
    }

    // Try to get video title from oEmbed API
    let title = "YouTube Video"
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      const oEmbedResponse = await fetch(oEmbedUrl)
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json()
        title = oEmbedData.title || title
      }
    } catch {
      // Ignore oEmbed errors, use default title
    }

    return {
      content: {
        title,
        content: transcriptText.trim(),
        siteName: "YouTube",
        url,
        type: "youtube",
      },
      error: null,
    }
  } catch (err) {
    if (err instanceof Error) {
      // Common YouTube transcript errors
      if (err.message.includes("Could not find any transcript")) {
        return {
          content: null,
          error: "No transcript available for this video. The video may not have captions enabled.",
        }
      }
      if (err.message.includes("Video is unavailable")) {
        return { content: null, error: "This YouTube video is unavailable or private" }
      }
      return { content: null, error: `YouTube extraction error: ${err.message}` }
    }
    return { content: null, error: "Failed to extract YouTube transcript" }
  }
}

/**
 * Main extraction function that handles both articles and YouTube
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
    return extractYouTubeTranscript(url)
  }

  if (urlType === "article") {
    return extractArticleContent(url, timeoutMs)
  }

  return { content: null, error: "Unknown URL type - cannot extract content" }
}
