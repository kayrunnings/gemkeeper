"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, TrendingUp, Compass, BookOpen, Brain, Heart, Briefcase, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextChip } from "./ContextChip"
import { DiscoveryGrid } from "./DiscoveryGrid"
import type { ContextWithCount } from "@/lib/types/context"
import type { Discovery } from "@/lib/types/discovery"

interface ExploreTabProps {
  contexts: ContextWithCount[]
  className?: string
}

// Suggested topics for exploration
const EXPLORE_TOPICS = [
  { label: "Productivity", icon: Lightbulb, query: "productivity and time management tips" },
  { label: "Leadership", icon: Briefcase, query: "leadership and management wisdom" },
  { label: "Mindfulness", icon: Brain, query: "mindfulness and mental clarity" },
  { label: "Communication", icon: Heart, query: "effective communication and relationships" },
  { label: "Learning", icon: BookOpen, query: "learning strategies and knowledge retention" },
  { label: "Creativity", icon: Compass, query: "creativity and innovation techniques" },
]

export function ExploreTab({ contexts, className }: ExploreTabProps) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [showGrid, setShowGrid] = useState(false)
  const [searchedQuery, setSearchedQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setSearchedQuery(searchQuery)

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "directed",
          query: searchQuery.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to explore this topic")
        return
      }

      setDiscoveries(data.discoveries || [])
      setShowGrid(true)
    } catch (err) {
      console.error("Explore error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContextExplore = async (context: ContextWithCount) => {
    setIsLoading(true)
    setError(null)
    setSearchedQuery(context.name)

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "curated",
          context_id: context.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to explore this context")
        return
      }

      setDiscoveries(data.discoveries || [])
      setShowGrid(true)
    } catch (err) {
      console.error("Explore error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDone = () => {
    setShowGrid(false)
    setDiscoveries([])
    setQuery("")
    setSearchedQuery("")
  }

  const handleDiscoveryUpdate = (updatedDiscovery: Discovery) => {
    setDiscoveries((prev) =>
      prev.map((d) => (d.id === updatedDiscovery.id ? updatedDiscovery : d))
    )
  }

  // Show grid if we have discoveries
  if (showGrid && discoveries.length > 0) {
    return (
      <DiscoveryGrid
        discoveries={discoveries}
        sessionType="directed"
        query={searchedQuery}
        contexts={contexts}
        onDone={handleDone}
        onDiscoveryUpdate={handleDiscoveryUpdate}
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Explore any topic..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              disabled={isLoading}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => handleSearch(query)}
            disabled={isLoading || !query.trim()}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Explore"
            )}
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Trending Topics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Popular Topics</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {EXPLORE_TOPICS.map((topic) => (
            <button
              key={topic.label}
              onClick={() => handleSearch(topic.query)}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border",
                "bg-card hover:bg-secondary/50 transition-colors",
                "text-left text-sm",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <topic.icon className="h-4 w-4 text-primary" />
              <span>{topic.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Browse by Context */}
      {contexts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Browse by your contexts:</p>
          <div className="flex flex-wrap gap-2">
            {contexts.map((context) => (
              <ContextChip
                key={context.id}
                context={context}
                onClick={() => handleContextExplore(context)}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty results state */}
      {showGrid && discoveries.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No discoveries found for this topic.</p>
          <Button variant="link" onClick={handleDone} className="mt-2">
            Try a different search
          </Button>
        </div>
      )}
    </div>
  )
}
