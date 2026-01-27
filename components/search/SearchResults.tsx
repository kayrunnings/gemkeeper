"use client"

import { SearchResult } from "@/lib/types/search"
import { SearchResultCard } from "./SearchResultCard"
import { Loader2 } from "lucide-react"

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  searchQuery: string
  selectedIndex: number
  onResultClick: (result: SearchResult) => void
}

export function SearchResults({
  results,
  isLoading,
  searchQuery,
  selectedIndex,
  onResultClick,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (searchQuery && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Try a different search term
        </p>
      </div>
    )
  }

  if (!searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">Start typing to search your knowledge</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Search across thoughts, notes, and sources
        </p>
      </div>
    )
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    const key = result.type
    if (!acc[key]) acc[key] = []
    acc[key].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const typeOrder = ['thought', 'note', 'source'] as const
  let currentIndex = 0

  return (
    <div className="space-y-4">
      {typeOrder.map((type) => {
        const typeResults = groupedResults[type]
        if (!typeResults?.length) return null

        const typeLabel = type === 'thought' ? 'Thoughts' : type === 'note' ? 'Notes' : 'Sources'

        return (
          <div key={type}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
              {typeLabel}
            </h3>
            <div className="space-y-1">
              {typeResults.map((result) => {
                const index = currentIndex++
                return (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    isSelected={index === selectedIndex}
                    searchQuery={searchQuery}
                    onClick={() => onResultClick(result)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
