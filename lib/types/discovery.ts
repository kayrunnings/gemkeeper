// Session types for discovery
export type DiscoverySessionType = "curated" | "directed"

// Source types for discovered content
export type DiscoverySourceType = "article" | "video" | "research" | "blog"

// Content classification
export type DiscoveryContentType = "trending" | "evergreen"

// Status of a discovery
export type DiscoveryStatus = "pending" | "saved" | "skipped"

// Discovery interface matching the database schema
export interface Discovery {
  id: string
  user_id: string
  session_type: DiscoverySessionType
  query: string | null
  context_id: string | null
  thought_content: string
  source_title: string
  source_url: string
  source_type: DiscoverySourceType
  article_summary: string
  relevance_reason: string
  content_type: DiscoveryContentType
  suggested_context_id: string | null
  // Computed field for UI (joined from contexts table)
  suggested_context_name?: string
  status: DiscoveryStatus
  saved_gem_id: string | null
  // Save for later feature - timestamp when saved to reading list
  saved_at: string | null
  created_at: string
  updated_at: string
}

// Usage tracking for daily limits
export interface DiscoveryUsage {
  curated_used: boolean
  directed_used: boolean
  curated_remaining: number
  directed_remaining: number
}

// Input for generating discoveries
export interface GenerateDiscoveriesInput {
  mode: DiscoverySessionType
  query?: string
  context_id?: string
}

// Input for saving a discovery as a thought
export interface SaveDiscoveryInput {
  discovery_id: string
  thought_content: string
  context_id: string
  is_on_active_list?: boolean
  save_article_as_note?: boolean
}

// Context weighting for curated discoveries
export interface ContextWeight {
  context_id: string
  context_name: string
  thought_count: number
  weight: number
}

// Result from Gemini discovery generation
export interface GeneratedDiscovery {
  thought_content: string
  source_title: string
  source_url: string
  source_type: DiscoverySourceType
  article_summary: string
  relevance_reason: string
  content_type: DiscoveryContentType
  suggested_context_slug: string
}

// Daily limits configuration
export const DAILY_CURATED_LIMIT = 1  // 1 session of 4 discoveries
export const DAILY_DIRECTED_LIMIT = 1 // 1 session of 4 discoveries
export const DISCOVERIES_PER_SESSION = 4

// Bootstrap thresholds
export const BOOTSTRAP_MIN_CONTEXTS = 2
export const BOOTSTRAP_MIN_THOUGHTS = 3
