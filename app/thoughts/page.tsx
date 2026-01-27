"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Thought, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/thought"
import { MAX_ACTIVE_LIST } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { ThoughtForm } from "@/components/thought-form"
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
import { Plus, Lightbulb, MoreHorizontal, Trash2, CheckCircle, Sparkles, AlertCircle, Star, StarOff } from "lucide-react"
import { ExtractThoughtsModal } from "@/components/extract-thoughts-modal"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"
import { toggleActiveList, getActiveListCount } from "@/lib/thoughts"
import { getContexts } from "@/lib/contexts"

// Filter types
type ActiveFilter = "all" | "active" | "passive"

// Map context tags to badge variants (legacy)
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

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hasAIConsent, setHasAIConsent] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [activeListCount, setActiveListCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  // Fetch thoughts and user on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserEmail(user.email ?? null)

        // Fetch active and passive thoughts (not retired/graduated)
        const { data, error } = await supabase
          .from("gems")
          .select("*")
          .in("status", ["active", "passive"])
          .order("created_at", { ascending: false })

        if (error) {
          showError(error, "Failed to load thoughts")
        } else {
          setThoughts(data || [])
        }

        // Fetch profile for AI consent status
        const { data: profile } = await supabase
          .from("profiles")
          .select("ai_consent_given")
          .eq("id", user.id)
          .single()

        setHasAIConsent(profile?.ai_consent_given ?? false)

        // Fetch contexts for colors
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

  const handleThoughtCreated = (thought: Thought) => {
    setThoughts((prev) => [thought, ...prev])
    setIsFormOpen(false)
    showSuccess("Thought added!", "Your wisdom has been captured.")
  }

  const handleThoughtsExtracted = async () => {
    // Refresh thoughts list after extraction (active and passive, not retired/graduated)
    const { data } = await supabase
      .from("gems")
      .select("*")
      .in("status", ["active", "passive"])
      .order("created_at", { ascending: false })

    if (data) {
      setThoughts(data)
    }
    // Refresh active list count
    const { count } = await getActiveListCount()
    setActiveListCount(count)

    setIsExtractModalOpen(false)
    showSuccess("Thoughts extracted!", "AI has found wisdom in your content.")
  }

  const handleDeleteThought = async (thoughtId: string) => {
    if (!window.confirm("Are you sure you want to delete this thought?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("gems")
        .delete()
        .eq("id", thoughtId)

      if (error) {
        showError(error, "Failed to delete thought")
        return
      }

      setThoughts((prev) => prev.filter((thought) => thought.id !== thoughtId))
      // Refresh active list count
      const { count } = await getActiveListCount()
      setActiveListCount(count)
      showSuccess("Thought deleted")
    } catch (err) {
      showError(err, "Failed to delete thought")
    }
  }

  const handleToggleActiveList = async (thoughtId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { thought, error } = await toggleActiveList(thoughtId)
    if (error) {
      showError(error)
      return
    }

    if (thought) {
      setThoughts((prev) =>
        prev.map((t) => (t.id === thoughtId ? { ...t, is_on_active_list: thought.is_on_active_list } : t))
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

  // Filter thoughts based on active filter
  const filteredThoughts = useMemo(() => {
    return thoughts.filter((thought) => {
      if (activeFilter === "active" && !thought.is_on_active_list) return false
      if (activeFilter === "passive" && thought.is_on_active_list) return false
      return true
    })
  }, [thoughts, activeFilter])

  // Get context for a thought - first by ID, then by matching context_tag to slug
  const getContextForThought = (thought: Thought) => {
    // First try to find by context_id
    if (thought.context_id) {
      return contexts.find((c) => c.id === thought.context_id) || null
    }
    // Fall back to matching context_tag to slug
    if (thought.context_tag) {
      return contexts.find((c) => c.slug === thought.context_tag) || null
    }
    return null
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

  const thoughtCount = thoughts.length

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
            <p className="text-muted-foreground mt-1">
              {thoughtCount} thought{thoughtCount !== 1 ? "s" : ""} &bull; Active: {activeListCount}/{MAX_ACTIVE_LIST}
            </p>
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

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeFilter === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All ({thoughts.length})
          </button>
          <button
            onClick={() => setActiveFilter("active")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeFilter === "active"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Active ({thoughts.filter(t => t.is_on_active_list).length})
          </button>
          <button
            onClick={() => setActiveFilter("passive")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeFilter === "passive"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Passive ({thoughts.filter(t => !t.is_on_active_list).length})
          </button>
        </div>

        {/* Active List limit warning */}
        {activeListCount >= MAX_ACTIVE_LIST && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning mb-6">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Active List is full ({MAX_ACTIVE_LIST}/{MAX_ACTIVE_LIST})</p>
              <p className="text-sm opacity-80 mt-0.5">
                Remove a thought from the Active List to add another.
              </p>
            </div>
          </div>
        )}

        {/* Thoughts grid */}
        {filteredThoughts.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {activeFilter === "all" ? "No thoughts yet" : `No ${activeFilter} thoughts`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {activeFilter === "all"
                  ? "Capture wisdom, insights, and advice that you want to remember and apply in your life."
                  : activeFilter === "active"
                  ? "Add thoughts to your Active List to see them in daily prompts."
                  : "All your thoughts are on the Active List."}
              </p>
              {activeFilter === "all" && (
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
            {filteredThoughts.map((thought) => {
              const context = getContextForThought(thought)
              return (
                <Link key={thought.id} href={`/thoughts/${thought.id}`}>
                  <Card className="group relative cursor-pointer card-hover h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Context badge - use context color if available */}
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
                            <Badge variant={contextTagVariant[thought.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                              {thought.context_tag === "other" && thought.custom_context
                                ? thought.custom_context
                                : CONTEXT_TAG_LABELS[thought.context_tag]}
                            </Badge>
                          )}
                          {/* Active List indicator */}
                          {thought.is_on_active_list && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(thought.created_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {truncateContent(thought.content)}
                      </p>

                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        {thought.source && (
                          <span className="truncate max-w-[150px]" title={thought.source}>
                            {thought.source}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                          {thought.application_count} {thought.application_count === 1 ? "application" : "applications"}
                        </span>
                      </div>

                      {/* Actions area */}
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.preventDefault()}
                      >
                        {/* Active List toggle button */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "h-8 w-8 bg-card/80 backdrop-blur-sm",
                            thought.is_on_active_list && "text-primary"
                          )}
                          onClick={(e) => handleToggleActiveList(thought.id, e)}
                          title={thought.is_on_active_list ? "Remove from Active List" : "Add to Active List"}
                        >
                          {thought.is_on_active_list ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        {/* More actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8 bg-card/80 backdrop-blur-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                handleToggleActiveList(thought.id, e)
                              }}
                            >
                              {thought.is_on_active_list ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove from Active List
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Active List
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                handleDeleteThought(thought.id)
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

      {/* Thought form modal */}
      <ThoughtForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onThoughtCreated={handleThoughtCreated}
      />

      {/* Extract thoughts modal */}
      <ExtractThoughtsModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        onThoughtsCreated={handleThoughtsExtracted}
        hasAIConsent={hasAIConsent}
      />

    </LayoutShell>
  )
}
