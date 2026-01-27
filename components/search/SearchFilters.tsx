"use client"

import { cn } from "@/lib/utils"
import { SearchResultType } from "@/lib/types/search"

interface SearchFiltersProps {
  activeFilter: SearchResultType | null
  onFilterChange: (filter: SearchResultType | null) => void
}

const filters: { label: string; value: SearchResultType | null }[] = [
  { label: "All", value: null },
  { label: "Thoughts", value: "thought" },
  { label: "Notes", value: "note" },
  { label: "Sources", value: "source" },
]

export function SearchFilters({ activeFilter, onFilterChange }: SearchFiltersProps) {
  return (
    <div className="flex gap-2 px-1">
      {filters.map((filter) => (
        <button
          key={filter.label}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            activeFilter === filter.value
              ? "glass-button-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-[var(--glass-hover-bg)] hover:text-foreground"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
