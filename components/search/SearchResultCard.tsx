"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import { SearchResult } from "@/lib/types/search"

interface SearchResultCardProps {
  result: SearchResult
  isSelected: boolean
  searchQuery: string
  onClick: () => void
}

const typeIcons: Record<SearchResult['type'], string> = {
  thought: '\uD83D\uDCAD',
  note: '\uD83D\uDCDD',
  source: '\uD83D\uDCD6',
}

const typeLabels: Record<SearchResult['type'], string> = {
  thought: 'Thought',
  note: 'Note',
  source: 'Source',
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-primary/20 text-foreground rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export const SearchResultCard = memo(function SearchResultCard({
  result,
  isSelected,
  searchQuery,
  onClick
}: SearchResultCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl transition-all",
        isSelected
          ? "bg-[var(--glass-hover-bg)] ring-1 ring-primary/50"
          : "hover:bg-[var(--glass-hover-bg)]"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg" role="img" aria-label={typeLabels[result.type]}>
          {typeIcons[result.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {typeLabels[result.type]}
            </span>
          </div>
          <p className="text-sm text-foreground line-clamp-2">
            {highlightText(result.text, searchQuery)}
          </p>
          {result.secondaryText && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {result.type === 'source' ? `by ${result.secondaryText}` : result.secondaryText}
            </p>
          )}
        </div>
      </div>
    </button>
  )
})
