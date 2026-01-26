"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/gem"
import { MAX_ACTIVE_LIST } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { GemForm } from "@/components/gem-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Gem as GemIcon, MoreHorizontal, Trash2, CheckCircle, Sparkles, AlertCircle, Star, StarOff, Filter, ChevronDown } from "lucide-react"
import { ExtractGemsModal } from "@/components/extract-gems-modal"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"
import { MomentFAB } from "@/components/moments/MomentFAB"
import { toggleActiveList, getActiveListCount } from "@/lib/thoughts"
import { getContexts } from "@/lib/contexts"

// Filter types
type ActiveFilter = "all" | "active" | "passive"

// Map context tags to badge variants (legacy, kept for backwards compat)
const contextTagVariant: Record<ContextTag, string> = {
  meetings: "meetings",
  feedback: "feedback",
  conflict: "conflict",
  focus: "focus",
  health: "health",
  relationships: "relationships",
  parenting: "parenting",
  other: "other",
}

export default function GemsPage() {
  const [gems, setGems] = useState<Gem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hasAIConsent, setHasAIConsent] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [contextFilter, setContextFilter] = useState<string | null>(null)
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [activeListCount, setActiveListCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  // Fetch gems and user on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserEmail(user.email ?? null)

        const { data, error } = await supabase
          .from("gems")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (error) {
          showError(error, "Failed to load gems")
        } else {
          setGems(data || [])
        }

        // Fetch profile for AI consent status
        const { data: profile } = await supabase
          .from("profiles")
          .select("ai_consent_given")
          .eq("id", user.id)
          .single()

        setHasAIConsent(profile?.ai_consent_given ?? false)

        // Fetch contexts
        const { contexts: contextData } = await getContexts()
        setContexts(contextData)

        // Fetch active list count
        const { count } = await getActiveListCount()
        setActiveListCount(count)
      } catch (err) {
        showError(err, "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const handleGemCreated = (gem: Gem) => {
    setGems((prev) => [gem, ...prev])
    setIsFormOpen(false)
    showSuccess("Thought added!", "Your wisdom has been captured.")
  }

  const handleGemsExtracted = async () => {
    // Refresh gems list after extraction
    const { data } = await supabase
      .from("gems")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (data) {
      setGems(data)
    }
    setIsExtractModalOpen(false)
    showSuccess("Thoughts extracted!", "AI has found wisdom in your content.")
  }

  const handleDeleteGem = async (gemId: string) => {
    if (!window.confirm("Are you sure you want to delete this thought?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("gems")
        .delete()
        .eq("id", gemId)

      if (error) {
        showError(error, "Failed to delete gem")
        return
      }

      setGems((prev) => prev.filter((gem) => gem.id !== gemId))
      showSuccess("Thought deleted")
    } catch (err) {
      showError(err, "Failed to delete gem")
    }
  }

  const handleToggleActiveList = async (gemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { thought, error } = await toggleActiveList(gemId)
    if (error) {
      showError(error)
      return
    }

    if (thought) {
      setGems((prev) =>
        prev.map((gem) => (gem.id === gemId ? { ...gem, is_on_active_list: thought.is_on_active_list } : gem))
      )
      // Update active list count
      const { count } = await getActiveListCount()
      setActiveListCount(count)

      if (thought.is_on_active_list) {
        showSuccess("Added to Active List", "This thought will appear in daily prompts")
      } else {
        showSuccess("Removed from Active List", "This thought is now passive")
      }
    }
  }

  // Filter gems based on active filter and context filter
  const filteredGems = useMemo(() => {
    return gems.filter((gem) => {
      // Active filter
      if (activeFilter === "active" && !gem.is_on_active_list) return false
      if (activeFilter === "passive" && gem.is_on_active_list) return false

      // Context filter
      if (contextFilter && gem.context_id !== contextFilter) return false

      return true
    })
  }, [gems, activeFilter, contextFilter])

  // Get context by ID for displaying colored badges
  const getContextById = (contextId: string | null) => {
    if (!contextId) return null
    return contexts.find((c) => c.id === contextId)
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  const gemCount = gems.length
  const isActiveListFull = activeListCount >= MAX_ACTIVE_LIST

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center ai-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground">Loading your thoughts...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Thoughts</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">
                {gemCount} thought{gemCount !== 1 ? "s" : ""}
              </p>
              <span className="text-muted-foreground">•</span>
              <p className={cn(
                "flex items-center gap-1",
                isActiveListFull ? "text-warning" : "text-muted-foreground"
              )}>
                <Star className="h-3.5 w-3.5" />
                Active: {activeListCount}/{MAX_ACTIVE_LIST}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsExtractModalOpen(true)}
              variant="ai"
              className="gap-2"
              title="Extract thoughts from content using AI"
            >
              <Sparkles className="h-4 w-4 ai-sparkle" />
              Extract with AI
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Thought
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Active/Passive filter tabs */}
          <div className="flex items-center rounded-lg border p-1">
            {(["all", "active", "passive"] as ActiveFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter === "all" ? "All" : filter === "active" ? "Active" : "Passive"}
              </button>
            ))}
          </div>

          {/* Context filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                {contextFilter
                  ? contexts.find((c) => c.id === contextFilter)?.name || "Context"
                  : "All Contexts"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem
                onClick={() => setContextFilter(null)}
                className={cn(!contextFilter && "bg-muted")}
              >
                All Contexts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {contexts.map((context) => (
                <DropdownMenuItem
                  key={context.id}
                  onClick={() => setContextFilter(context.id)}
                  className={cn(
                    "flex items-center gap-2",
                    contextFilter === context.id && "bg-muted"
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: context.color || "#6B7280" }}
                  />
                  <span className="flex-1">{context.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {context.thought_count}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {(activeFilter !== "all" || contextFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilter("all")
                setContextFilter(null)
              }}
              className="text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Active List info */}
        {isActiveListFull && activeFilter !== "passive" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning mb-6">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Active List is full ({MAX_ACTIVE_LIST}/{MAX_ACTIVE_LIST})</p>
              <p className="text-sm opacity-80 mt-0.5">
                Remove a thought from your Active List to add another. Only Active thoughts appear in daily prompts.
              </p>
            </div>
          </div>
        )}

        {/* Gems grid */}
        {filteredGems.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <GemIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {gems.length === 0 ? "No thoughts yet" : "No matching thoughts"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {gems.length === 0
                  ? "Capture wisdom, insights, and advice that you want to remember and apply in your life."
                  : "Try adjusting your filters to see more thoughts."}
              </p>
              {gems.length === 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setIsExtractModalOpen(true)} variant="ai" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Extract with AI
                  </Button>
                  <Button onClick={() => setIsFormOpen(true)} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add manually
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredGems.map((gem) => {
              const context = getContextById(gem.context_id)
              return (
                <Link key={gem.id} href={`/gems/${gem.id}`}>
                  <Card className="group relative cursor-pointer card-hover h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Active badge */}
                          {gem.is_on_active_list && (
                            <Badge variant="default" className="bg-amber-500 text-white hover:bg-amber-600">
                              <Star className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {/* Context badge - use new context if available, fall back to context_tag */}
                          {context ? (
                            <Badge
                              variant="outline"
                              className="border-2"
                              style={{
                                borderColor: context.color || "#6B7280",
                                color: context.color || "#6B7280",
                              }}
                            >
                              {context.name}
                            </Badge>
                          ) : (
                            <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                              {gem.context_tag === "other" && gem.custom_context
                                ? gem.custom_context
                                : CONTEXT_TAG_LABELS[gem.context_tag]}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(gem.created_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {truncateContent(gem.content)}
                      </p>

                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        {gem.source && (
                          <span className="truncate max-w-[150px]" title={gem.source}>
                            {gem.source}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                          {gem.application_count} {gem.application_count === 1 ? "application" : "applications"}
                        </span>
                      </div>

                      {/* Actions dropdown */}
                      <div
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.preventDefault()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8 bg-card/80 backdrop-blur-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => handleToggleActiveList(gem.id, e)}
                              disabled={!gem.is_on_active_list && isActiveListFull}
                            >
                              {gem.is_on_active_list ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove from Active
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Active
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                handleDeleteGem(gem.id)
                              }}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Gem form modal */}
      <GemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onGemCreated={handleGemCreated}
        currentGemCount={gemCount}
      />

      {/* Extract gems modal */}
      <ExtractGemsModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        onGemsCreated={handleGemsExtracted}
        activeGemCount={gemCount}
        hasAIConsent={hasAIConsent}
      />

      {/* Moment FAB */}
      <MomentFAB />
    </LayoutShell>
  )
}
