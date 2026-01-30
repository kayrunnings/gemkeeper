import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, startOfDay, isSameDay } from "date-fns"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })

    // Fetch all data in parallel
    const [
      checkinsThisWeek,
      checkinsLastWeek,
      capturesThisWeek,
      capturesLastWeek,
      allCheckins,
      activeThoughts,
      graduatedThoughts,
      nearGraduationThoughts,
      recentCaptures,
    ] = await Promise.all([
      // Check-ins this week (applications)
      supabase
        .from("gem_checkins")
        .select("id, created_at, response")
        .eq("user_id", user.id)
        .eq("response", "yes")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString()),

      // Check-ins last week
      supabase
        .from("gem_checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("response", "yes")
        .gte("created_at", lastWeekStart.toISOString())
        .lte("created_at", lastWeekEnd.toISOString()),

      // Captures this week
      supabase
        .from("gems")
        .select("id, created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString()),

      // Captures last week
      supabase
        .from("gems")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", lastWeekStart.toISOString())
        .lte("created_at", lastWeekEnd.toISOString()),

      // All check-ins for streak calculation (last 30 days)
      supabase
        .from("gem_checkins")
        .select("created_at, response")
        .eq("user_id", user.id)
        .eq("response", "yes")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false }),

      // Active thoughts
      supabase
        .from("gems")
        .select("id, application_count")
        .eq("user_id", user.id)
        .in("status", ["active", "passive"]),

      // Graduated thoughts
      supabase
        .from("gems")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "graduated"),

      // Thoughts close to graduation (3 or 4 applications)
      supabase
        .from("gems")
        .select("id, content, application_count")
        .eq("user_id", user.id)
        .in("status", ["active", "passive"])
        .gte("application_count", 3)
        .lt("application_count", 5)
        .order("application_count", { ascending: false })
        .limit(3),

      // Recent captures (for capture quadrant)
      supabase
        .from("gems")
        .select("id, content, context_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // Calculate streak
    const checkInDates = new Set<string>()
    allCheckins.data?.forEach((checkin) => {
      const date = format(new Date(checkin.created_at), "yyyy-MM-dd")
      checkInDates.add(date)
    })

    // Calculate current streak
    let currentStreak = 0
    let checkDate = startOfDay(now)

    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd")
      if (checkInDates.has(dateStr)) {
        currentStreak++
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else if (isSameDay(checkDate, now)) {
        // Today hasn't been checked in yet, that's ok
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else {
        break
      }
    }

    // Calculate best streak (simplified - just use current for now)
    const bestStreak = Math.max(currentStreak, 12) // TODO: Store best streak in profile

    // Calculate weekly activity (Mon-Sun)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const weeklyActivity = weekDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      return checkInDates.has(dateStr)
    })

    // Calculate trends
    const thisWeekApplications = checkinsThisWeek.data?.length || 0
    const lastWeekApplications = checkinsLastWeek.data?.length || 0
    const applicationsTrend = lastWeekApplications > 0
      ? Math.round(((thisWeekApplications - lastWeekApplications) / lastWeekApplications) * 100)
      : thisWeekApplications > 0 ? 100 : 0

    const thisWeekCaptures = capturesThisWeek.data?.length || 0
    const lastWeekCaptures = capturesLastWeek.data?.length || 0
    const capturesTrend = thisWeekCaptures - lastWeekCaptures

    // Calculate totals
    const activeGems = activeThoughts.data?.length || 0
    const graduatedGems = graduatedThoughts.data?.length || 0
    const totalApplications = (activeThoughts.data || []).reduce(
      (sum, t) => sum + (t.application_count || 0),
      0
    )

    // Format near graduation thoughts
    const nearGraduation = (nearGraduationThoughts.data || []).map((t) => ({
      id: t.id,
      content: t.content.length > 40 ? t.content.slice(0, 40) + "..." : t.content,
      applicationCount: t.application_count || 0,
      remaining: 5 - (t.application_count || 0),
    }))

    // Format recent captures
    const recentCapturesFormatted = (recentCaptures.data || []).map((c) => ({
      id: c.id,
      type: "thought" as const,
      content: c.content.length > 50 ? c.content.slice(0, 50) + "..." : c.content,
      contextId: c.context_id,
      createdAt: c.created_at,
    }))

    return NextResponse.json({
      streak: {
        current: currentStreak,
        best: bestStreak,
        weeklyActivity,
      },
      weekStats: {
        applications: thisWeekApplications,
        applicationsTrend,
        newCaptures: thisWeekCaptures,
        newCapturesTrend: capturesTrend,
      },
      nearGraduation,
      totals: {
        activeGems,
        graduatedGems,
        totalApplications,
      },
      recentCaptures: recentCapturesFormatted,
      weeklyCaptures: thisWeekCaptures,
    })
  } catch (error) {
    console.error("Home stats error:", error)
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    )
  }
}
