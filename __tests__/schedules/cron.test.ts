import { generateCronExpression, generateHumanReadable, calculateNextTrigger } from '@/lib/schedules'
import type { ScheduleInput } from '@/types/schedules'

describe('generateCronExpression', () => {
  it('generates daily cron', () => {
    const input: ScheduleInput = { schedule_type: 'daily', time_of_day: '08:00' }
    expect(generateCronExpression(input)).toBe('0 8 * * *')
  })

  it('generates daily cron with different time', () => {
    const input: ScheduleInput = { schedule_type: 'daily', time_of_day: '14:30' }
    expect(generateCronExpression(input)).toBe('30 14 * * *')
  })

  it('generates weekly cron for specific days', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [1, 3, 5],
      time_of_day: '14:00'
    }
    expect(generateCronExpression(input)).toBe('0 14 * * 1,3,5')
  })

  it('generates weekly cron for weekdays', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [1, 2, 3, 4, 5],
      time_of_day: '09:00'
    }
    expect(generateCronExpression(input)).toBe('0 9 * * 1,2,3,4,5')
  })

  it('generates weekly cron for single day', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [2],
      time_of_day: '14:00'
    }
    expect(generateCronExpression(input)).toBe('0 14 * * 2')
  })

  it('generates monthly cron for specific day', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      day_of_month: 15,
      time_of_day: '10:00'
    }
    expect(generateCronExpression(input)).toBe('0 10 15 * *')
  })

  it('generates monthly cron for last day', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      day_of_month: -1,
      time_of_day: '09:00'
    }
    expect(generateCronExpression(input)).toBe('0 9 L * *')
  })

  it('generates monthly cron for first day', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      day_of_month: 1,
      time_of_day: '12:00'
    }
    expect(generateCronExpression(input)).toBe('0 12 1 * *')
  })

  it('throws error for weekly without days', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      time_of_day: '09:00'
    }
    expect(() => generateCronExpression(input)).toThrow('days_of_week required')
  })

  it('throws error for monthly without day', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      time_of_day: '09:00'
    }
    expect(() => generateCronExpression(input)).toThrow('day_of_month required')
  })

  it('handles custom type with days', () => {
    const input: ScheduleInput = {
      schedule_type: 'custom',
      days_of_week: [0, 6],
      time_of_day: '10:00'
    }
    expect(generateCronExpression(input)).toBe('0 10 * * 0,6')
  })
})

describe('generateHumanReadable', () => {
  it('formats daily schedules', () => {
    const input: ScheduleInput = { schedule_type: 'daily', time_of_day: '08:00' }
    expect(generateHumanReadable(input)).toBe('Every day at 8:00 AM')
  })

  it('formats daily schedules with PM time', () => {
    const input: ScheduleInput = { schedule_type: 'daily', time_of_day: '14:30' }
    expect(generateHumanReadable(input)).toBe('Every day at 2:30 PM')
  })

  it('formats weekday schedules', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [1, 2, 3, 4, 5],
      time_of_day: '09:00'
    }
    expect(generateHumanReadable(input)).toBe('Weekdays at 9:00 AM')
  })

  it('formats weekend schedules', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [0, 6],
      time_of_day: '10:00'
    }
    expect(generateHumanReadable(input)).toBe('Weekends at 10:00 AM')
  })

  it('formats single day weekly schedules', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [2],
      time_of_day: '14:00'
    }
    expect(generateHumanReadable(input)).toBe('Every Tuesday at 2:00 PM')
  })

  it('formats multiple day weekly schedules', () => {
    const input: ScheduleInput = {
      schedule_type: 'weekly',
      days_of_week: [1, 3, 5],
      time_of_day: '09:00'
    }
    expect(generateHumanReadable(input)).toBe('Every Monday, Wednesday and Friday at 9:00 AM')
  })

  it('formats monthly schedules', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      day_of_month: 15,
      time_of_day: '10:00'
    }
    expect(generateHumanReadable(input)).toBe('15th of every month at 10:00 AM')
  })

  it('formats monthly schedules for first day', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      day_of_month: 1,
      time_of_day: '12:00'
    }
    expect(generateHumanReadable(input)).toBe('1st of every month at 12:00 PM')
  })

  it('formats monthly schedules for last day', () => {
    const input: ScheduleInput = {
      schedule_type: 'monthly',
      day_of_month: -1,
      time_of_day: '17:00'
    }
    expect(generateHumanReadable(input)).toBe('Last day of every month at 5:00 PM')
  })

  it('handles midnight correctly', () => {
    const input: ScheduleInput = { schedule_type: 'daily', time_of_day: '00:00' }
    expect(generateHumanReadable(input)).toBe('Every day at 12:00 AM')
  })

  it('handles noon correctly', () => {
    const input: ScheduleInput = { schedule_type: 'daily', time_of_day: '12:00' }
    expect(generateHumanReadable(input)).toBe('Every day at 12:00 PM')
  })
})

describe('calculateNextTrigger', () => {
  it('calculates next trigger for daily schedule', () => {
    const cron = '0 9 * * *' // 9 AM daily
    const next = calculateNextTrigger(cron, 'UTC')
    expect(next).toBeInstanceOf(Date)
    expect(next.getTime()).toBeGreaterThan(Date.now())
  })

  it('calculates next trigger for weekly schedule', () => {
    const cron = '0 14 * * 2' // Tuesday at 2 PM
    const next = calculateNextTrigger(cron, 'UTC')
    expect(next).toBeInstanceOf(Date)
    // The next trigger should be within the next 7 days
    const maxTime = Date.now() + 7 * 24 * 60 * 60 * 1000
    expect(next.getTime()).toBeLessThanOrEqual(maxTime)
  })

  it('returns future date for invalid cron', () => {
    const next = calculateNextTrigger('invalid', 'UTC')
    expect(next).toBeInstanceOf(Date)
    expect(next.getTime()).toBeGreaterThan(Date.now())
  })
})
