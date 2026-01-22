"use client"

import { useState, useMemo } from "react"
import { Note, Folder } from "@/lib/types"
import { NoteCard } from "./note-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, StickyNote } from "lucide-react"

interface NotesListProps {
  notes: Note[]
  folders?: Folder[]
  onEditNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void
  onMoveToFolder?: (noteId: string, folderId: string | null) => void
  onExtractGems?: (note: Note) => void
}

export function NotesList({
  notes,
  folders = [],
  onEditNote,
  onDeleteNote,
  onMoveToFolder,
  onExtractGems,
}: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = (note.title || "").toLowerCase().includes(query)
        const matchesContent = (note.content || "").toLowerCase().includes(query)
        return matchesTitle || matchesContent
      }

      return true
    })
  }, [notes, searchQuery])

  // Sort by updated_at
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [filteredNotes])

  const clearFilters = () => {
    setSearchQuery("")
  }

  const hasActiveFilters = !!searchQuery

  return (
    <div className="space-y-6">
      {/* Search bar */}
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

        {/* Clear button */}
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
              onMoveToFolder={onMoveToFolder}
              onExtractGems={onExtractGems}
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
              ? "Try adjusting your search"
              : "Create your first note to get started"}
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
