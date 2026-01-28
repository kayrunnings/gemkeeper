"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Search, Shuffle, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextChip } from "./ContextChip"
import { DiscoveryGrid } from "./DiscoveryGrid"
import type { ContextWithCount } from "@/lib/types/context"
import type { Discovery, DiscoveryUsage } from "@/lib/types/discovery"

interface DiscoverCardProps {
  contexts: ContextWithCount[]
  className?: string
}

export function DiscoverCard({ contexts, className }: DiscoverCardProps) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [showGrid, setShowGrid] = useState(false)
  const [sessionType, setSessionType] = useState<"curated" | "directed" | null>(null)
  const [usage, setUsage] = useState<DiscoveryUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsBootstrap, setNeedsBootstrap] = useState(false)

  // Fetch usage on mount
  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/discover/usage")
        if (response.ok) {
          const data = await response.json()
          setUsage({
            curated_used: data.curated_used,
            directed_used: data.directed_used,
            curated_remaining: data.curated_remaining,
            directed_remaining: data.directed_remaining,
          })
          setNeedsBootstrap(data.needs_bootstrap)
        }
      } catch (err) {
        console.error("Failed to fetch usage:", err)
      }
    }
    fetchUsage()
  }, [])

  const handleDiscover = async (mode: "curated" | "directed", contextId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          query: mode === "directed" ? query.trim() : undefined,
          context_id: contextId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (typeof data.error === 'string') {
          setError(data.error)
        } else {
          setError("Failed to generate discoveries")
        }
        return
      }

      setDiscoveries(data.discoveries || [])
      setSessionType(mode)
      setShowGrid(true)

      // Update usage
      setUsage({
        curated_used: data.remaining_curated === 0,
        directed_used: data.remaining_directed === 0,
        curated_remaining: data.remaining_curated,
        directed_remaining: data.remaining_directed,
      })
    } catch (err) {
      console.error("Discovery error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      handleDiscover("directed")
    }
  }

  const handleContextClick = (context: ContextWithCount) => {
    handleDiscover("curated", context.id)
  }

  const handleSurpriseMe = () => {
    handleDiscover("curated")
  }

  const handleDone = () => {
    setShowGrid(false)
    setDiscoveries([])
    setSessionType(null)
    setQuery("")
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
        sessionType={sessionType}
        query={query}
        contexts={contexts}
        onDone={handleDone}
        onDiscoveryUpdate={handleDiscoveryUpdate}
        className={className}
      />
    )
  }

  const bothSessionsUsed = usage?.curated_used && usage?.directed_used
  const curatedDisabled = usage?.curated_used || isLoading
  const directedDisabled = usage?.directed_used || isLoading

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Discover Something New!</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Both sessions used state */}
        {bothSessionsUsed && (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              You&apos;ve explored all your discoveries for today!
            </p>
            <p className="text-sm text-muted-foreground">Come back tomorrow for more.</p>
          </div>
        )}

        {/* Bootstrap state */}
        {needsBootstrap && !bothSessionsUsed && (
          <div className="bg-secondary/50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="text-muted-foreground">
                  For better personalized discoveries, add more thoughts to your contexts.
                </p>
                <p className="text-muted-foreground mt-1">
                  You can still search for any topic below!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {!bothSessionsUsed && (
          <>
            {/* Search input */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a topic..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={directedDisabled}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={directedDisabled || !query.trim()}
                className="shrink-0"
              >
                {isLoading && sessionType === null ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {directedDisabled && !curatedDisabled && (
              <p className="text-xs text-muted-foreground mb-3">
                Search is used for today. Try a context below!
              </p>
            )}

            {/* Context chips */}
            {contexts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Or explore by context:</p>
                <div className="flex flex-wrap gap-2">
                  {contexts.slice(0, 6).map((context) => (
                    <ContextChip
                      key={context.id}
                      context={context}
                      onClick={() => handleContextClick(context)}
                      disabled={curatedDisabled}
                    />
                  ))}
                </div>
              </div>
            )}

            {curatedDisabled && !directedDisabled && (
              <p className="text-xs text-muted-foreground mb-3">
                Curated discovery is used for today. Try searching above!
              </p>
            )}

            {/* Surprise Me button */}
            <Button
              variant="outline"
              onClick={handleSurpriseMe}
              disabled={curatedDisabled}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Shuffle className="h-4 w-4" />
                  Surprise Me
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
