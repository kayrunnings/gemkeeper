"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Thought } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { createClient } from "@/lib/supabase/client"
import { getDailyThought } from "@/lib/thoughts"
import { getRecentMoments } from "@/lib/moments"
import { getContexts } from "@/lib/contexts"
import { LayoutShell } from "@/components/layout-shell"
import { TFInsight, TFInsightData } from "@/components/home/TFInsight"
import { CaptureQuadrant } from "@/components/home/CaptureQuadrant"
import { GrowQuadrant } from "@/components/home/GrowQuadrant"
import { ApplyQuadrant } from "@/components/home/ApplyQuadrant"
import { TrackQuadrant } from "@/components/home/TrackQuadrant"
import { ThoughtForm } from "@/components/thought-form"
import { AICaptureModal } from "@/components/capture/AICaptureModal"
import { EnhancedNoteEditor } from "@/components/notes/enhanced-note-editor"
import { useToast } from "@/components/error-toast"
import { LoadingState } from "@/components/ui/loading-state"
import type { Moment } from "@/types/moments"

interface HomeStats {
  streak: {
    current: number
    best: number
    weeklyActivity: boolean[]
  }
  weekStats: {
    applications: number
    applicationsTrend: number
    newCaptures: number
    newCapturesTrend: number
  }
  nearGraduation: Array<{
    id: string
    content: string
    applicationCount: number
    remaining: number
  }>
  totals: {
    activeGems: number
    graduatedGems: number
    totalApplications: number
  }
  recentCaptures: Array<{
    id: string
    type: "thought" | "note"
    content: string
    contextId: string | null
    createdAt: string
  }>
  weeklyCaptures: number
}

export default function HomePage() {
  const [dailyThought, setDailyThought] = useState<Thought | null>(null)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const [moments, setMoments] = useState<Moment[]>([])
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [checkinEnabled, setCheckinEnabled] = useState(true)
  const [hasAIConsent, setHasAIConsent] = useState(false)

  // TF Insights state
  const [tfInsights, setTfInsights] = useState<TFInsightData[]>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)

  // Home stats state
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null)

  // Modal states
  const [isThoughtFormOpen, setIsThoughtFormOpen] = useState(false)
  const [isAICaptureOpen, setIsAICaptureOpen] = useState(false)
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false)
  const [captureInitialContent, setCaptureInitialContent] = useState<string | undefined>(undefined)

  const router = useRouter()
  const supabase = createClient()
  const { showError } = useToast()

  // Fetch TF Insights
  const fetchTFInsights = useCallback(async () => {
    setIsLoadingInsights(true)
    try {
      const response = await fetch("/api/tf/insights")
      if (response.ok) {
        const data = await response.json()
        setTfInsights(data.insights || [])
      }
    } catch (err) {
      console.error("Failed to fetch TF insights:", err)
    } finally {
      setIsLoadingInsights(false)
    }
  }, [])

  // Fetch home stats
  const fetchHomeStats = useCallback(async () => {
    try {
      const response = await fetch("/api/home/stats")
      if (response.ok) {
        const data = await response.json()
        setHomeStats(data)
      }
    } catch (err) {
      console.error("Failed to fetch home stats:", err)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserEmail(user.email ?? null)

        // Fetch profile for name, checkin settings, and AI consent
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, checkin_enabled, ai_consent_given")
          .eq("id", user.id)
          .single()

        if (profile?.name) {
          setUserName(profile.name)
        }
        setCheckinEnabled(profile?.checkin_enabled ?? true)
        setHasAIConsent(profile?.ai_consent_given ?? false)

        // Fetch all data in parallel
        const [thoughtResult, momentsResult, contextsResult, calendarResult] =
          await Promise.all([
            getDailyThought(),
            getRecentMoments(10),
            getContexts(),
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

        // Fetch home stats and TF insights
        await Promise.all([fetchHomeStats(), fetchTFInsights()])
      } catch (err) {
        showError(err, "Failed to load home data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError, fetchHomeStats, fetchTFInsights])

  const handleThoughtSaved = useCallback((_thought?: Thought) => {
    setIsThoughtFormOpen(false)
    fetchHomeStats()
  }, [fetchHomeStats])

  const handleNoteSaved = useCallback(
    (
      _note: { title?: string | null; content?: string | null; context_id?: string; folder_id?: string | null },
      _existingId?: string
    ) => {
      setIsNoteEditorOpen(false)
      fetchHomeStats()
    },
    [fetchHomeStats]
  )

  const handleDiscoverTopic = useCallback(
    (topic: string) => {
      router.push(`/discover?q=${encodeURIComponent(topic)}`)
    },
    [router]
  )

  const handleDiscoverContext = useCallback(
    (contextId: string) => {
      router.push(`/discover?context=${contextId}`)
    },
    [router]
  )

  const handleSurpriseMe = useCallback(() => {
    router.push("/discover?surprise=true")
  }, [router])

  const handleShuffleDailyThought = useCallback(async () => {
    try {
      const response = await fetch("/api/thoughts/shuffle", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        if (data.thought) {
          setDailyThought(data.thought)
        }
      }
    } catch (err) {
      showError(err, "Failed to shuffle thought")
    }
  }, [showError])

  if (isLoading) {
    return (
      <LoadingState variant="fullscreen" message="Gathering your thoughts..." />
    )
  }

  const displayName = userName || userEmail?.split("@")[0] || "there"

  // Get time-based greeting
  const hour = new Date().getHours()
  let timeGreeting = "Good evening"
  if (hour < 12) timeGreeting = "Good morning"
  else if (hour < 17) timeGreeting = "Good afternoon"

  // Format recent captures with context names
  const recentCaptures = (homeStats?.recentCaptures || []).map((c) => ({
    ...c,
    contextName: c.contextId
      ? contexts.find((ctx) => ctx.id === c.contextId)?.name
      : undefined,
    createdAt: new Date(c.createdAt),
  }))

  // Today's moments count
  const todayMomentsCount = moments.filter((m) => {
    if (!m.created_at) return false
    const created = new Date(m.created_at)
    const today = new Date()
    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    )
  }).length

  // Filter to only upcoming moments (future events)
  const now = new Date()
  const upcomingMoments = moments
    .filter((m) => {
      const eventTime = m.calendar_event_start || m.created_at
      if (!eventTime) return false
      return new Date(eventTime) >= now
    })
    .sort((a, b) => {
      const aTime = new Date(a.calendar_event_start || a.created_at || 0)
      const bTime = new Date(b.calendar_event_start || b.created_at || 0)
      return aTime.getTime() - bTime.getTime()
    })

  return (
    <LayoutShell
      userEmail={userEmail}
      contexts={contexts}
      calendarConnected={calendarConnected}
    >
      <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
        {/* Header with greeting */}
        <div className="mb-3">
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight">
            {timeGreeting}, {displayName}
          </h1>
        </div>

        {/* TF Insight Card */}
        {hasAIConsent && (
          <TFInsight
            insights={tfInsights}
            onRefresh={fetchTFInsights}
            isLoading={isLoadingInsights}
            className="mb-4"
          />
        )}

        {/* Four Quadrants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Capture Quadrant */}
          <CaptureQuadrant
            weeklyCaptures={homeStats?.weeklyCaptures || 0}
            recentCaptures={recentCaptures}
            onOpenAICapture={(content) => {
              setCaptureInitialContent(content)
              setIsAICaptureOpen(true)
            }}
            onOpenNoteEditor={() => setIsNoteEditorOpen(true)}
            onOpenThoughtForm={() => setIsThoughtFormOpen(true)}
          />

          {/* Grow Quadrant */}
          <GrowQuadrant
            contexts={contexts}
            onDiscoverTopic={handleDiscoverTopic}
            onDiscoverContext={handleDiscoverContext}
            onSurpriseMe={handleSurpriseMe}
          />

          {/* Apply Quadrant */}
          {checkinEnabled && (
            <ApplyQuadrant
              dailyThought={dailyThought}
              alreadyCheckedIn={alreadyCheckedIn}
              contexts={contexts}
              upcomingMoments={upcomingMoments}
              todayMomentsCount={todayMomentsCount}
              onShuffle={handleShuffleDailyThought}
            />
          )}

          {/* Track Quadrant */}
          <TrackQuadrant
            streak={
              homeStats?.streak || {
                current: 0,
                best: 0,
                weeklyActivity: [
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                ],
              }
            }
            weekStats={
              homeStats?.weekStats || {
                applications: 0,
                applicationsTrend: 0,
                newCaptures: 0,
                newCapturesTrend: 0,
              }
            }
            nearGraduation={homeStats?.nearGraduation || []}
            totals={
              homeStats?.totals || {
                activeGems: 0,
                graduatedGems: 0,
                totalApplications: 0,
              }
            }
          />
        </div>
      </div>

      {/* Modals */}
      <ThoughtForm
        isOpen={isThoughtFormOpen}
        onClose={() => setIsThoughtFormOpen(false)}
        onThoughtCreated={handleThoughtSaved}
      />

      {hasAIConsent && (
        <AICaptureModal
          isOpen={isAICaptureOpen}
          onClose={() => {
            setIsAICaptureOpen(false)
            setCaptureInitialContent(undefined)
          }}
          onSuccess={() => router.refresh()}
          contexts={contexts}
          initialContent={captureInitialContent}
        />
      )}

      <EnhancedNoteEditor
        note={null}
        isOpen={isNoteEditorOpen}
        onClose={() => setIsNoteEditorOpen(false)}
        onSave={handleNoteSaved}
        contexts={contexts.map(c => ({ ...c, color: c.color || "#888888" }))}
      />
    </LayoutShell>
  )
}
