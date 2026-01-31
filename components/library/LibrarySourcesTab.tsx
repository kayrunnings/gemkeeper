"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Source, SourceStatus, SOURCE_STATUS_LABELS, SOURCE_STATUS_ICONS } from "@/lib/types/source"
import { SourceCard } from "./SourceCard"
import { AddSourceModal } from "@/components/sources/AddSourceModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Loader2, Plus, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"

type SortOrder = "desc" | "asc"
type StatusFilter = "all" | SourceStatus

interface LibrarySourcesTabProps {
  searchQuery?: string
  sortOrder?: SortOrder
}

export function LibrarySourcesTab({ searchQuery, sortOrder = "desc" }: LibrarySourcesTabProps) {
  const router = useRouter()
  const [sources, setSources] = useState<Source[]>([])
  const [linkedThoughtsCounts, setLinkedThoughtsCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const limit = 20

  useEffect(() => {
    setOffset(0)
    loadSources(true)
  }, [searchQuery, sortOrder, statusFilter])

  async function loadSources(reset = false) {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const currentOffset = reset ? 0 : offset

    let query = supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: sortOrder === "asc" })
      .range(currentOffset, currentOffset + limit - 1)

    // Apply status filter
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading sources:", error)
      setIsLoading(false)
      return
    }

    // Get linked thoughts counts
    if (data && data.length > 0) {
      const sourceIds = data.map((s) => s.id)
      const { data: gems } = await supabase
        .from("gems")
        .select("source_id")
        .in("source_id", sourceIds)

      if (gems) {
        const counts: Record<string, number> = {}
        for (const gem of gems) {
          if (gem.source_id) {
            counts[gem.source_id] = (counts[gem.source_id] || 0) + 1
          }
        }
        setLinkedThoughtsCounts((prev) => ({ ...prev, ...counts }))
      }
    }

    if (reset) {
      setSources(data || [])
    } else {
      setSources((prev) => [...prev, ...(data || [])])
    }

    setHasMore((data || []).length >= limit)
    setOffset(currentOffset + limit)
    setIsLoading(false)
  }

  // Calculate counts for status filters
  const statusCounts = useMemo(() => {
    return {
      all: sources.length,
      want_to_read: sources.filter(s => s.status === "want_to_read").length,
      reading: sources.filter(s => s.status === "reading").length,
      completed: sources.filter(s => s.status === "completed").length,
      archived: sources.filter(s => s.status === "archived").length,
    }
  }, [sources])

  const statusFilters: { value: StatusFilter; label: string; icon?: string }[] = [
    { value: "all", label: "All" },
    { value: "want_to_read", label: "Want to Read", icon: SOURCE_STATUS_ICONS.want_to_read },
    { value: "reading", label: "Reading", icon: SOURCE_STATUS_ICONS.reading },
    { value: "completed", label: "Completed", icon: SOURCE_STATUS_ICONS.completed },
    { value: "archived", label: "Archived", icon: SOURCE_STATUS_ICONS.archived },
  ]

  const handleSourceCreated = (sourceId: string) => {
    // Reload sources after creation
    loadSources(true)
    // Navigate to the new source
    router.push(`/library/sources/${sourceId}`)
  }

  if (isLoading && sources.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sources.length === 0 && statusFilter === "all") {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-2">
          {searchQuery ? "No sources found" : "No sources yet."}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Sources are automatically created when you extract thoughts from URLs or add book references.
        </p>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Source
        </Button>

        <AddSourceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSourceCreated={handleSourceCreated}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and Add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "gap-1.5 whitespace-nowrap",
                statusFilter === filter.value && "shadow-sm"
              )}
            >
              {filter.icon && <span>{filter.icon}</span>}
              {filter.label}
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 h-5 px-1.5",
                  statusFilter === filter.value && "bg-primary-foreground/20 text-primary-foreground"
                )}
              >
                {statusCounts[filter.value]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Add Source button */}
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Empty state for filtered view */}
      {sources.length === 0 && statusFilter !== "all" && (
        <div className="text-center py-12">
          <ListFilter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            No sources with status &ldquo;{SOURCE_STATUS_LABELS[statusFilter as SourceStatus]}&rdquo;
          </p>
        </div>
      )}

      {/* Sources grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            linkedThoughtsCount={linkedThoughtsCounts[source.id] || 0}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => loadSources(false)}
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

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSourceCreated={handleSourceCreated}
      />
    </div>
  )
}
