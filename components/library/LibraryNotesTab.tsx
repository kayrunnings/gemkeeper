"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Note, NoteInput, Folder } from "@/lib/types"
import { NoteCard } from "@/components/note-card"
import { NoteEditor } from "@/components/note-editor"
import { ExtractFromNoteModal } from "@/components/extract-from-note-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  StickyNote,
  Loader2,
  Plus,
  Folder as FolderIcon,
  FolderPlus,
  FileX,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createFolder as createFolderAction,
  updateFolder as updateFolderAction,
  deleteFolder as deleteFolderAction,
} from "@/app/folders/actions"
import { moveNoteToFolder as moveNoteToFolderAction } from "@/app/notes/actions"
import { useToast } from "@/components/error-toast"

type FilterType = "all" | "unfiled" | { folderId: string }

interface LibraryNotesTabProps {
  searchQuery?: string
}

export function LibraryNotesTab({ searchQuery }: LibraryNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [extractingNote, setExtractingNote] = useState<Note | null>(null)
  const [hasAIConsent, setHasAIConsent] = useState(false)
  const [activeGemCount, setActiveGemCount] = useState(0)

  // Folder creation/editing state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")
  const [isFolderLoading, setIsFolderLoading] = useState(false)

  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const [notesResult, foldersResult, profileResult, gemsResult] = await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true }),
      supabase
        .from("profiles")
        .select("ai_consent_given")
        .eq("id", user.id)
        .single(),
      supabase
        .from("gems")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
    ])

    if (!notesResult.error) setNotes(notesResult.data || [])
    if (!foldersResult.error) setFolders(foldersResult.data || [])
    setHasAIConsent(profileResult.data?.ai_consent_given ?? false)
    setActiveGemCount(gemsResult.count ?? 0)
    setIsLoading(false)
  }

  // Calculate note counts for folders
  const noteCounts = useMemo(() => {
    const counts: { [key: string]: number } = {}
    notes.forEach((note) => {
      if (note.folder_id) {
        counts[note.folder_id] = (counts[note.folder_id] || 0) + 1
      }
    })
    return counts
  }, [notes])

  const unfiledCount = useMemo(() => {
    return notes.filter((note) => !note.folder_id).length
  }, [notes])

  // Filter notes based on search and selected filter
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply folder filter
    if (selectedFilter === "unfiled") {
      filtered = filtered.filter((note) => !note.folder_id)
    } else if (typeof selectedFilter === "object" && selectedFilter.folderId) {
      filtered = filtered.filter((note) => note.folder_id === selectedFilter.folderId)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [notes, selectedFilter, searchQuery])

  const isFilterSelected = (filter: FilterType) => {
    if (typeof selectedFilter === "string" && typeof filter === "string") {
      return selectedFilter === filter
    }
    if (typeof selectedFilter === "object" && typeof filter === "object") {
      return selectedFilter.folderId === filter.folderId
    }
    return false
  }

  // Note operations
  const handleSaveNote = async (noteInput: NoteInput, existingId?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (existingId) {
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
        showError(error, "Failed to update note")
        return
      }

      setNotes((prev) => prev.map((note) => (note.id === existingId ? data : note)))
      showSuccess("Note updated")
    } else {
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
        showError(error, "Failed to create note")
        return
      }

      setNotes((prev) => [data, ...prev])
      showSuccess("Note created")
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return

    const { error } = await supabase.from("notes").delete().eq("id", noteId)

    if (error) {
      showError(error, "Failed to delete note")
      return
    }

    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    showSuccess("Note deleted")
  }

  const handleMoveToFolder = async (noteId: string, folderId: string | null) => {
    const result = await moveNoteToFolderAction(noteId, folderId)
    if (result.error) {
      showError(new Error(result.error), "Failed to move note")
      return
    }

    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, folder_id: folderId } : note))
    )
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsEditorOpen(true)
  }

  const handleNewNote = () => {
    setEditingNote(null)
    setIsEditorOpen(true)
  }

  const handleExtractGems = (note: Note) => {
    setExtractingNote(note)
    setIsExtractModalOpen(true)
  }

  const handleGemsExtracted = async () => {
    const { count } = await supabase
      .from("gems")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    setActiveGemCount(count ?? 0)
  }

  // Folder operations
  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim()
    if (!trimmedName || isFolderLoading) return

    setIsFolderLoading(true)
    try {
      const result = await createFolderAction(trimmedName)
      if (result.error) {
        showError(new Error(result.error), "Failed to create folder")
        return
      }
      if (result.folder) {
        setFolders((prev) => [...prev, result.folder!].sort((a, b) => a.name.localeCompare(b.name)))
        showSuccess("Folder created")
      }
      setNewFolderName("")
      setIsCreatingFolder(false)
    } finally {
      setIsFolderLoading(false)
    }
  }

  const handleStartRename = (folder: Folder) => {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  const handleRenameFolder = async () => {
    if (!editingFolderId || isFolderLoading) return
    const trimmedName = editingFolderName.trim()
    if (!trimmedName) {
      setEditingFolderId(null)
      setEditingFolderName("")
      return
    }

    setIsFolderLoading(true)
    try {
      const result = await updateFolderAction(editingFolderId, trimmedName)
      if (result.error) {
        showError(new Error(result.error), "Failed to rename folder")
        return
      }
      if (result.folder) {
        setFolders((prev) =>
          prev.map((f) => (f.id === editingFolderId ? result.folder! : f)).sort((a, b) => a.name.localeCompare(b.name))
        )
        showSuccess("Folder renamed")
      }
      setEditingFolderId(null)
      setEditingFolderName("")
    } finally {
      setIsFolderLoading(false)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm("Are you sure you want to delete this folder? Notes in this folder will become unfiled.")) return

    const result = await deleteFolderAction(folderId)
    if (result.error) {
      showError(new Error(result.error), "Failed to delete folder")
      return
    }

    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    setNotes((prev) => prev.map((note) => (note.folder_id === folderId ? { ...note, folder_id: null } : note)))

    if (typeof selectedFilter === "object" && selectedFilter.folderId === folderId) {
      setSelectedFilter("all")
    }
    showSuccess("Folder deleted")
  }

  // Get current filter title
  const getFilterTitle = () => {
    if (selectedFilter === "all") return "All Notes"
    if (selectedFilter === "unfiled") return "Unfiled"
    if (typeof selectedFilter === "object" && selectedFilter.folderId) {
      const folder = folders.find((f) => f.id === selectedFilter.folderId)
      return folder?.name || "Folder"
    }
    return "Notes"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-4 space-y-1">
            {/* All Notes */}
            <button
              onClick={() => setSelectedFilter("all")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                isFilterSelected("all")
                  ? "glass-button-primary text-primary-foreground shadow-sm"
                  : "hover:bg-[var(--glass-hover-bg)] text-foreground"
              )}
            >
              <StickyNote className="h-4 w-4" />
              <span className="flex-1">All Notes</span>
              <span className="text-xs opacity-70">{notes.length}</span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-[var(--glass-sidebar-border)]" />

            {/* Folders section header */}
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Folders
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsCreatingFolder(true)}
                title="New Folder"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* New folder input */}
            {isCreatingFolder && (
              <div className="flex items-center gap-1 px-3 py-1">
                <FolderIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder()
                    if (e.key === "Escape") {
                      setIsCreatingFolder(false)
                      setNewFolderName("")
                    }
                  }}
                  placeholder="Folder name"
                  className="h-7 text-sm"
                  autoFocus
                  disabled={isFolderLoading}
                  maxLength={100}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleCreateFolder}
                  disabled={isFolderLoading}
                >
                  {isFolderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => {
                    setIsCreatingFolder(false)
                    setNewFolderName("")
                  }}
                  disabled={isFolderLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Folder list */}
            <div className="flex flex-col gap-0.5">
              {folders.map((folder) => (
                <div key={folder.id} className="group relative">
                  {editingFolderId === folder.id ? (
                    <div className="flex items-center gap-1 px-3 py-1">
                      <FolderIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFolder()
                          if (e.key === "Escape") {
                            setEditingFolderId(null)
                            setEditingFolderName("")
                          }
                        }}
                        className="h-7 text-sm"
                        autoFocus
                        disabled={isFolderLoading}
                        maxLength={100}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={handleRenameFolder}
                        disabled={isFolderLoading}
                      >
                        {isFolderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => {
                          setEditingFolderId(null)
                          setEditingFolderName("")
                        }}
                        disabled={isFolderLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedFilter({ folderId: folder.id })}
                      onDoubleClick={(e) => {
                        e.preventDefault()
                        handleStartRename(folder)
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left pr-8",
                        isFilterSelected({ folderId: folder.id })
                          ? "glass-button-primary text-primary-foreground shadow-sm"
                          : "hover:bg-[var(--glass-hover-bg)] text-foreground"
                      )}
                    >
                      <FolderIcon className="h-4 w-4" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-xs opacity-70">{noteCounts[folder.id] || 0}</span>
                    </button>
                  )}

                  {/* Context menu */}
                  {editingFolderId !== folder.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                            isFilterSelected({ folderId: folder.id }) && "text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStartRename(folder)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>

            {folders.length === 0 && !isCreatingFolder && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No folders yet</p>
            )}

            {/* Divider */}
            <div className="my-2 border-t border-[var(--glass-sidebar-border)]" />

            {/* Unfiled */}
            <button
              onClick={() => setSelectedFilter("unfiled")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                isFilterSelected("unfiled")
                  ? "glass-button-primary text-primary-foreground shadow-sm"
                  : "hover:bg-[var(--glass-hover-bg)] text-foreground"
              )}
            >
              <FileX className="h-4 w-4" />
              <span className="flex-1">Unfiled</span>
              <span className="text-xs opacity-70">{unfiledCount}</span>
            </button>
          </div>
        </aside>

        {/* Notes Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{getFilterTitle()}</h2>
            <Button onClick={handleNewNote} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>

          {/* Mobile folder selector */}
          <div className="md:hidden mb-4">
            <select
              value={
                typeof selectedFilter === "string"
                  ? selectedFilter
                  : `folder:${selectedFilter.folderId}`
              }
              onChange={(e) => {
                const value = e.target.value
                if (value === "all" || value === "unfiled") {
                  setSelectedFilter(value)
                } else if (value.startsWith("folder:")) {
                  setSelectedFilter({ folderId: value.replace("folder:", "") })
                }
              }}
              className="w-full h-10 rounded-xl glass-input px-3 text-sm"
            >
              <option value="all">All Notes ({notes.length})</option>
              {folders.map((folder) => (
                <option key={folder.id} value={`folder:${folder.id}`}>
                  {folder.name} ({noteCounts[folder.id] || 0})
                </option>
              ))}
              <option value="unfiled">Unfiled ({unfiledCount})</option>
            </select>
          </div>

          {/* Note count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </p>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No notes found"
                  : selectedFilter === "unfiled"
                  ? "No unfiled notes"
                  : typeof selectedFilter === "object"
                  ? "No notes in this folder"
                  : "No notes yet. Start writing!"}
              </p>
              <Button onClick={handleNewNote} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  folders={folders}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                  onMoveToFolder={handleMoveToFolder}
                  onExtractGems={handleExtractGems}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note editor modal */}
      <NoteEditor
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingNote(null)
        }}
        onSave={handleSaveNote}
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
    </>
  )
}
