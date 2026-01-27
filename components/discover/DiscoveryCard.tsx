"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Check, X, Bookmark, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Discovery } from "@/lib/types/discovery"
import type { ContextWithCount } from "@/lib/types/context"

interface DiscoveryCardProps {
  discovery: Discovery
  contexts: ContextWithCount[]
  onClick?: () => void
  onBookmarkChange?: (discovery: Discovery) => void
  showBookmark?: boolean
  className?: string
}

export function DiscoveryCard({
  discovery,
  contexts,
  onClick,
  onBookmarkChange,
  showBookmark = true,
  className,
}: DiscoveryCardProps) {
  const [isBookmarking, setIsBookmarking] = useState(false)

  const suggestedContext = contexts.find((c) => c.id === discovery.suggested_context_id)
  const isSaved = discovery.status === "saved"
  const isSkipped = discovery.status === "skipped"
  const isProcessed = isSaved || isSkipped
  const isBookmarked = !!discovery.saved_at

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (isBookmarking) return

    setIsBookmarking(true)
    try {
      const method = isBookmarked ? "DELETE" : "POST"
      const response = await fetch("/api/discover/bookmark", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discovery_id: discovery.id }),
      })

      if (response.ok) {
        const data = await response.json()
        if (onBookmarkChange && data.discovery) {
          onBookmarkChange(data.discovery)
        }
      }
    } catch (error) {
      console.error("Bookmark error:", error)
    } finally {
      setIsBookmarking(false)
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md relative",
        isProcessed && "opacity-60",
        isSkipped && "bg-muted/30",
        className
      )}
      onClick={!isProcessed ? onClick : undefined}
    >
      <CardContent className="p-4">
        {/* Bookmark button */}
        {showBookmark && !isProcessed && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 h-8 w-8",
              isBookmarked && "text-primary"
            )}
            onClick={handleBookmarkClick}
            disabled={isBookmarking}
          >
            {isBookmarking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            )}
          </Button>
        )}

        {/* Status badge */}
        {isSaved && (
          <Badge variant="default" className="mb-2 gap-1 bg-green-600">
            <Check className="h-3 w-3" />
            Saved
          </Badge>
        )}
        {isSkipped && (
          <Badge variant="secondary" className="mb-2 gap-1">
            <X className="h-3 w-3" />
            Skipped
          </Badge>
        )}

        {/* Context badge */}
        {suggestedContext && !isProcessed && (
          <Badge
            variant="outline"
            className="mb-2 border-2"
            style={{
              borderColor: suggestedContext.color || "#6B7280",
              color: suggestedContext.color || "#6B7280",
            }}
          >
            {suggestedContext.name}
          </Badge>
        )}

        {/* Thought content */}
        <p className={cn(
          "text-sm font-medium line-clamp-3 mb-2 pr-8",
          isProcessed && "text-muted-foreground"
        )}>
          {discovery.thought_content}
        </p>

        {/* Source and content type */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[60%]">{discovery.source_title}</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              discovery.content_type === "trending" && "bg-orange-100 text-orange-800",
              discovery.content_type === "evergreen" && "bg-green-100 text-green-800"
            )}
          >
            {discovery.content_type}
          </Badge>
        </div>

        {/* View button */}
        {!isProcessed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs"
          >
            View & Save
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
