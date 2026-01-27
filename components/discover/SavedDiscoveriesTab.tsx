"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bookmark, ExternalLink, Trash2, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Discovery } from "@/lib/types/discovery"
import type { ContextWithCount } from "@/lib/types/context"

interface SavedDiscoveriesTabProps {
  contexts: ContextWithCount[]
  onExtractThoughts?: (discovery: Discovery) => void
  className?: string
}

export function SavedDiscoveriesTab({
  contexts,
  onExtractThoughts,
  className,
}: SavedDiscoveriesTabProps) {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    loadSavedDiscoveries()
  }, [])

  async function loadSavedDiscoveries() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/discover/saved")
      if (response.ok) {
        const data = await response.json()
        setDiscoveries(data.discoveries || [])
      }
    } catch (error) {
      console.error("Failed to load saved discoveries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (discoveryId: string) => {
    setRemovingId(discoveryId)
    try {
      const response = await fetch("/api/discover/bookmark", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discovery_id: discoveryId }),
      })

      if (response.ok) {
        setDiscoveries((prev) => prev.filter((d) => d.id !== discoveryId))
      }
    } catch (error) {
      console.error("Failed to remove discovery:", error)
    } finally {
      setRemovingId(null)
    }
  }

  const formatSavedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getContext = (discovery: Discovery) => {
    return contexts.find((c) => c.id === discovery.suggested_context_id)
  }

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading saved discoveries...</p>
      </div>
    )
  }

  if (discoveries.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No saved discoveries yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          When you find discoveries you want to process later, click the bookmark icon to save them here.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground">
        {discoveries.length} saved discover{discoveries.length !== 1 ? "ies" : "y"}
      </p>

      <div className="space-y-3">
        {discoveries.map((discovery) => {
          const context = getContext(discovery)
          const isRemoving = removingId === discovery.id

          return (
            <Card key={discovery.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Context badge */}
                    {context && (
                      <Badge
                        variant="outline"
                        className="mb-2 border-2"
                        style={{
                          borderColor: context.color || "#6B7280",
                          color: context.color || "#6B7280",
                        }}
                      >
                        {context.name}
                      </Badge>
                    )}

                    {/* Thought content */}
                    <p className="text-sm font-medium line-clamp-2 mb-2">
                      {discovery.thought_content}
                    </p>

                    {/* Source and date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{discovery.source_title}</span>
                      <span>·</span>
                      <span>Saved {formatSavedDate(discovery.saved_at!)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {onExtractThoughts && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1"
                        onClick={() => onExtractThoughts(discovery)}
                      >
                        <Sparkles className="h-3 w-3" />
                        Extract
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(discovery.id)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Article link */}
                {discovery.source_url && (
                  <a
                    href={discovery.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View original article
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
