"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Source } from "@/lib/types/source"
import { SourceCard } from "./SourceCard"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2 } from "lucide-react"

type SortOrder = "desc" | "asc"

interface LibrarySourcesTabProps {
  searchQuery?: string
  sortOrder?: SortOrder
}

export function LibrarySourcesTab({ searchQuery, sortOrder = "desc" }: LibrarySourcesTabProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [linkedThoughtsCounts, setLinkedThoughtsCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    setOffset(0)
    loadSources(true)
  }, [searchQuery, sortOrder])

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

  if (isLoading && sources.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-2">
          {searchQuery ? "No sources found" : "No sources yet."}
        </p>
        <p className="text-sm text-muted-foreground">
          Sources are automatically created when you extract thoughts from URLs or add book references.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
    </div>
  )
}
