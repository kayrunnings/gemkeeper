"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Thought } from "@/lib/types/thought"
import { Context } from "@/lib/types/context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThoughtForm } from "@/components/thought-form"
import { ExtractThoughtsModal } from "@/components/extract-thoughts-modal"
import {
  Lightbulb,
  Zap,
  Loader2,
  Quote,
  Plus,
  Sparkles,
  ListChecks,
  CircleDashed,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SortOrder = "desc" | "asc"
type FilterType = "all" | "active" | "passive"

interface LibraryThoughtsTabProps {
  selectedContextId: string | null
  contexts: Context[]
  searchQuery?: string
  sortOrder?: SortOrder
}

export function LibraryThoughtsTab({
  selectedContextId,
  contexts,
  searchQuery,
  sortOrder = "desc",
}: LibraryThoughtsTabProps) {
  const router = useRouter()
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [hasAIConsent, setHasAIConsent] = useState(false)

  const limit = 20

  useEffect(() => {
    setOffset(0)
    loadThoughts(true)
  }, [selectedContextId, searchQuery, sortOrder, selectedFilter])

  async function loadThoughts(reset = false) {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    // Load AI consent status
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_consent_given")
      .eq("id", user.id)
      .single()

    setHasAIConsent(profile?.ai_consent_given ?? false)

    const currentOffset = reset ? 0 : offset

    let query = supabase
      .from("gems")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: sortOrder === "asc" })
      .range(currentOffset, currentOffset + limit - 1)

    // Apply status filter
    if (selectedFilter === "active") {
      query = query.eq("is_on_active_list", true).in("status", ["active", "passive"])
    } else if (selectedFilter === "passive") {
      query = query.eq("is_on_active_list", false).in("status", ["active", "passive"])
    } else {
      query = query.in("status", ["active", "passive"])
    }

    if (selectedContextId) {
      query = query.eq("context_id", selectedContextId)
    }

    if (searchQuery) {
      query = query.or(
        `content.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading thoughts:", error)
      setIsLoading(false)
      return
    }

    if (reset) {
      setThoughts(data || [])
    } else {
      setThoughts((prev) => [...prev, ...(data || [])])
    }

    setHasMore((data || []).length >= limit)
    setOffset(currentOffset + limit)
    setIsLoading(false)
  }

  // Calculate counts for filters
  const thoughtCounts = useMemo(() => {
    return {
      all: thoughts.length,
      active: thoughts.filter(t => t.is_on_active_list).length,
      passive: thoughts.filter(t => !t.is_on_active_list).length,
    }
  }, [thoughts])

  // Filter thoughts based on selected filter (client-side for responsiveness after initial load)
  const filteredThoughts = useMemo(() => {
    let filtered = thoughts

    if (selectedFilter === "active") {
      filtered = filtered.filter(t => t.is_on_active_list)
    } else if (selectedFilter === "passive") {
      filtered = filtered.filter(t => !t.is_on_active_list)
    }

    return filtered
  }, [thoughts, selectedFilter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    })
  }

  const getContext = (contextId: string | null) => {
    if (!contextId) return null
    return contexts.find((c) => c.id === contextId)
  }

  const getFilterTitle = () => {
    switch (selectedFilter) {
      case "active":
        return "Active List"
      case "passive":
        return "Passive Thoughts"
      default:
        return "All Thoughts"
    }
  }

  const handleThoughtCreated = () => {
    setIsAddModalOpen(false)
    loadThoughts(true)
  }

  const handleThoughtsExtracted = () => {
    setIsExtractModalOpen(false)
    loadThoughts(true)
  }

  if (isLoading && thoughts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-4 space-y-1">
            {/* All Thoughts */}
            <button
              onClick={() => setSelectedFilter("all")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                selectedFilter === "all"
                  ? "glass-button-primary text-primary-foreground shadow-sm"
                  : "hover:bg-[var(--glass-hover-bg)] text-foreground"
              )}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="flex-1">All Thoughts</span>
              <span className="text-xs opacity-70">{thoughtCounts.all}</span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-[var(--glass-sidebar-border)]" />

            {/* Status section header */}
            <div className="px-3 py-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Status
              </span>
            </div>

            {/* Active List */}
            <button
              onClick={() => setSelectedFilter("active")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                selectedFilter === "active"
                  ? "glass-button-primary text-primary-foreground shadow-sm"
                  : "hover:bg-[var(--glass-hover-bg)] text-foreground"
              )}
            >
              <ListChecks className="h-4 w-4" />
              <span className="flex-1">Active List</span>
              <span className="text-xs opacity-70">{thoughtCounts.active}</span>
            </button>

            {/* Passive */}
            <button
              onClick={() => setSelectedFilter("passive")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                selectedFilter === "passive"
                  ? "glass-button-primary text-primary-foreground shadow-sm"
                  : "hover:bg-[var(--glass-hover-bg)] text-foreground"
              )}
            >
              <CircleDashed className="h-4 w-4" />
              <span className="flex-1">Passive</span>
              <span className="text-xs opacity-70">{thoughtCounts.passive}</span>
            </button>
          </div>
        </aside>

        {/* Thoughts Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">{getFilterTitle()}</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsExtractModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Extract with AI
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Thought
              </Button>
            </div>
          </div>

          {/* Mobile filter selector */}
          <div className="md:hidden mb-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
              className="w-full h-10 rounded-xl glass-input px-3 text-sm"
            >
              <option value="all">All Thoughts ({thoughtCounts.all})</option>
              <option value="active">Active List ({thoughtCounts.active})</option>
              <option value="passive">Passive ({thoughtCounts.passive})</option>
            </select>
          </div>

          {/* Thought count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredThoughts.length} thought{filteredThoughts.length !== 1 ? "s" : ""}
            {selectedContextId && " in this context"}
          </p>

          {/* Thoughts List */}
          {filteredThoughts.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No thoughts found"
                  : selectedContextId
                  ? "No thoughts in this context"
                  : selectedFilter === "active"
                  ? "No thoughts on your Active List yet"
                  : selectedFilter === "passive"
                  ? "No passive thoughts"
                  : "No thoughts yet. Start capturing your insights!"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Thought
                </Button>
                <Button variant="outline" onClick={() => setIsExtractModalOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract with AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThoughts.map((thought) => {
                const context = getContext(thought.context_id)

                return (
                  <Link key={thought.id} href={`/thoughts/${thought.id}`}>
                    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                            <Quote className="h-5 w-5 text-violet-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <p className="text-foreground line-clamp-3 group-hover:text-primary transition-colors">
                                &ldquo;{thought.content}&rdquo;
                              </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              {thought.source && (
                                <>
                                  <span className="font-medium">{thought.source}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatDate(thought.updated_at)}</span>
                              <span>•</span>
                              <span>{thought.application_count} applications</span>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              {thought.is_on_active_list && (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-600"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Active List
                                </Badge>
                              )}
                              {context ? (
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: context.color || undefined,
                                    color: context.color || undefined,
                                  }}
                                >
                                  {context.name}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground border-muted-foreground/50"
                                >
                                  Uncategorized
                                </Badge>
                              )}
                              {thought.status === "graduated" && (
                                <Badge variant="secondary" className="text-green-600">
                                  Graduated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => loadThoughts(false)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Thought Modal */}
      <ThoughtForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onThoughtCreated={handleThoughtCreated}
      />

      {/* Extract with AI Modal */}
      <ExtractThoughtsModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        onThoughtsCreated={handleThoughtsExtracted}
        hasAIConsent={hasAIConsent}
      />
    </>
  )
}
