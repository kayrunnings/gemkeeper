"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchResult, SearchResultType } from "@/lib/types/search"
import { SearchFilters } from "./SearchFilters"
import { SearchResults } from "./SearchResults"

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState<SearchResultType | null>(null)

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ q: query.trim() })
        if (activeFilter) {
          params.set("type", activeFilter)
        }

        const response = await fetch(`/api/search?${params.toString()}`)
        const data = await response.json()

        if (data.results) {
          setResults(data.results)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, activeFilter])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setActiveFilter(null)
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose()
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    }

    if (event.key === "Enter" && results[selectedIndex]) {
      event.preventDefault()
      handleResultClick(results[selectedIndex])
    }
  }, [results, selectedIndex, onClose])

  const handleResultClick = (result: SearchResult) => {
    onClose()

    // Navigate to the appropriate page based on result type
    switch (result.type) {
      case "thought":
        router.push(`/thoughts/${result.id}`)
        break
      case "note":
        router.push(`/dashboard?note=${result.id}`)
        break
      case "source":
        // Sources might go to a library page in the future
        router.push(`/library/sources/${result.id}`)
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <div
        ref={modalRef}
        className="fixed left-[50%] top-[15%] z-50 w-full max-w-xl translate-x-[-50%] glass-modal shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-4"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-card-border)]">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search your knowledge..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded">
              <span className="text-xs">esc</span>
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--glass-hover-bg)] transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-[var(--glass-card-border)]">
          <SearchFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          <SearchResults
            results={results}
            isLoading={isLoading}
            searchQuery={query}
            selectedIndex={selectedIndex}
            onResultClick={handleResultClick}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--glass-card-border)] text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">\u2191</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">\u2193</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">\u21B5</kbd>
              <span>open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">esc</kbd>
              <span>close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
