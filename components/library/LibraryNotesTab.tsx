"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Note, NoteInput, Folder } from "@/lib/types"
import { Thought } from "@/lib/types/thought"

// Simplified context interface for the note editor (matches EnhancedNoteEditor expectations)
interface NoteContext {
  id: string
  name: string
  color: string
  slug: string
}
import { NoteCard } from "@/components/note-card"
import { EnhancedNoteEditor } from "@/components/notes/enhanced-note-editor"
import { ExtractFromNoteModal } from "@/components/extract-from-note-modal"
import { saveDraft as saveDraftAction, publishDraft as publishDraftAction, deleteNote as deleteNoteAction } from "@/app/notes/actions"
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
  FilePenLine,
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

type FilterType = "all" | "unfiled" | "drafts" | { folderId: string }
type SortOrder = "desc" | "asc"

// Input context can have nullable color (from full Context type)
interface InputContext {
  id: string
  name: string
  color: string | null
  slug: string
}

interface LibraryNotesTabProps {
  searchQuery?: string
  sortOrder?: SortOrder
  contexts?: InputContext[]
}

export function LibraryNotesTab({ searchQuery, sortOrder = "desc", contexts: propContexts }: LibraryNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [localContexts, setLocalContexts] = useState<NoteContext[]>([])
  const [availableThoughts, setAvailableThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [extractingNote, setExtractingNote] = useState<Note | null>(null)
  const [hasAIConsent, setHasAIConsent] = useState(false)
  const [activeGemCount, setActiveGemCount] = useState(0)

  // Draft management - database-backed drafts
  const [drafts, setDrafts] = useState<Note[]>([])
  const [editingDraft, setEditingDraft] = useState<Note | null>(null)

  // Use passed contexts or local contexts, mapping to ensure correct format
  const contexts: NoteContext[] = useMemo(() => {
    if (propContexts) {
      return propContexts.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color || '#6366f1',
        slug: c.slug,
      }))
    }
    return localContexts
  }, [propContexts, localContexts])

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
  }, [sortOrder])

  // Reload drafts when editor closes (to catch newly saved drafts)
  useEffect(() => {
    if (!isEditorOpen) {
      loadDrafts()
    }
  }, [isEditorOpen])

  async function loadDrafts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_draft", true)
      .order("updated_at", { ascending: false })

    if (!error && data) {
      setDrafts(data)
    }
  }

  async function loadData() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const [notesResult, draftsResult, foldersResult, profileResult, gemsResult, contextsResult, thoughtsResult] = await Promise.all([
      // Fetch published notes (exclude drafts)
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .or("is_draft.is.null,is_draft.eq.false")
        .order("updated_at", { ascending: sortOrder === "asc" }),
      // Fetch drafts separately
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_draft", true)
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
      // Fetch contexts if not passed as prop
      !propContexts ? supabase
        .from("contexts")
        .select("id, name, color, slug")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true }) : Promise.resolve({ data: null, error: null }),
      // Fetch available thoughts for linking
      supabase
        .from("gems")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "passive"])
        .order("updated_at", { ascending: false })
        .limit(100),
    ])

    if (!notesResult.error) setNotes(notesResult.data || [])
    if (!draftsResult.error) setDrafts(draftsResult.data || [])
    if (!foldersResult.error) setFolders(foldersResult.data || [])
    if (!contextsResult.error && contextsResult.data) {
      setLocalContexts(contextsResult.data.map((c: { id: string; name: string; color: string | null; slug: string }) => ({
        id: c.id,
        name: c.name,
        color: c.color || '#6366f1', // Default to indigo if no color
        slug: c.slug,
      })))
    }
    if (!thoughtsResult.error && thoughtsResult.data) setAvailableThoughts(thoughtsResult.data as Thought[])
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
  const handleSaveNote = async (noteInput: NoteInput & { context_id?: string }, existingId?: string) => {
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
    setEditingDraft(null)
    setIsEditorOpen(true)
  }

  const handleOpenDraft = (draft: Note) => {
    // Open a draft for editing - treat it like editing a note but it's a draft
    setEditingNote(draft)
    setEditingDraft(draft)
    setIsEditorOpen(true)
  }

  // Save content as a draft to the database
  const handleSaveDraft = async (title: string, content: string, existingDraftId?: string) => {
    const { draft: savedDraft, error } = await saveDraftAction(
      { title, content },
      existingDraftId
    )
    if (!error && savedDraft) {
      // Update local drafts list
      setDrafts(prev => {
        const existing = prev.find(d => d.id === savedDraft.id)
        if (existing) {
          return prev.map(d => d.id === savedDraft.id ? savedDraft : d)
        }
        return [savedDraft, ...prev]
      })
      setEditingDraft(savedDraft)
      return savedDraft
    }
    return null
  }

  // Delete a draft from the database
  const handleDeleteDraft = async (draftId: string) => {
    const { error } = await deleteNoteAction(draftId)
    if (!error) {
      setDrafts(prev => prev.filter(d => d.id !== draftId))
      setEditingDraft(null)
      showSuccess("Draft deleted")
    } else {
      showError(new Error(error), "Failed to delete draft")
    }
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
    if (selectedFilter === "drafts") return "Drafts"
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

            {/* Drafts section - show if there are any drafts */}
            {drafts.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-xs font-semibold uppercase text-amber-500 tracking-wider">
                    Drafts
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                    {drafts.length}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => handleOpenDraft(draft)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 w-full text-left group",
                        editingDraft?.id === draft.id
                          ? "glass-button-primary text-primary-foreground shadow-sm"
                          : "hover:bg-[var(--glass-hover-bg)] text-foreground bg-amber-500/5 border border-amber-500/10"
                      )}
                    >
                      <FilePenLine className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {draft.title?.trim() || "Untitled Draft"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDraft(draft.id)
                        }}
                        title="Delete draft"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </button>
                  ))}
                </div>
                <div className="my-2 border-t border-[var(--glass-sidebar-border)]" />
              </>
            )}

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
                if (value === "all" || value === "unfiled" || value === "drafts") {
                  setSelectedFilter(value as FilterType)
                } else if (value.startsWith("folder:")) {
                  setSelectedFilter({ folderId: value.replace("folder:", "") })
                } else if (value.startsWith("draft:")) {
                  const draftId = value.replace("draft:", "")
                  const selectedDraft = drafts.find(d => d.id === draftId)
                  if (selectedDraft) {
                    handleOpenDraft(selectedDraft)
                  }
                }
              }}
              className="w-full h-10 rounded-xl glass-input px-3 text-sm"
            >
              <option value="all">All Notes ({notes.length})</option>
              {drafts.length > 0 && (
                <optgroup label={`Drafts (${drafts.length})`}>
                  {drafts.map((draft) => (
                    <option key={draft.id} value={`draft:${draft.id}`}>
                      {draft.title?.trim() || "Untitled Draft"}
                    </option>
                  ))}
                </optgroup>
              )}
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <EnhancedNoteEditor
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingNote(null)
          setEditingDraft(null)
        }}
        onSave={async (noteInput, existingId) => {
          // If this was a draft, publish it (convert to regular note)
          if (editingDraft && existingId) {
            const { note, error } = await publishDraftAction(existingId, noteInput)
            if (!error && note) {
              setNotes(prev => [note, ...prev])
              setDrafts(prev => prev.filter(d => d.id !== existingId))
              showSuccess("Note published")
            } else {
              showError(new Error(error || "Failed to publish"), "Error")
            }
          } else {
            handleSaveNote(noteInput, existingId)
          }
          setEditingDraft(null)
        }}
        onSaveDraft={handleSaveDraft}
        contexts={contexts}
        availableThoughts={availableThoughts}
        hasAIConsent={hasAIConsent}
        isDraft={!!editingDraft}
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
