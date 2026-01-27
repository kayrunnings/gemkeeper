"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gem, StickyNote, BookOpen, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Context } from "@/lib/types/context"

interface RecentItem {
  id: string
  type: "thought" | "note" | "source"
  title: string
  subtitle?: string
  context?: Context | null
  updatedAt: string
}

interface RecentActivityCardProps {
  className?: string
  contexts: Context[]
  selectedContextId?: string | null
}

const typeConfig = {
  thought: {
    icon: Gem,
    label: "Thought",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    href: (id: string) => `/thoughts/${id}`,
  },
  note: {
    icon: StickyNote,
    label: "Note",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    href: (id: string) => `/dashboard?note=${id}`,
  },
  source: {
    icon: BookOpen,
    label: "Source",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    href: (id: string) => `/library/sources/${id}`,
  },
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function RecentActivityCard({
  className,
  contexts,
  selectedContextId,
}: RecentActivityCardProps) {
  const [items, setItems] = useState<RecentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRecentActivity() {
      setIsLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch recent thoughts
      let thoughtsQuery = supabase
        .from("gems")
        .select("id, content, source, context_id, updated_at")
        .eq("user_id", user.id)
        .neq("status", "retired")
        .order("updated_at", { ascending: false })
        .limit(5)

      if (selectedContextId) {
        thoughtsQuery = thoughtsQuery.eq("context_id", selectedContextId)
      }

      // Fetch recent notes
      const notesQuery = supabase
        .from("notes")
        .select("id, title, content, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)

      // Fetch recent sources (only if not filtering by context)
      const sourcesQuery = selectedContextId
        ? Promise.resolve({ data: [] })
        : supabase
            .from("sources")
            .select("id, name, author, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(5)

      const [thoughtsResult, notesResult, sourcesResult] = await Promise.all([
        thoughtsQuery,
        notesQuery,
        sourcesQuery,
      ])

      const recentItems: RecentItem[] = []

      // Add thoughts
      if (thoughtsResult.data) {
        for (const thought of thoughtsResult.data) {
          const context = contexts.find((c) => c.id === thought.context_id)
          recentItems.push({
            id: thought.id,
            type: "thought",
            title: thought.content.length > 60
              ? thought.content.substring(0, 60) + "..."
              : thought.content,
            subtitle: thought.source || undefined,
            context: context || null,
            updatedAt: thought.updated_at,
          })
        }
      }

      // Add notes (only if not filtering by context)
      if (!selectedContextId && notesResult.data) {
        for (const note of notesResult.data) {
          recentItems.push({
            id: note.id,
            type: "note",
            title: note.title || "Untitled Note",
            subtitle: note.content
              ? note.content.substring(0, 50) + "..."
              : undefined,
            context: null,
            updatedAt: note.updated_at,
          })
        }
      }

      // Add sources (only if not filtering by context)
      if (!selectedContextId && sourcesResult.data) {
        for (const source of sourcesResult.data) {
          recentItems.push({
            id: source.id,
            type: "source",
            title: source.name,
            subtitle: source.author || undefined,
            context: null,
            updatedAt: source.updated_at,
          })
        }
      }

      // Sort by updated_at and take top 8
      recentItems.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      setItems(recentItems.slice(0, 8))
      setIsLoading(false)
    }

    loadRecentActivity()
  }, [contexts, selectedContextId])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </div>
          <Link
            href="/library"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No recent activity. Start by adding a thought or note!
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const config = typeConfig[item.type]
              const Icon = config.icon
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={config.href(item.id)}
                  className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      {item.context && (
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0"
                          style={{
                            borderColor: item.context.color || undefined,
                            color: item.context.color || undefined,
                          }}
                        >
                          {item.context.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{config.label}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(item.updatedAt)}</span>
                      {item.subtitle && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.subtitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
