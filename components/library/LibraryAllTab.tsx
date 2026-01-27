"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Thought } from "@/lib/types/thought"
import { Note } from "@/lib/types"
import { Source } from "@/lib/types/source"
import { Context } from "@/lib/types/context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gem, StickyNote, BookOpen, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SOURCE_TYPE_ICONS } from "@/lib/types/source"

interface LibraryItem {
  id: string
  type: "thought" | "note" | "source"
  title: string
  subtitle?: string
  context?: Context | null
  isOnActiveList?: boolean
  sourceType?: Source["type"]
  updatedAt: string
}

type SortOrder = "desc" | "asc"

interface LibraryAllTabProps {
  selectedContextId: string | null
  contexts: Context[]
  searchQuery?: string
  sortOrder?: SortOrder
}

const typeConfig = {
  thought: {
    icon: Gem,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    href: (id: string) => `/thoughts/${id}`,
  },
  note: {
    icon: StickyNote,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    href: (id: string) => `/dashboard?note=${id}`,
  },
  source: {
    icon: BookOpen,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    href: (id: string) => `/library/sources/${id}`,
  },
}

export function LibraryAllTab({
  selectedContextId,
  contexts,
  searchQuery,
  sortOrder = "desc",
}: LibraryAllTabProps) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    setOffset(0)
    loadItems(true)
  }, [selectedContextId, searchQuery, sortOrder])

  async function loadItems(reset = false) {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const currentOffset = reset ? 0 : offset
    const newItems: LibraryItem[] = []

    // Fetch thoughts
    let thoughtsQuery = supabase
      .from("gems")
      .select("id, content, source, context_id, is_on_active_list, updated_at")
      .eq("user_id", user.id)
      .neq("status", "retired")
      .order("updated_at", { ascending: sortOrder === "asc" })
      .range(currentOffset, currentOffset + limit - 1)

    if (selectedContextId) {
      thoughtsQuery = thoughtsQuery.eq("context_id", selectedContextId)
    }

    if (searchQuery) {
      thoughtsQuery = thoughtsQuery.or(
        `content.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`
      )
    }

    // Fetch notes (not filtered by context)
    let notesQuery = supabase
      .from("notes")
      .select("id, title, content, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: sortOrder === "asc" })
      .range(currentOffset, currentOffset + limit - 1)

    if (searchQuery) {
      notesQuery = notesQuery.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
      )
    }

    // Fetch sources (not filtered by context)
    let sourcesQuery = supabase
      .from("sources")
      .select("id, name, author, type, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: sortOrder === "asc" })
      .range(currentOffset, currentOffset + limit - 1)

    if (searchQuery) {
      sourcesQuery = sourcesQuery.or(
        `name.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`
      )
    }

    const [thoughtsResult, notesResult, sourcesResult] = await Promise.all([
      thoughtsQuery,
      selectedContextId ? Promise.resolve({ data: [] }) : notesQuery,
      selectedContextId ? Promise.resolve({ data: [] }) : sourcesQuery,
    ])

    // Add thoughts
    if (thoughtsResult.data) {
      for (const thought of thoughtsResult.data) {
        const context = contexts.find((c) => c.id === thought.context_id)
        newItems.push({
          id: thought.id,
          type: "thought",
          title: thought.content,
          subtitle: thought.source || undefined,
          context: context || null,
          isOnActiveList: thought.is_on_active_list,
          updatedAt: thought.updated_at,
        })
      }
    }

    // Add notes
    if (notesResult.data) {
      for (const note of notesResult.data) {
        newItems.push({
          id: note.id,
          type: "note",
          title: note.title || "Untitled Note",
          subtitle: note.content?.substring(0, 100) || undefined,
          context: null,
          updatedAt: note.updated_at,
        })
      }
    }

    // Add sources
    if (sourcesResult.data) {
      for (const source of sourcesResult.data) {
        newItems.push({
          id: source.id,
          type: "source",
          title: source.name,
          subtitle: source.author || undefined,
          context: null,
          sourceType: source.type,
          updatedAt: source.updated_at,
        })
      }
    }

    // Sort by updated_at
    newItems.sort((a, b) => {
      const diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return sortOrder === "asc" ? diff : -diff
    })

    if (reset) {
      setItems(newItems)
    } else {
      setItems((prev) => [...prev, ...newItems])
    }

    setHasMore(newItems.length >= limit)
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

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery
            ? "No results found"
            : selectedContextId
            ? "No items in this context"
            : "Your library is empty. Start by adding some thoughts!"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const config = typeConfig[item.type]
        const Icon = config.icon

        return (
          <Link key={`${item.type}-${item.id}`} href={config.href(item.id)}>
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="p-4 flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    config.bgColor
                  )}
                >
                  {item.type === "source" && item.sourceType ? (
                    <span className="text-lg">
                      {SOURCE_TYPE_ICONS[item.sourceType]}
                    </span>
                  ) : (
                    <Icon className={cn("h-5 w-5", config.color)} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <p className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    {item.isOnActiveList && (
                      <Badge
                        variant="outline"
                        className="shrink-0 text-amber-600 border-amber-600"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="capitalize">{item.type}</span>
                    <span>•</span>
                    <span>{formatDate(item.updatedAt)}</span>
                    {item.subtitle && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">
                          {item.subtitle}
                        </span>
                      </>
                    )}
                    {item.type === "thought" && (
                      item.context ? (
                        <Badge
                          variant="outline"
                          className="ml-2"
                          style={{
                            borderColor: item.context.color || undefined,
                            color: item.context.color || undefined,
                          }}
                        >
                          {item.context.name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="ml-2 text-muted-foreground border-muted-foreground/50"
                        >
                          Uncategorized
                        </Badge>
                      )
                    )}
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
            onClick={() => loadItems(false)}
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
