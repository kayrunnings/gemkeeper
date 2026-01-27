// Calendar integration types

export type CalendarProvider = 'google' | 'microsoft'

export interface CalendarConnection {
  id: string
  user_id: string
  provider: CalendarProvider
  email: string
  is_active: boolean
  auto_moment_enabled: boolean
  lead_time_minutes: number
  event_filter: 'all' | 'meetings' | 'custom'
  custom_keywords: string[]
  last_sync_at: string | null
  sync_error: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  connection_id: string
  user_id: string
  external_event_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  moment_created: boolean
  moment_id: string | null
  created_at: string
  updated_at: string
}

export interface CalendarSyncResult {
  events_synced: number
  events_added: number
  events_updated: number
  errors: string[]
}

export interface GoogleCalendarTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
}

// Lead time options (in minutes)
export const LEAD_TIME_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
]

// Event filter options
export const EVENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All events' },
  { value: 'meetings', label: 'Meetings only' },
  { value: 'custom', label: 'Custom keywords' },
] as const
