"use client"

import { useState, useEffect, useCallback } from "react"
import { Sparkle, ArrowsClockwise, X, CaretLeft, CaretRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface TFInsightData {
  id: string
  message: string
  highlights?: Array<{
    text: string
    type: "strong" | "context" | "highlight"
  }>
}

interface TFInsightProps {
  insights: TFInsightData[]
  onRefresh?: () => void
  onDismiss?: () => void
  isLoading?: boolean
  className?: string
}

function parseInsightMessage(message: string): React.ReactNode[] {
  // Parse message with **bold**, `context`, and _highlight_ markers
  const parts: React.ReactNode[] = []
  let remaining = message
  let key = 0

  while (remaining.length > 0) {
    // Find the next special marker
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    const contextMatch = remaining.match(/`([^`]+)`/)
    const highlightMatch = remaining.match(/_([^_]+)_/)

    // Find which comes first
    const matches = [
      { match: boldMatch, index: boldMatch?.index ?? Infinity, type: "strong" },
      { match: contextMatch, index: contextMatch?.index ?? Infinity, type: "context" },
      { match: highlightMatch, index: highlightMatch?.index ?? Infinity, type: "highlight" },
    ].sort((a, b) => a.index - b.index)

    const first = matches[0]

    if (first.match && first.index !== Infinity) {
      // Add text before the match
      if (first.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, first.index)}</span>)
      }

      // Add the styled text
      const text = first.match[1]
      if (first.type === "strong") {
        parts.push(
          <strong key={key++} className="text-primary font-semibold">
            {text}
          </strong>
        )
      } else if (first.type === "context") {
        parts.push(
          <span key={key++} className="text-violet-400 font-medium">
            {text}
          </span>
        )
      } else {
        parts.push(
          <span key={key++} className="text-accent font-medium">
            {text}
          </span>
        )
      }

      // Move past this match
      remaining = remaining.slice(first.index + first.match[0].length)
    } else {
      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
  }

  return parts
}

export function TFInsight({
  insights,
  onRefresh,
  onDismiss,
  isLoading = false,
  className,
}: TFInsightProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Auto-rotate insights every 8 seconds
  useEffect(() => {
    if (insights.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [insights.length])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    onDismiss?.()
  }, [onDismiss])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length)
  }, [insights.length])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % insights.length)
  }, [insights.length])

  if (!isVisible || insights.length === 0) {
    return null
  }

  const currentInsight = insights[currentIndex]

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main insight card */}
      <div className="glass-card relative overflow-hidden p-3.5">
        {/* AI gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--ai-gradient-start)] to-[var(--ai-gradient-end)]" />

        <div className="flex items-start gap-3">
          {/* AI icon */}
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--ai-gradient-start)] to-[var(--ai-gradient-end)] text-white shadow-[0_0_20px_var(--ai-glow)]">
            <Sparkle weight="fill" className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-[var(--ai-gradient-start)] to-[var(--ai-gradient-end)] bg-clip-text text-transparent mb-1">
              TF thinks
            </div>
            <div className="text-sm text-foreground leading-relaxed">
              {isLoading ? (
                <span className="text-muted-foreground animate-pulse">
                  Analyzing your patterns...
                </span>
              ) : (
                parseInsightMessage(currentInsight.message)
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-md bg-[var(--glass-input-bg)] border border-[var(--glass-card-border)] text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover-bg)]"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <ArrowsClockwise
                className={cn("w-3 h-3", isLoading && "animate-spin")}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-md bg-[var(--glass-input-bg)] border border-[var(--glass-card-border)] text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover-bg)]"
              onClick={handleDismiss}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel navigation */}
      {insights.length > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--glass-card-bg)] border border-[var(--glass-card-border)] text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover-bg)] transition-colors"
          >
            <CaretLeft weight="bold" className="w-3 h-3" />
          </button>
          <div className="flex gap-1">
            {insights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-[var(--glass-card-border)] hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--glass-card-bg)] border border-[var(--glass-card-border)] text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover-bg)] transition-colors"
          >
            <CaretRight weight="bold" className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
