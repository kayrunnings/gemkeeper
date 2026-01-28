"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, X, Lightbulb, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryCard } from "./DiscoveryCard"
import { DiscoveryDetail } from "./DiscoveryDetail"
import type { Discovery } from "@/lib/types/discovery"
import type { ContextWithCount } from "@/lib/types/context"

interface DiscoveryGridProps {
  discoveries: Discovery[]
  sessionType: "curated" | "directed" | null
  query?: string
  contexts: ContextWithCount[]
  onDone: () => void
  onDiscoveryUpdate: (discovery: Discovery) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export function DiscoveryGrid({
  discoveries,
  sessionType,
  query,
  contexts,
  onDone,
  onDiscoveryUpdate,
  onRefresh,
  isRefreshing,
  className,
}: DiscoveryGridProps) {
  const [selectedDiscovery, setSelectedDiscovery] = useState<Discovery | null>(null)

  const handleCardClick = (discovery: Discovery) => {
    if (discovery.status === "pending") {
      setSelectedDiscovery(discovery)
    }
  }

  const handleCloseDetail = () => {
    setSelectedDiscovery(null)
  }

  const handleSaved = (savedDiscovery: Discovery) => {
    onDiscoveryUpdate(savedDiscovery)
    setSelectedDiscovery(null)
  }

  const handleSkipped = (skippedDiscovery: Discovery) => {
    onDiscoveryUpdate(skippedDiscovery)
    setSelectedDiscovery(null)
  }

  // Get header text based on session type
  const getHeaderText = () => {
    if (sessionType === "directed" && query) {
      return `Results for "${query}"`
    }
    return "Discoveries for You"
  }

  // Count saved discoveries
  const savedCount = discoveries.filter((d) => d.status === "saved").length

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{getHeaderText()}</CardTitle>
                <p className="text-xs text-muted-foreground">{discoveries.length} discoveries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="gap-1"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Loading..." : "Refresh"}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onDone}>
                <X className="h-4 w-4 mr-1" />
                Done
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tip */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2 mb-4">
            <Lightbulb className="h-3.5 w-3.5 shrink-0" />
            <span>Add more thoughts to your contexts for better personalized discoveries!</span>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discoveries.map((discovery) => (
              <DiscoveryCard
                key={discovery.id}
                discovery={discovery}
                contexts={contexts}
                onClick={() => handleCardClick(discovery)}
              />
            ))}
          </div>

          {/* Summary */}
          {savedCount > 0 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {savedCount} thought{savedCount !== 1 ? "s" : ""} saved from this session
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail view */}
      {selectedDiscovery && (
        <DiscoveryDetail
          discovery={selectedDiscovery}
          contexts={contexts}
          onClose={handleCloseDetail}
          onSaved={handleSaved}
          onSkipped={handleSkipped}
        />
      )}
    </>
  )
}
