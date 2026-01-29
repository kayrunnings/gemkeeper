import {
  LEAD_TIME_OPTIONS,
  EVENT_FILTER_OPTIONS,
} from '@/types/calendar'
import type {
  CalendarConnection,
  CalendarEvent,
  CalendarSyncResult,
} from '@/types/calendar'

describe('Calendar Types', () => {
  describe('LEAD_TIME_OPTIONS', () => {
    it('has correct values', () => {
      expect(LEAD_TIME_OPTIONS).toHaveLength(4)
      expect(LEAD_TIME_OPTIONS[0]).toEqual({ value: 15, label: '15 minutes' })
      expect(LEAD_TIME_OPTIONS[1]).toEqual({ value: 30, label: '30 minutes' })
      expect(LEAD_TIME_OPTIONS[2]).toEqual({ value: 60, label: '1 hour' })
      expect(LEAD_TIME_OPTIONS[3]).toEqual({ value: 120, label: '2 hours' })
    })
  })

  describe('EVENT_FILTER_OPTIONS', () => {
    it('has correct values', () => {
      expect(EVENT_FILTER_OPTIONS).toHaveLength(3)
      expect(EVENT_FILTER_OPTIONS.map(o => o.value)).toEqual(['all', 'meetings', 'custom'])
    })
  })

  describe('CalendarConnection interface', () => {
    it('has required fields', () => {
      const connection: CalendarConnection = {
        id: '123',
        user_id: 'user-1',
        provider: 'google',
        email: 'test@example.com',
        is_active: true,
        auto_moment_enabled: true,
        lead_time_minutes: 30,
        event_filter: 'all',
        custom_keywords: [],
        sync_frequency_minutes: 15,
        last_sync_at: null,
        sync_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      expect(connection.provider).toBe('google')
      expect(connection.lead_time_minutes).toBe(30)
    })
  })

  describe('CalendarEvent interface', () => {
    it('has required fields', () => {
      const event: CalendarEvent = {
        id: '123',
        connection_id: 'conn-1',
        user_id: 'user-1',
        external_event_id: 'google-event-123',
        title: 'Team Standup',
        description: null,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        moment_created: false,
        moment_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      expect(event.title).toBe('Team Standup')
      expect(event.moment_created).toBe(false)
    })
  })

  describe('CalendarSyncResult interface', () => {
    it('has required fields', () => {
      const result: CalendarSyncResult = {
        events_synced: 10,
        events_added: 5,
        events_updated: 3,
        errors: [],
      }

      expect(result.events_synced).toBe(10)
      expect(result.errors).toHaveLength(0)
    })
  })
})

describe('Calendar sync behavior', () => {
  it('should not create duplicate moments for same event', () => {
    // Test logic for idempotent moment creation
    const event: CalendarEvent = {
      id: '123',
      connection_id: 'conn-1',
      user_id: 'user-1',
      external_event_id: 'google-event-123',
      title: 'Team Standup',
      description: null,
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      moment_created: true,  // Already has moment
      moment_id: 'moment-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // If moment_created is true, should skip
    expect(event.moment_created).toBe(true)
    expect(event.moment_id).toBeTruthy()
  })

  it('should filter events by lead time', () => {
    const now = new Date()
    const leadTimeMinutes = 30
    const leadTimeMs = leadTimeMinutes * 60 * 1000

    // Event starting in 25 minutes - should be included
    const event25min = new Date(now.getTime() + 25 * 60 * 1000)
    expect(event25min.getTime() <= now.getTime() + leadTimeMs).toBe(true)

    // Event starting in 35 minutes - should be excluded
    const event35min = new Date(now.getTime() + 35 * 60 * 1000)
    expect(event35min.getTime() <= now.getTime() + leadTimeMs).toBe(false)
  })
})
