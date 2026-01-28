"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Thought } from "@/lib/types/thought"
import { Context } from "@/lib/types/context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gem, Zap, Loader2, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

type SortOrder = "desc" | "asc"

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
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    setOffset(0)
    loadThoughts(true)
  }, [selectedContextId, searchQuery, sortOrder])

  async function loadThoughts(reset = false) {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const currentOffset = reset ? 0 : offset

    let query = supabase
      .from("gems")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])
      .order("updated_at", { ascending: sortOrder === "asc" })
      .range(currentOffset, currentOffset + limit - 1)

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

  if (isLoading && thoughts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (thoughts.length === 0) {
    return (
      <div className="text-center py-12">
        <Gem className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {searchQuery
            ? "No thoughts found"
            : selectedContextId
              ? "No thoughts in this context"
              : "No thoughts yet. Start capturing your insights!"}
        </p>
        <Button asChild className="mt-4">
          <Link href="/thoughts/extract">Add Thought</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {thoughts.map((thought, index) => {
        const context = getContext(thought.context_id)
        const contextName = context?.name?.toLowerCase() || "other"
        const tintClass = `context-tint-${contextName}`

        return (
          <Link key={thought.id} href={`/thoughts/${thought.id}`}>
            <Card
              className={cn(
                "group card-hover-lift cursor-pointer overflow-hidden animate-slide-up",
                `stagger-${Math.min(index + 1, 8)}`
              )}
              style={{ animationFillMode: "backwards" }}
            >
              {/* Context accent bar */}
              {context?.color && (
                <div
                  className="h-1"
                  style={{ background: context.color }}
                />
              )}

              <CardContent className={cn("p-4 relative", tintClass)}>
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      background: context?.color
                        ? `linear-gradient(135deg, ${context.color}30, ${context.color}10)`
                        : "rgba(139, 92, 246, 0.1)"
                    }}
                  >
                    <Quote
                      className="h-5 w-5 transition-colors"
                      style={{ color: context?.color || "#8b5cf6" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-foreground line-clamp-3 group-hover:text-primary transition-colors font-medium">
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

                    <div className="flex items-center gap-2 mt-3">
                      {thought.is_on_active_list && (
                        <Badge
                          variant="outline"
                          className="text-amber-500 border-amber-500/50 bg-amber-500/10"
                        >
                          <Zap className="h-3 w-3 mr-1" fill="currentColor" />
                          Active List
                        </Badge>
                      )}
                      {context ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: `${context.color}50` || undefined,
                            color: context.color || undefined,
                            backgroundColor: `${context.color}10` || undefined,
                          }}
                        >
                          {context.name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground border-muted-foreground/30"
                        >
                          Uncategorized
                        </Badge>
                      )}
                      {thought.status === "graduated" && (
                        <Badge variant="secondary" className="text-green-500 bg-green-500/10">
                          🎓 Graduated
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
  )
}
