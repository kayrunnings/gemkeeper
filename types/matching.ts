// Types for AI-powered gem matching

export interface GemMatch {
  gem_id: string
  relevance_score: number  // 0.0 to 1.0
  relevance_reason: string
}

export interface GemForMatching {
  id: string
  content: string
  context_tag: string
  source: string | null
}

export interface MatchingRequest {
  moment_description: string
  gems: GemForMatching[]
}

export interface MatchingResponse {
  matches: GemMatch[]
  processing_time_ms: number
}

// Matching constraints
export const MAX_GEMS_TO_MATCH = 5
export const MIN_RELEVANCE_SCORE = 0.5
export const MATCHING_TIMEOUT_MS = 5000
