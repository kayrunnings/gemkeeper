"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sparkle, MagnifyingGlass, Shuffle, BookOpen, Headphones, TrendUp, Lightbulb, Brain, ChatCircleDots, Star } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { HomeQuadrant } from "./HomeQuadrant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ContextWithCount } from "@/lib/types/context"

interface Suggestion {
  id: string
  title: string
  source: string
  type: "article" | "podcast" | "video" | "research"
}

// Fallback trending topics when user has no contexts
const FALLBACK_TOPICS = [
  { id: "productivity", label: "Productivity", query: "productivity tips", icon: Lightbulb },
  { id: "mindfulness", label: "Mindfulness", query: "mindfulness practices", icon: Brain },
  { id: "communication", label: "Communication", query: "effective communication", icon: ChatCircleDots },
]

interface GrowQuadrantProps {
  contexts: ContextWithCount[]
  suggestions?: Suggestion[]
  onDiscoverTopic?: (topic: string) => void
  onDiscoverContext?: (contextId: string) => void
  onSurpriseMe?: () => void
  className?: string
}

export function GrowQuadrant({
  contexts,
  suggestions = [],
  onDiscoverTopic,
  onDiscoverContext,
  onSurpriseMe,
  className,
}: GrowQuadrantProps) {
  const router = useRouter()
  const [searchTopic, setSearchTopic] = useState("")

  // Generate personalized trending topics based on user's contexts
  // Uses contexts with the most content (highest count) for relevance
  const trendingTopics = useMemo(() => {
    if (contexts.length === 0) {
      return FALLBACK_TOPICS
    }

    // Sort contexts by thought_count (most active first) and take top 3
    const topContexts = [...contexts]
      .sort((a, b) => (b.thought_count || 0) - (a.thought_count || 0))
      .slice(0, 3)

    return topContexts.map((context) => ({
      id: context.id,
      label: context.name,
      query: `latest insights and tips about ${context.name.toLowerCase()}`,
      icon: Star, // Use Star icon for personalized topics
      isPersonalized: true,
    }))
  }, [contexts])

  const handleSearch = useCallback(() => {
    if (searchTopic.trim()) {
      onDiscoverTopic?.(searchTopic.trim())
    }
  }, [searchTopic, onDiscoverTopic])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch()
      }
    },
    [handleSearch]
  )

  const getTypeIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "podcast":
        return <Headphones className="w-4 h-4" />
      case "article":
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <HomeQuadrant
      variant="grow"
      icon={<Sparkle weight="fill" />}
      title="Grow"
      stat={
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gradient-to-r from-[var(--ai-gradient-start)] to-[var(--ai-gradient-end)] text-white">
          AI Discovery
        </span>
      }
      footer={
        <button
          onClick={() => router.push("/discover")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          Explore more <span>→</span>
        </button>
      }
      className={className}
    >
      {/* Search input */}
      <div className="flex gap-2 mb-3.5">
        <Input
          value={searchTopic}
          onChange={(e) => setSearchTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Explore a topic..."
          className={cn(
            "flex-1 h-9 text-sm",
            "bg-[var(--glass-input-bg)] border-[var(--glass-input-border)]",
            "focus:border-ring focus:ring-2 focus:ring-orange-500/10"
          )}
        />
        <Button
          onClick={handleSearch}
          disabled={!searchTopic.trim()}
          className={cn(
            "h-9 px-3.5 text-sm font-medium",
            "bg-gradient-to-r from-[var(--ai-gradient-start)] to-[var(--ai-gradient-end)]",
            "text-white hover:brightness-110 hover:-translate-y-px transition-all"
          )}
        >
          Discover
        </Button>
      </div>

      {/* Context chips */}
      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {contexts.slice(0, 4).map((context) => (
          <button
            key={context.id}
            onClick={() => onDiscoverContext?.(context.id)}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full",
              "bg-[var(--glass-card-bg)] border border-[var(--glass-card-border)]",
              "text-muted-foreground cursor-pointer transition-all",
              "hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-primary"
            )}
          >
            {context.name}
          </button>
        ))}
      </div>

      {/* AI Suggestions or Trending Topics */}
      {suggestions.length > 0 ? (
        <div className="space-y-2 mb-2">
          {suggestions.slice(0, 2).map((suggestion) => (
            <div
              key={suggestion.id}
              className={cn(
                "flex items-start gap-2.5 p-2.5",
                "bg-[var(--glass-input-bg)] rounded-[calc(var(--radius)-2px)]",
                "border border-transparent cursor-pointer transition-all",
                "hover:border-[var(--glass-card-border)] hover:bg-[var(--glass-hover-bg)]"
              )}
            >
              <span className="w-7 h-7 flex items-center justify-center bg-[var(--glass-card-bg)] rounded-md flex-shrink-0 text-muted-foreground">
                {getTypeIcon(suggestion.type)}
              </span>
              <div>
                <div className="text-sm text-foreground font-medium">
                  {suggestion.title}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {suggestion.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            {contexts.length > 0 ? (
              <>
                <Star className="w-3 h-3" />
                <span>For You</span>
              </>
            ) : (
              <>
                <TrendUp className="w-3 h-3" />
                <span>Trending</span>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            {trendingTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onDiscoverTopic?.(topic.query)}
                className={cn(
                  "flex items-center gap-2.5 w-full p-2",
                  "bg-[var(--glass-input-bg)] rounded-[calc(var(--radius)-2px)]",
                  "border border-transparent cursor-pointer transition-all",
                  "hover:border-[var(--glass-card-border)] hover:bg-[var(--glass-hover-bg)]",
                  "text-left"
                )}
              >
                <span className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-blue-500/10 rounded text-orange-500">
                  <topic.icon weight="fill" className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs text-foreground">{topic.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Surprise me button */}
      <button
        onClick={onSurpriseMe}
        className={cn(
          "flex items-center justify-center gap-1.5 w-full py-2.5 mt-2",
          "bg-gradient-to-r from-orange-500/10 to-blue-500/10",
          "border border-dashed border-orange-500/30 rounded-[calc(var(--radius)-2px)]",
          "text-primary text-xs font-medium cursor-pointer transition-all",
          "hover:from-orange-500/20 hover:to-blue-500/15 hover:border-orange-500/50 hover:-translate-y-px"
        )}
      >
        <Shuffle className="w-3.5 h-3.5" />
        <span>Surprise me with something new</span>
      </button>
    </HomeQuadrant>
  )
}
