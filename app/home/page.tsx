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
import { ContextChipsFilter } from "@/components/ui/ContextChipsFilter"
import { DiscoverCard } from "@/components/discover"
import { useToast } from "@/components/error-toast"
import { Home as HomeIcon } from "lucide-react"
import type { Moment } from "@/types/moments"

interface Stats {
  activeGems: number
  graduatedGems: number
  totalApplications: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
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
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null)
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

        // Fetch profile for name
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single()

        if (profile?.name) {
          setUserName(profile.name)
        }

        // Fetch all data in parallel
        const [thoughtResult, momentsResult, contextsResult, activeGemsResult, graduatedGemsResult] = await Promise.all([
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
        ])

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <HomeIcon className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const displayName = userName || userEmail?.split("@")[0] || "there"

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your knowledge dashboard
          </p>
        </div>

        {/* Today's Thought */}
        <DailyThoughtCard thought={dailyThought} alreadyCheckedIn={alreadyCheckedIn} contexts={contexts} className="mb-6" />

        {/* Quick Actions Row */}
        <QuickActionsRow className="mb-6" />

        {/* Context Chips Filter */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Filter by Context</h2>
          <ContextChipsFilter
            contexts={contexts}
            selectedContextId={selectedContextId}
            onSelect={setSelectedContextId}
            showCounts
            counts={contexts.reduce((acc, ctx) => {
              acc[ctx.id] = ctx.thought_count
              return acc
            }, {} as Record<string, number>)}
          />
        </div>

        {/* Main grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity - Full width */}
          <RecentActivityCard
            contexts={contexts}
            selectedContextId={selectedContextId}
            className="md:col-span-2"
          />

          {/* Upcoming Moments - Full width */}
          <UpcomingMomentsCard moments={moments} className="md:col-span-2" />

          {/* Activity Stats */}
          <ActivityStatsCard stats={stats} />

          {/* Discover Something New */}
          <DiscoverCard contexts={contexts} />
        </div>
      </div>
    </LayoutShell>
  )
}
