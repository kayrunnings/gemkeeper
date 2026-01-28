"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Thought } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { createClient } from "@/lib/supabase/client"
import { getDailyThought } from "@/lib/thoughts"
import { getRecentMoments } from "@/lib/moments"
import { getContexts } from "@/lib/contexts"
import { LayoutShell } from "@/components/layout-shell"
import { DailyThoughtCard } from "@/components/home/DailyThoughtCard"
import { ActivityStatsCard } from "@/components/home/ActivityStatsCard"
import { QuickActionsRow } from "@/components/home/QuickActionsRow"
import { UpcomingMomentsCard } from "@/components/home/UpcomingMomentsCard"
import { RecentActivityCard } from "@/components/home/RecentActivityCard"
import { DiscoverCard } from "@/components/discover"
import { useToast } from "@/components/error-toast"
import { LoadingState } from "@/components/ui/loading-state"
import type { Moment } from "@/types/moments"

interface Stats {
  activeGems: number
  graduatedGems: number
  totalApplications: number
}

interface GreetingContext {
  activeCount: number
  graduatedCount: number
  upcomingMomentsCount: number
  hasCheckedIn: boolean
  checkinEnabled: boolean
}

function getSmartGreeting(displayName: string, context: GreetingContext): { greeting: string; subtitle: string } {
  const hour = new Date().getHours()
  let timeGreeting = "Good evening"
  if (hour < 12) timeGreeting = "Good morning"
  else if (hour < 17) timeGreeting = "Good afternoon"

  const greeting = `${timeGreeting}, ${displayName}`

  // Smart subtitle based on context
  if (context.checkinEnabled && !context.hasCheckedIn && context.activeCount > 0) {
    return { greeting, subtitle: "Ready to reflect on today's thought?" }
  }

  if (context.upcomingMomentsCount > 0) {
    const momentText = context.upcomingMomentsCount === 1 ? "moment" : "moments"
    return { greeting, subtitle: `You have ${context.upcomingMomentsCount} upcoming ${momentText} to prepare for` }
  }

  if (context.activeCount === 0) {
    return { greeting, subtitle: "Start building your knowledge by capturing your first thought" }
  }

  if (context.graduatedCount > 0 && context.graduatedCount >= context.activeCount) {
    return { greeting, subtitle: `Amazing progress! ${context.graduatedCount} thoughts graduated to mastery` }
  }

  if (context.activeCount > 0) {
    const thoughtText = context.activeCount === 1 ? "thought" : "thoughts"
    return { greeting, subtitle: `${context.activeCount} active ${thoughtText} ready for application` }
  }

  return { greeting, subtitle: "Here's your knowledge dashboard" }
}

export default function HomePage() {
  const [dailyThought, setDailyThought] = useState<Thought | null>(null)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const [moments, setMoments] = useState<Moment[]>([])
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [stats, setStats] = useState<Stats>({ activeGems: 0, graduatedGems: 0, totalApplications: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [checkinEnabled, setCheckinEnabled] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { showError } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserEmail(user.email ?? null)

        // Fetch profile for name and checkin settings
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, checkin_enabled")
          .eq("id", user.id)
          .single()

        if (profile?.name) {
          setUserName(profile.name)
        }
        // Set checkin_enabled, default to true if not set
        setCheckinEnabled(profile?.checkin_enabled ?? true)

        // Fetch all data in parallel
        const [thoughtResult, momentsResult, contextsResult, activeGemsResult, graduatedGemsResult, calendarResult] = await Promise.all([
          getDailyThought(),
          getRecentMoments(10),
          getContexts(),
          supabase
            .from("gems")
            .select("application_count")
            .eq("user_id", user.id)
            .eq("status", "active"),
          supabase
            .from("gems")
            .select("application_count")
            .eq("user_id", user.id)
            .eq("status", "graduated"),
          supabase
            .from("calendar_connections")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle(),
        ])

        // Check calendar connection
        if (calendarResult.data) {
          setCalendarConnected(true)
        }

        if (thoughtResult.thought) {
          setDailyThought(thoughtResult.thought)
        }
        if (thoughtResult.alreadyCheckedIn) {
          setAlreadyCheckedIn(true)
        }

        if (momentsResult.moments) {
          setMoments(momentsResult.moments)
        }

        if (contextsResult.contexts) {
          setContexts(contextsResult.contexts)
        }

        // Calculate stats
        const activeGems = activeGemsResult.data || []
        const graduatedGems = graduatedGemsResult.data || []
        const totalApplications = [...activeGems, ...graduatedGems].reduce(
          (sum, gem) => sum + (gem.application_count || 0),
          0
        )

        setStats({
          activeGems: activeGems.length,
          graduatedGems: graduatedGems.length,
          totalApplications,
        })
      } catch (err) {
        showError(err, "Failed to load home data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  if (isLoading) {
    return <LoadingState variant="fullscreen" message="Gathering your thoughts..." />
  }

  const displayName = userName || userEmail?.split("@")[0] || "there"

  // Get smart greeting based on context
  const { greeting, subtitle } = getSmartGreeting(displayName, {
    activeCount: stats.activeGems,
    graduatedCount: stats.graduatedGems,
    upcomingMomentsCount: moments.length,
    hasCheckedIn: alreadyCheckedIn,
    checkinEnabled,
  })

  return (
    <LayoutShell userEmail={userEmail} contexts={contexts} calendarConnected={calendarConnected}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header with smart greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting}
          </h1>
          <p className="text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>

        {/* Primary action: Today's Thought - The core loop, shown first */}
        {checkinEnabled && (
          <DailyThoughtCard thought={dailyThought} alreadyCheckedIn={alreadyCheckedIn} contexts={contexts} className="mb-6" />
        )}

        {/* Quick Actions - Easy access to main features */}
        <QuickActionsRow className="mb-6" />

        {/* Upcoming Moments - Time-sensitive, shown early */}
        {moments.length > 0 && (
          <UpcomingMomentsCard moments={moments} className="mb-6" />
        )}

        {/* Discover Something New - AI-powered discovery */}
        <div className="mb-6">
          <DiscoverCard contexts={contexts} />
        </div>

        {/* Recent Activity - What's happening in your library */}
        <RecentActivityCard contexts={contexts} className="mb-6" />

        {/* Activity Stats - Summary at the bottom */}
        <ActivityStatsCard stats={stats} />
      </div>
    </LayoutShell>
  )
}
