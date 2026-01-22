// Moment types for situational gem surfacing
import type { Gem } from "@/lib/types/gem"

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
  gems_matched_count: number
  ai_processing_time_ms: number | null
  status: MomentStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface MomentGem {
  id: string
  moment_id: string
  gem_id: string
  user_id: string
  relevance_score: number
  relevance_reason: string | null
  was_helpful: boolean | null
  was_reviewed: boolean
  created_at: string
  gem?: Gem  // Joined gem data
}

export interface MomentWithGems extends Moment {
  matched_gems: MomentGem[]
}

export interface CalendarEventData {
  event_id: string
  title: string
  start_time: string
}

// Max description length
export const MAX_MOMENT_DESCRIPTION_LENGTH = 500
