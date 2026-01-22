// Moment types for situational thought surfacing
import type { Thought } from "@/lib/types/thought"

export type MomentSource = 'manual' | 'calendar'
export type MomentStatus = 'active' | 'completed' | 'dismissed'

export interface Moment {
  id: string
  user_id: string
  description: string
  source: MomentSource
  calendar_event_id: string | null
  calendar_event_title: string | null
  calendar_event_start: string | null
  gems_matched_count: number  // Database column name (unchanged)
  ai_processing_time_ms: number | null
  status: MomentStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface MomentThought {
  id: string
  moment_id: string
  gem_id: string  // Database column name (unchanged)
  user_id: string
  relevance_score: number
  relevance_reason: string | null
  was_helpful: boolean | null
  was_reviewed: boolean
  created_at: string
  thought?: Thought  // Joined thought data
}

// Legacy alias for backward compatibility
export type MomentGem = MomentThought

export interface MomentWithThoughts extends Moment {
  matched_thoughts: MomentThought[]
}

// Legacy alias for backward compatibility
export type MomentWithGems = MomentWithThoughts

export interface CalendarEventData {
  event_id: string
  title: string
  start_time: string
}

// Max description length
export const MAX_MOMENT_DESCRIPTION_LENGTH = 500
