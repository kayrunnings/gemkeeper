"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getContexts } from "@/lib/contexts"
import { LayoutShell } from "@/components/layout-shell"
import { DiscoverTabs, type DiscoverTab } from "@/components/discover/DiscoverTabs"
import { DiscoverCard } from "@/components/discover"
import { SavedDiscoveriesTab } from "@/components/discover/SavedDiscoveriesTab"
import { useToast } from "@/components/error-toast"
import { Sparkles, Compass } from "lucide-react"
import type { ContextWithCount } from "@/lib/types/context"

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<DiscoverTab>("for-you")
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
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

        // Fetch contexts and saved count in parallel
        const [contextsResult, savedResponse] = await Promise.all([
          getContexts(),
          fetch("/api/discover/saved"),
        ])

        if (contextsResult.contexts) {
          setContexts(contextsResult.contexts)
        }

        if (savedResponse.ok) {
          const savedData = await savedResponse.json()
          setSavedCount(savedData.count || 0)
        }
      } catch (err) {
        showError(err, "Failed to load discover page")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  // Refresh saved count when tab changes to saved
  useEffect(() => {
    if (activeTab === "saved") {
      fetch("/api/discover/saved")
        .then((res) => res.json())
        .then((data) => setSavedCount(data.count || 0))
        .catch(console.error)
    }
  }, [activeTab])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading discoveries...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail} contexts={contexts}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground">Find new knowledge to add to your library</p>
          </div>
        </div>

        {/* Tabs */}
        <DiscoverTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            saved: savedCount,
          }}
          className="mb-6"
        />

        {/* Tab content */}
        {activeTab === "for-you" && (
          <DiscoverCard contexts={contexts} />
        )}

        {activeTab === "explore" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Compass className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">Explore Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Browse curated content by topic, author, or category. This feature is under development.
            </p>
          </div>
        )}

        {activeTab === "saved" && (
          <SavedDiscoveriesTab
            contexts={contexts}
            onExtractThoughts={(discovery) => {
              // For now, navigate to the discovery detail or show a modal
              // This could be enhanced to open a modal for extraction
              console.log("Extract thoughts from:", discovery)
            }}
          />
        )}
      </div>
    </LayoutShell>
  )
}
