"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Note, NoteInput, Folder } from "@/lib/types"
import { Thought } from "@/lib/types/thought"
import { NotesList } from "@/components/notes-list"
import { EnhancedNoteEditor } from "@/components/notes/enhanced-note-editor"
import { Sidebar, FilterType } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, LogOut, Gem, Loader2, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ExtractFromNoteModal } from "@/components/extract-from-note-modal"
import {
  createFolder as createFolderAction,
  updateFolder as updateFolderAction,
  deleteFolder as deleteFolderAction,
} from "@/app/folders/actions"
import { moveNoteToFolder as moveNoteToFolderAction } from "@/app/notes/actions"

interface Context {
  id: string
  name: string
  color: string
  slug: string
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [contexts, setContexts] = useState<Context[]>([])
  const [availableThoughts, setAvailableThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [extractingNote, setExtractingNote] = useState<Note | null>(null)
  const [hasAIConsent, setHasAIConsent] = useState(false)
  const [activeGemCount, setActiveGemCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Fetch notes, folders, and user on mount
  useEffect(() => {
    async function loadData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUserEmail(user.email ?? null)

      // Fetch notes, folders, profile, gem count, contexts, and thoughts in parallel
      const [notesResult, foldersResult, profileResult, gemsResult, contextsResult, thoughtsResult] = await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .order("updated_at", { ascending: false }),
        supabase
          .from("folders")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("profiles")
          .select("ai_consent_given")
          .eq("id", user.id)
          .single(),
        supabase
          .from("gems")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("contexts")
          .select("id, name, color, slug")
          .order("sort_order", { ascending: true }),
        supabase
          .from("gems")
          .select("*")
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(100),
      ])

      if (notesResult.error) {
        console.error("Error fetching notes:", notesResult.error)
      } else {
        setNotes(notesResult.data || [])
      }

      if (foldersResult.error) {
        console.error("Error fetching folders:", foldersResult.error)
      } else {
        setFolders(foldersResult.data || [])
      }

      if (!contextsResult.error && contextsResult.data) {
        setContexts(contextsResult.data)
      }

      if (!thoughtsResult.error && thoughtsResult.data) {
        setAvailableThoughts(thoughtsResult.data as Thought[])
      }

      setHasAIConsent(profileResult.data?.ai_consent_given ?? false)
      setActiveGemCount(gemsResult.count ?? 0)

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  // Calculate note counts for sidebar
  const noteCounts = useMemo(() => {
    const counts: { [key: string]: number } = {}
    notes.forEach((note) => {
      if (note.folder_id) {
        counts[note.folder_id] = (counts[note.folder_id] || 0) + 1
      }
    })
    return counts
  }, [notes])

  const favoritesCount = 0 // Favorites feature not available in current schema

  const unfiledCount = useMemo(() => {
    return notes.filter((note) => !note.folder_id).length
  }, [notes])

  // Filter notes based on selected filter
  const filteredNotes = useMemo(() => {
    switch (selectedFilter) {
      case "all":
        return notes
      case "favorites":
        return notes // Favorites not supported in current schema
      case "unfiled":
        return notes.filter((note) => !note.folder_id)
      default:
        if (typeof selectedFilter === "object" && selectedFilter.folderId) {
          return notes.filter((note) => note.folder_id === selectedFilter.folderId)
        }
        return notes
    }
  }, [notes, selectedFilter])

  // Handle creating or updating a note
  const handleSaveNote = async (noteInput: NoteInput, existingId?: string) => {
    if (existingId) {
      // Update existing note
      const { data, error } = await supabase
        .from("notes")
        .update({
          title: noteInput.title || null,
          content: noteInput.content || null,
        })
        .eq("id", existingId)
        .select()
        .single()

      if (error) {
        console.error("Error updating note:", error)
        return
      }

      setNotes((prev) =>
        prev.map((note) => (note.id === existingId ? data : note))
      )
    } else {
      // Create new note
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // If we're filtering by a specific folder, create the note in that folder
      let folderId: string | null = null
      if (typeof selectedFilter === "object" && selectedFilter.folderId) {
        folderId = selectedFilter.folderId
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: noteInput.title || null,
          content: noteInput.content || null,
          folder_id: folderId,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating note:", error)
        return
      }

      setNotes((prev) => [data, ...prev])
    }
  }

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)

    if (error) {
      console.error("Error deleting note:", error)
      return
    }

    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }

  // Handle moving a note to a folder
  const handleMoveToFolder = async (noteId: string, folderId: string | null) => {
    const result = await moveNoteToFolderAction(noteId, folderId)
    if (result.error) {
      console.error("Error moving note to folder:", result.error)
      return
    }

    // Update local state
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, folder_id: folderId } : note
      )
    )
  }

  // Handle creating a folder
  const handleCreateFolder = async (name: string) => {
    const result = await createFolderAction(name)
    if (result.error) {
      console.error("Error creating folder:", result.error)
      return
    }

    if (result.folder) {
      setFolders((prev) => [...prev, result.folder!].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  // Handle renaming a folder
  const handleRenameFolder = async (folderId: string, name: string) => {
    const result = await updateFolderAction(folderId, name)
    if (result.error) {
      console.error("Error renaming folder:", result.error)
      return
    }

    if (result.folder) {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? result.folder! : f)).sort((a, b) => a.name.localeCompare(b.name))
      )
    }
  }

  // Handle deleting a folder
  const handleDeleteFolder = async (folderId: string) => {
    const result = await deleteFolderAction(folderId)
    if (result.error) {
      console.error("Error deleting folder:", result.error)
      return
    }

    // Remove folder from state
    setFolders((prev) => prev.filter((f) => f.id !== folderId))

    // Update notes that were in this folder to be unfiled
    setNotes((prev) =>
      prev.map((note) =>
        note.folder_id === folderId ? { ...note, folder_id: null } : note
      )
    )

    // If we were filtering by this folder, switch to all notes
    if (typeof selectedFilter === "object" && selectedFilter.folderId === folderId) {
      setSelectedFilter("all")
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Open editor for new note
  const handleNewNote = () => {
    setEditingNote(null)
    setIsEditorOpen(true)
  }

  // Open editor for existing note
  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsEditorOpen(true)
  }

  // Open extract gems modal for a note
  const handleExtractGems = (note: Note) => {
    setExtractingNote(note)
    setIsExtractModalOpen(true)
  }

  // Handle gems extracted from note
  const handleGemsExtracted = async () => {
    // Refresh gem count
    const { count } = await supabase
      .from("gems")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    setActiveGemCount(count ?? 0)
  }

  // Get current filter title for header
  const getFilterTitle = () => {
    switch (selectedFilter) {
      case "all":
        return "All Notes"
      case "favorites":
        return "Favorites"
      case "unfiled":
        return "Unfiled"
      default:
        if (typeof selectedFilter === "object" && selectedFilter.folderId) {
          const folder = folders.find((f) => f.id === selectedFilter.folderId)
          return folder?.name || "Folder"
        }
        return "Notes"
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Gem className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">ThoughtFolio</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleNewNote} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Note</span>
            </Button>

            {/* User info and sign out */}
            <div className="flex items-center gap-2 pl-3 border-l">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium" title={userEmail ?? undefined}>
                {userEmail?.[0]?.toUpperCase() ?? "U"}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Sign out"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        <div className="hidden md:block">
          <Sidebar
            folders={folders}
            selectedFilter={selectedFilter}
            onFilterSelect={setSelectedFilter}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            noteCounts={noteCounts}
            favoritesCount={favoritesCount}
            allNotesCount={notes.length}
            unfiledCount={unfiledCount}
          />
        </div>

        {/* Sidebar - mobile overlay */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-40 w-64 md:hidden pt-16">
              <Sidebar
                folders={folders}
                selectedFilter={selectedFilter}
                onFilterSelect={(filter) => {
                  setSelectedFilter(filter)
                  setIsSidebarOpen(false)
                }}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                noteCounts={noteCounts}
                favoritesCount={favoritesCount}
                allNotesCount={notes.length}
                unfiledCount={unfiledCount}
              />
            </div>
          </>
        )}

        {/* Notes area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">{getFilterTitle()}</h2>
            <NotesList
              notes={filteredNotes}
              folders={folders}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onMoveToFolder={handleMoveToFolder}
              onExtractGems={handleExtractGems}
            />
          </div>
        </main>
      </div>

      {/* Note editor modal */}
      <EnhancedNoteEditor
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingNote(null)
        }}
        onSave={handleSaveNote}
        contexts={contexts}
        availableThoughts={availableThoughts}
        hasAIConsent={hasAIConsent}
      />

      {/* Extract gems from note modal */}
      {extractingNote && (
        <ExtractFromNoteModal
          isOpen={isExtractModalOpen}
          onClose={() => {
            setIsExtractModalOpen(false)
            setExtractingNote(null)
          }}
          onGemsCreated={handleGemsExtracted}
          note={extractingNote}
          activeGemCount={activeGemCount}
          hasAIConsent={hasAIConsent}
        />
      )}
    </div>
  )
}
