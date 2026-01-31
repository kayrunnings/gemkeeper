/**
 * Learning Types for Moment Intelligence (Epic 14)
 *
 * Types for the learning system that remembers which thoughts
 * were helpful for similar moments.
 */

import type { EventType } from '@/lib/moments/title-analysis'

/**
 * Pattern types for learning associations
 * - event_type: Learns from event type (1:1, interview, etc.)
 * - keyword: Learns from keywords in description/context
 * - recurring: Learns from recurring calendar events (same event ID)
 * - attendee: Learns from meeting attendees (email hash)
 */
export type PatternType = 'event_type' | 'keyword' | 'recurring' | 'attendee'

/**
 * Database record for moment learnings
 */
export interface MomentLearning {
  id: string
  user_id: string
  pattern_type: PatternType
  pattern_key: string // e.g., '1:1', 'career', 'event:google_abc123', 'attendee:hash123'
  gem_id: string
  helpful_count: number
  not_helpful_count: number
  last_helpful_at: string
  created_at: string
  updated_at: string
}

/**
 * Input for creating/updating a learning
 */
export interface CreateLearningInput {
  pattern_type: PatternType
  pattern_key: string
  gem_id: string
}

/**
 * A thought that was learned from patterns
 */
export interface LearnedThought {
  gem_id: string
  gem_content: string
  confidence_score: number // helpful_count / (helpful_count + not_helpful_count)
  pattern_sources: string[] // Which patterns matched (for explainability)
  helpful_count: number
}

/**
 * Patterns extracted from a moment for learning lookup
 */
export interface MomentPatterns {
  eventType?: EventType
  keywords: string[]
  externalEventId?: string
  attendeeEmails?: string[]
  userContext?: string
}

/**
 * Result from checking if a moment is recurring
 */
export interface RecurringMatch {
  isRecurring: boolean
  matchType?: 'exact_event_id' | 'fuzzy_pattern'
  previousMomentId?: string
  previousHelpfulThoughts?: string[] // gem IDs
}

/**
 * Match source for tracking where matches came from
 */
export type MatchSource = 'ai' | 'learned' | 'both'

/**
 * Extended moment thought with match source
 */
export interface MomentThoughtWithSource {
  gem_id: string
  relevance_score: number
  relevance_reason: string | null
  match_source: MatchSource
  learned_confidence?: number // If from learned, include confidence
}

/**
 * Minimum threshold for suggesting learned thoughts
 * Requires at least 3 helpful marks before suggesting
 */
export const LEARNING_HELPFUL_THRESHOLD = 3

/**
 * Minimum confidence score for including learned thoughts
 * confidence = helpful_count / (helpful_count + not_helpful_count)
 */
export const LEARNING_CONFIDENCE_THRESHOLD = 0.7

/**
 * Stop words to remove when extracting keywords
 */
export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'about', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
  'these', 'those', 'am', 'being', 'both', 'each', 'i', 'me', 'we',
  'you', 'he', 'she', 'it', 'they', 'what', 'which', 'who', 'whom',
])
