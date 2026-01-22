import { createClient } from "@/lib/supabase/client"
import type { GemSchedule, ScheduleInput, ScheduleType } from "@/types/schedules"
import { CronExpressionParser } from "cron-parser"

// Day name mappings
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Generate a cron expression from schedule input
 */
export function generateCronExpression(input: ScheduleInput): string {
  const [hours, minutes] = input.time_of_day.split(':').map(Number)

  switch (input.schedule_type) {
    case 'daily':
      return `${minutes} ${hours} * * *`

    case 'weekly':
      if (!input.days_of_week || input.days_of_week.length === 0) {
        throw new Error('days_of_week required for weekly schedule')
      }
      const sortedDays = [...input.days_of_week].sort((a, b) => a - b)
      return `${minutes} ${hours} * * ${sortedDays.join(',')}`

    case 'monthly':
      if (input.day_of_month === undefined) {
        throw new Error('day_of_month required for monthly schedule')
      }
      // -1 represents last day of month (L in cron)
      const dayPart = input.day_of_month === -1 ? 'L' : input.day_of_month
      return `${minutes} ${hours} ${dayPart} * *`

    case 'custom':
      // For custom, we still build from components but allow more flexibility
      if (input.days_of_week && input.days_of_week.length > 0) {
        const sortedDays = [...input.days_of_week].sort((a, b) => a - b)
        return `${minutes} ${hours} * * ${sortedDays.join(',')}`
      }
      return `${minutes} ${hours} * * *`

    default:
      return `${minutes} ${hours} * * *`
  }
}

/**
 * Generate human-readable description from schedule input
 */
export function generateHumanReadable(input: ScheduleInput): string {
  const timeStr = formatTime(input.time_of_day)

  switch (input.schedule_type) {
    case 'daily':
      return `Every day at ${timeStr}`

    case 'weekly':
      if (!input.days_of_week || input.days_of_week.length === 0) {
        return `Every week at ${timeStr}`
      }
      // Check for weekdays
      const weekdays = [1, 2, 3, 4, 5]
      const isWeekdays = weekdays.length === input.days_of_week.length &&
        weekdays.every(d => input.days_of_week!.includes(d))
      if (isWeekdays) {
        return `Weekdays at ${timeStr}`
      }
      // Check for weekends
      const weekends = [0, 6]
      const isWeekends = weekends.length === input.days_of_week.length &&
        weekends.every(d => input.days_of_week!.includes(d))
      if (isWeekends) {
        return `Weekends at ${timeStr}`
      }
      // List specific days
      const dayNames = input.days_of_week.map(d => DAY_NAMES[d])
      if (dayNames.length === 1) {
        return `Every ${dayNames[0]} at ${timeStr}`
      }
      const lastDay = dayNames.pop()
      return `Every ${dayNames.join(', ')} and ${lastDay} at ${timeStr}`

    case 'monthly':
      if (input.day_of_month === -1) {
        return `Last day of every month at ${timeStr}`
      }
      return `${getOrdinal(input.day_of_month!)} of every month at ${timeStr}`

    case 'custom':
      if (input.days_of_week && input.days_of_week.length > 0) {
        const dayNames = input.days_of_week.map(d => DAY_SHORT_NAMES[d])
        return `${dayNames.join(', ')} at ${timeStr}`
      }
      return `Custom schedule at ${timeStr}`

    default:
      return `At ${timeStr}`
  }
}

/**
 * Calculate the next trigger time from a cron expression
 */
export function calculateNextTrigger(cronExpression: string, timezone: string): Date {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: new Date(),
      tz: timezone,
    })
    return interval.next().toDate()
  } catch {
    // Fallback to next day if parsing fails
    const next = new Date()
    next.setDate(next.getDate() + 1)
    return next
  }
}

/**
 * Format time string to 12-hour format
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Get ordinal suffix for a number
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ===========================================
// CRUD Operations
// ===========================================

/**
 * Create a new schedule for a gem
 */
export async function createGemSchedule(
  gemId: string,
  input: ScheduleInput
): Promise<{ schedule: GemSchedule | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { schedule: null, error: "Not authenticated" }
  }

  const timezone = input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const cronExpression = generateCronExpression(input)
  const humanReadable = generateHumanReadable(input)
  const nextTriggerAt = calculateNextTrigger(cronExpression, timezone)

  const { data, error } = await supabase
    .from("gem_schedules")
    .insert({
      gem_id: gemId,
      user_id: user.id,
      cron_expression: cronExpression,
      human_readable: humanReadable,
      timezone,
      schedule_type: input.schedule_type,
      days_of_week: input.days_of_week || null,
      time_of_day: input.time_of_day + ':00', // Ensure seconds
      day_of_month: input.day_of_month || null,
      is_active: true,
      next_trigger_at: nextTriggerAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { schedule: null, error: error.message }
  }

  return { schedule: data, error: null }
}

/**
 * Get all schedules for a gem
 */
export async function getGemSchedules(
  gemId: string
): Promise<{ schedules: GemSchedule[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { schedules: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gem_schedules")
    .select("*")
    .eq("gem_id", gemId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    return { schedules: [], error: error.message }
  }

  return { schedules: data || [], error: null }
}

/**
 * Get all active schedules for a user
 */
export async function getAllActiveSchedules(): Promise<{ schedules: GemSchedule[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { schedules: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gem_schedules")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("next_trigger_at", { ascending: true })

  if (error) {
    return { schedules: [], error: error.message }
  }

  return { schedules: data || [], error: null }
}

/**
 * Update an existing schedule
 */
export async function updateGemSchedule(
  scheduleId: string,
  updates: Partial<ScheduleInput>
): Promise<{ schedule: GemSchedule | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { schedule: null, error: "Not authenticated" }
  }

  // Get existing schedule to merge updates
  const { data: existing, error: fetchError } = await supabase
    .from("gem_schedules")
    .select("*")
    .eq("id", scheduleId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !existing) {
    return { schedule: null, error: "Schedule not found" }
  }

  const mergedInput: ScheduleInput = {
    schedule_type: updates.schedule_type || existing.schedule_type,
    time_of_day: updates.time_of_day || existing.time_of_day?.slice(0, 5) || '09:00',
    days_of_week: updates.days_of_week !== undefined ? updates.days_of_week : existing.days_of_week,
    day_of_month: updates.day_of_month !== undefined ? updates.day_of_month : existing.day_of_month,
    timezone: updates.timezone || existing.timezone,
  }

  const cronExpression = generateCronExpression(mergedInput)
  const humanReadable = generateHumanReadable(mergedInput)
  const nextTriggerAt = calculateNextTrigger(cronExpression, mergedInput.timezone!)

  const { data, error } = await supabase
    .from("gem_schedules")
    .update({
      cron_expression: cronExpression,
      human_readable: humanReadable,
      timezone: mergedInput.timezone,
      schedule_type: mergedInput.schedule_type,
      days_of_week: mergedInput.days_of_week || null,
      time_of_day: mergedInput.time_of_day + ':00',
      day_of_month: mergedInput.day_of_month || null,
      next_trigger_at: nextTriggerAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { schedule: null, error: error.message }
  }

  return { schedule: data, error: null }
}

/**
 * Delete a schedule
 */
export async function deleteGemSchedule(
  scheduleId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("gem_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Toggle schedule active state
 */
export async function toggleScheduleActive(
  scheduleId: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const updateData: Record<string, unknown> = {
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }

  // Recalculate next trigger if activating
  if (isActive) {
    const { data: schedule } = await supabase
      .from("gem_schedules")
      .select("cron_expression, timezone")
      .eq("id", scheduleId)
      .eq("user_id", user.id)
      .single()

    if (schedule) {
      updateData.next_trigger_at = calculateNextTrigger(
        schedule.cron_expression,
        schedule.timezone
      ).toISOString()
    }
  }

  const { error } = await supabase
    .from("gem_schedules")
    .update(updateData)
    .eq("id", scheduleId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Get the next scheduled trigger across all active schedules for a gem
 */
export async function getNextTriggerForGem(
  gemId: string
): Promise<{ nextTrigger: Date | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { nextTrigger: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("gem_schedules")
    .select("next_trigger_at")
    .eq("gem_id", gemId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("next_trigger_at", { ascending: true })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No schedules found
      return { nextTrigger: null, error: null }
    }
    return { nextTrigger: null, error: error.message }
  }

  return {
    nextTrigger: data?.next_trigger_at ? new Date(data.next_trigger_at) : null,
    error: null
  }
}

/**
 * Count active schedules for a gem
 */
export async function getScheduleCountForGem(
  gemId: string
): Promise<{ count: number; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0, error: "Not authenticated" }
  }

  const { count, error } = await supabase
    .from("gem_schedules")
    .select("*", { count: 'exact', head: true })
    .eq("gem_id", gemId)
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}
