"use client"

import { useState, useMemo } from "react"
import { Note, Folder } from "@/lib/types"
import { NoteCard } from "./note-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Star, X, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotesListProps {
  notes: Note[]
  folders?: Folder[]
  onEditNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onToggleFavorite: (noteId: string) => void
  onMoveToFolder?: (noteId: string, folderId: string | null) => void
}

export function NotesList({
  notes,
  folders = [],
  onEditNote,
  onDeleteNote,
  onToggleFavorite,
  onMoveToFolder,
}: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [notes])

  // Filter notes based on search, favorites, and tag
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Filter by favorites
      if (showFavoritesOnly && !note.is_favorite) {
        return false
      }

      // Filter by tag
      if (selectedTag && !note.tags.includes(selectedTag)) {
        return false
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = note.title.toLowerCase().includes(query)
        const matchesContent = note.content.toLowerCase().includes(query)
        const matchesTags = note.tags.some((tag) => tag.toLowerCase().includes(query))
        return matchesTitle || matchesContent || matchesTags
      }

      return true
    })
  }, [notes, searchQuery, showFavoritesOnly, selectedTag])

  // Sort: favorites first, then by updated_at
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      // Favorites first
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1
      // Then by date
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [filteredNotes])

  const clearFilters = () => {
    setSearchQuery("")
    setShowFavoritesOnly(false)
    setSelectedTag(null)
  }

  const hasActiveFilters = searchQuery || showFavoritesOnly || selectedTag

  return (
    <div className="space-y-6">
      {/* Search and filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
            Favorites
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tags filter row */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {sortedNotes.length} {sortedNotes.length === 1 ? "note" : "notes"}
        {hasActiveFilters && ` (filtered from ${notes.length})`}
      </p>

      {/* Notes grid */}
      {sortedNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              folders={folders}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              onToggleFavorite={onToggleFavorite}
              onMoveToFolder={onMoveToFolder}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <StickyNote className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">No notes found</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Create your first note to get started"}
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
