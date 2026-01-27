"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getContexts } from "@/lib/contexts"
import { LayoutShell } from "@/components/layout-shell"
import { LibraryTabs, LibraryTab } from "@/components/library/LibraryTabs"
import { LibraryAllTab } from "@/components/library/LibraryAllTab"
import { LibraryThoughtsTab } from "@/components/library/LibraryThoughtsTab"
import { LibraryNotesTab } from "@/components/library/LibraryNotesTab"
import { LibrarySourcesTab } from "@/components/library/LibrarySourcesTab"
import { LibraryArchiveTab } from "@/components/library/LibraryArchiveTab"
import { ContextChipsFilter } from "@/components/ui/ContextChipsFilter"
import { Input } from "@/components/ui/input"
import { Context } from "@/lib/types/context"
import { Library as LibraryIcon, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/error-toast"

function LibraryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [contexts, setContexts] = useState<Context[]>([])
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { showError } = useToast()

  const activeTab = (searchParams.get("tab") as LibraryTab) || "all"

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        setUserEmail(user.email ?? null)

        const { contexts: userContexts } = await getContexts()
        setContexts(userContexts || [])
      } catch (err) {
        showError(err, "Failed to load library data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, showError])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <LibraryIcon className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your library...</p>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <LibraryAllTab
            selectedContextId={selectedContextId}
            contexts={contexts}
            searchQuery={debouncedSearchQuery}
          />
        )
      case "thoughts":
        return (
          <LibraryThoughtsTab
            selectedContextId={selectedContextId}
            contexts={contexts}
            searchQuery={debouncedSearchQuery}
          />
        )
      case "notes":
        return <LibraryNotesTab searchQuery={debouncedSearchQuery} />
      case "sources":
        return <LibrarySourcesTab searchQuery={debouncedSearchQuery} />
      case "archive":
        return (
          <LibraryArchiveTab
            selectedContextId={selectedContextId}
            contexts={contexts}
            searchQuery={debouncedSearchQuery}
          />
        )
      default:
        return (
          <LibraryAllTab
            selectedContextId={selectedContextId}
            contexts={contexts}
            searchQuery={debouncedSearchQuery}
          />
        )
    }
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Library
          </h1>
          <p className="text-muted-foreground mt-1">
            All your thoughts, notes, and sources in one place
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Context Filter - only show for tabs that support it */}
        {(activeTab === "all" || activeTab === "thoughts" || activeTab === "archive") && (
          <div className="mb-6">
            <ContextChipsFilter
              contexts={contexts}
              selectedContextId={selectedContextId}
              onSelect={setSelectedContextId}
            />
          </div>
        )}

        {/* Tabs */}
        <LibraryTabs activeTab={activeTab} className="mb-6" />

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </LayoutShell>
  )
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  )
}
