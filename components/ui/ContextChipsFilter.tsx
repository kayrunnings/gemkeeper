"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Context } from "@/lib/types/context"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"

interface ContextChipsFilterProps {
  contexts: Context[]
  selectedContextId: string | null
  onSelect: (contextId: string | null) => void
  showCounts?: boolean
  counts?: Record<string, number>
  className?: string
}

export function ContextChipsFilter({
  contexts,
  selectedContextId,
  onSelect,
  showCounts = false,
  counts = {},
  className,
}: ContextChipsFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // Check scroll position to show/hide arrows
  const updateArrows = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setShowLeftArrow(container.scrollLeft > 0)
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    )
  }

  useEffect(() => {
    updateArrows()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", updateArrows)
      window.addEventListener("resize", updateArrows)
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", updateArrows)
      }
      window.removeEventListener("resize", updateArrows)
    }
  }, [contexts])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 200
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const totalCount = showCounts
    ? Object.values(counts).reduce((sum, count) => sum + count, 0)
    : undefined

  return (
    <div className={cn("relative", className)}>
      {/* Left scroll button */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 bg-gradient-to-r from-background via-background to-transparent pr-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => scroll("left")}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* All chip */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
            selectedContextId === null
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
          )}
        >
          All
          {showCounts && totalCount !== undefined && (
            <span className="ml-1.5 opacity-70">({totalCount})</span>
          )}
        </button>

        {/* Context chips */}
        {contexts.map((context) => {
          const count = counts[context.id]
          const isSelected = selectedContextId === context.id

          return (
            <button
              key={context.id}
              onClick={() => onSelect(context.id)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-1.5",
                isSelected
                  ? "shadow-sm"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
              )}
              style={
                isSelected && context.color
                  ? {
                      backgroundColor: context.color,
                      borderColor: context.color,
                      color: "white",
                    }
                  : undefined
              }
            >
              {context.icon && <span>{context.icon}</span>}
              {context.name}
              {showCounts && count !== undefined && (
                <span className="opacity-70">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Right scroll button */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center z-10 bg-gradient-to-l from-background via-background to-transparent pl-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => scroll("right")}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
