"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { searchSources, getOrCreateSource } from "@/lib/sources"
import { Source, SOURCE_TYPE_ICONS } from "@/lib/types/source"
import { Loader2, Plus, X, BookOpen, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SourceSelectorProps {
  selectedSourceId?: string | null
  onSourceSelect: (source: Source | null) => void
  placeholder?: string
  allowCreate?: boolean
  className?: string
}

// Single source selector with search and quick-create
export function SourceSelector({
  selectedSourceId,
  onSourceSelect,
  placeholder = "Search sources...",
  allowCreate = true,
  className,
}: SourceSelectorProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Source[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load selected source if ID provided
  useEffect(() => {
    if (selectedSourceId && !selectedSource) {
      searchSources(selectedSourceId, 1).then(({ data }) => {
        if (data.length > 0 && data[0].id === selectedSourceId) {
          setSelectedSource(data[0])
        }
      })
    }
  }, [selectedSourceId, selectedSource])

  // Search on query change
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)
      const { data } = await searchSources(query, 5)
      setResults(data)
      setIsSearching(false)
    }

    const timeout = setTimeout(search, 200)
    return () => clearTimeout(timeout)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (source: Source) => {
    setSelectedSource(source)
    onSourceSelect(source)
    setQuery("")
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedSource(null)
    onSourceSelect(null)
    setQuery("")
  }

  const handleCreate = async () => {
    if (!query.trim()) return

    setIsCreating(true)
    const { data, error, created } = await getOrCreateSource(query.trim())
    setIsCreating(false)

    if (data) {
      handleSelect(data)
    }
  }

  // Show selected source
  if (selectedSource) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="flex items-center gap-1 pr-1">
          <span>{SOURCE_TYPE_ICONS[selectedSource.type]}</span>
          <span className="truncate max-w-[200px]">{selectedSource.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-destructive/20"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md py-1 max-h-60 overflow-auto">
          {results.length > 0 ? (
            results.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => handleSelect(source)}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
              >
                <span>{SOURCE_TYPE_ICONS[source.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{source.name}</p>
                  {source.author && (
                    <p className="text-xs text-muted-foreground truncate">
                      {source.author}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : query.trim() && !isSearching ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No sources found
            </div>
          ) : null}

          {/* Quick create option */}
          {allowCreate && query.trim() && !results.some((r) => r.name.toLowerCase() === query.toLowerCase()) && (
            <>
              {results.length > 0 && <div className="border-t my-1" />}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-primary"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="text-sm">Create &quot;{query}&quot;</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface MultiSourceSelectorProps {
  selectedSourceIds: string[]
  onSourcesChange: (sourceIds: string[]) => void
  placeholder?: string
  allowCreate?: boolean
  className?: string
}

// Multi-source selector for notes
export function MultiSourceSelector({
  selectedSourceIds,
  onSourcesChange,
  placeholder = "Search and add sources...",
  allowCreate = true,
  className,
}: MultiSourceSelectorProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Source[]>([])
  const [selectedSources, setSelectedSources] = useState<Source[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load selected sources from IDs - refetch when IDs change
  useEffect(() => {
    // Create a sorted string to compare arrays
    const currentIds = selectedSources.map(s => s.id).sort().join(',')
    const newIds = [...selectedSourceIds].sort().join(',')

    // Only reload if IDs don't match
    if (currentIds !== newIds) {
      if (selectedSourceIds.length === 0) {
        setSelectedSources([])
      } else {
        // Load sources by searching for each ID
        Promise.all(
          selectedSourceIds.map((id) =>
            searchSources(id, 1).then(({ data }) => data[0])
          )
        ).then((sources) => {
          setSelectedSources(sources.filter(Boolean))
        })
      }
    }
  }, [selectedSourceIds, selectedSources])

  // Search on query change
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)
      const { data } = await searchSources(query, 5)
      // Filter out already selected sources
      const filtered = data.filter((s) => !selectedSourceIds.includes(s.id))
      setResults(filtered)
      setIsSearching(false)
    }

    const timeout = setTimeout(search, 200)
    return () => clearTimeout(timeout)
  }, [query, selectedSourceIds])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (source: Source) => {
    const newSources = [...selectedSources, source]
    setSelectedSources(newSources)
    onSourcesChange(newSources.map((s) => s.id))
    setQuery("")
    setResults([])
  }

  const handleRemove = (sourceId: string) => {
    const newSources = selectedSources.filter((s) => s.id !== sourceId)
    setSelectedSources(newSources)
    onSourcesChange(newSources.map((s) => s.id))
  }

  const handleCreate = async () => {
    if (!query.trim()) return

    setIsCreating(true)
    const { data, error, created } = await getOrCreateSource(query.trim())
    setIsCreating(false)

    if (data && !selectedSourceIds.includes(data.id)) {
      handleSelect(data)
    }
  }

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      {/* Selected sources */}
      {selectedSources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSources.map((source) => (
            <Badge
              key={source.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{SOURCE_TYPE_ICONS[source.type]}</span>
              <span className="truncate max-w-[150px]">{source.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                onClick={() => handleRemove(source.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute z-50 w-full bg-popover border rounded-md shadow-md py-1 max-h-60 overflow-auto">
          {results.length > 0 ? (
            results.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => handleSelect(source)}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
              >
                <span>{SOURCE_TYPE_ICONS[source.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{source.name}</p>
                  {source.author && (
                    <p className="text-xs text-muted-foreground truncate">
                      {source.author}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : query.trim() && !isSearching ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No sources found
            </div>
          ) : null}

          {/* Quick create option */}
          {allowCreate && query.trim() && !results.some((r) => r.name.toLowerCase() === query.toLowerCase()) && (
            <>
              {results.length > 0 && <div className="border-t my-1" />}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-primary"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="text-sm">Create &quot;{query}&quot;</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
