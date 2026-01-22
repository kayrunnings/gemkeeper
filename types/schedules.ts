// Schedule types for individual thought check-in schedules

export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface ThoughtSchedule {
  id: string
  gem_id: string  // Database column name (unchanged)
  user_id: string
  cron_expression: string
  human_readable: string
  timezone: string
  schedule_type: ScheduleType
  days_of_week: number[] | null  // 0=Sun, 6=Sat
  time_of_day: string | null     // "14:00:00"
  day_of_month: number | null
  is_active: boolean
  next_trigger_at: string | null
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleInput {
  schedule_type: ScheduleType
  days_of_week?: number[]
  time_of_day: string            // "14:00"
  day_of_month?: number
  timezone?: string
}

export interface NLPScheduleResult {
  cron_expression: string
  human_readable: string
  schedule_type: ScheduleType
  days_of_week: number[] | null
  time_of_day: string
  day_of_month: number | null
  confidence: number
}

// Day names for UI display
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

// Legacy alias for backward compatibility
export type GemSchedule = ThoughtSchedule
