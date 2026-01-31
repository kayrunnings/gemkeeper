"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Note, NoteInput, Folder } from "@/lib/types"
import { Thought, ContextTag, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS, CONTEXT_TAG_DOT_COLORS } from "@/lib/types/thought"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Paperclip,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileAudio,
  FileVideo,
  Upload,
  Lightbulb,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Wand2,
  Link2,
  Minimize2,
  Save,
  Folder as FolderIcon,
  FolderPlus,
  Check,
  RefreshCw,
  Pencil,
  FileX,
  BookOpen,
} from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"
import { cn } from "@/lib/utils"
import { linkThoughtToNote, unlinkThoughtFromNote, getLinkedThoughts } from "@/lib/note-links"
import { getNoteSourceIds, setNoteSources, getNoteSources } from "@/lib/note-sources"
import { MultiSourceSelector } from "@/components/sources/SourceSelector"
import type { Source } from "@/lib/types/source"

interface Context {
  id: string
  name: string
  color: string
  slug: string
}

interface ExtractedThought {
  content: string
  context_tag: string
  source_quote?: string
  isEditing?: boolean
  editedContent?: string
  editedContextTag?: string
}

interface EnhancedNoteEditorProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (note: NoteInput & { context_id?: string; folder_id?: string | null }, existingId?: string) => void
  contexts?: Context[]
  availableThoughts?: Thought[]
  hasAIConsent?: boolean
  // Database-backed draft support
  onSaveDraft?: (title: string, content: string, existingDraftId?: string) => Promise<Note | null>
  isDraft?: boolean
  // Folder support
  folders?: Folder[]
  onCreateFolder?: (name: string) => Promise<Folder | null>
  // Pre-select sources when creating a new note (e.g., from source details page)
  defaultSourceIds?: string[]
}

interface AttachmentFile {
  id?: string
  file?: File
  preview?: string
  name: string
  type: string
  size: number
  uploading?: boolean
  error?: string
}

export function EnhancedNoteEditor({
  note,
  isOpen,
  onClose,
  onSave,
  contexts = [],
  availableThoughts = [],
  hasAIConsent = false,
  onSaveDraft,
  isDraft = false,
  folders = [],
  onCreateFolder,
  defaultSourceIds = [],
}: EnhancedNoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [linkedThoughts, setLinkedThoughts] = useState<Thought[]>([])
  const [linkingThought, setLinkingThought] = useState(false)
  const [showThoughtPicker, setShowThoughtPicker] = useState(false)
  const [thoughtSearchQuery, setThoughtSearchQuery] = useState("")
  const [linkedSourceIds, setLinkedSourceIds] = useState<string[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(undefined)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingDraftRef = useRef(false)

  // Folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isFolderLoading, setIsFolderLoading] = useState(false)

  // Collapsible sections state
  const [attachmentsOpen, setAttachmentsOpen] = useState(true)
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const [thoughtsOpen, setThoughtsOpen] = useState(true)
  const [extractedOpen, setExtractedOpen] = useState(true)

  // AI extraction state
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedThoughts, setExtractedThoughts] = useState<ExtractedThought[]>([])
  const [selectedExtracted, setSelectedExtracted] = useState<Set<number>>(new Set())
  const [isSavingExtracted, setIsSavingExtracted] = useState(false)

  // Create thought from selection state
  const [selectedText, setSelectedText] = useState("")
  const [showCreateThought, setShowCreateThought] = useState(false)
  const [newThoughtContent, setNewThoughtContent] = useState("")
  const [newThoughtContextTag, setNewThoughtContextTag] = useState<ContextTag>("other")
  const [isCreatingThought, setIsCreatingThought] = useState(false)

  // Initialize draft ID when editing a draft
  useEffect(() => {
    if (note?.is_draft) {
      setCurrentDraftId(note.id)
    } else if (!note) {
      setCurrentDraftId(undefined)
    }
  }, [note])

  // Auto-save draft to database when content changes (debounced)
  useEffect(() => {
    if (!isOpen || !onSaveDraft) return
    if (!title.trim() && !content.trim()) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new auto-save timer (save after 3 seconds of inactivity)
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isSavingDraftRef.current) return
      isSavingDraftRef.current = true

      try {
        const savedDraft = await onSaveDraft(title, content, currentDraftId)
        if (savedDraft) {
          setCurrentDraftId(savedDraft.id)
          setDraftSaved(true)
          // Reset the saved indicator after 2 seconds
          setTimeout(() => setDraftSaved(false), 2000)
        }
      } finally {
        isSavingDraftRef.current = false
      }
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, content, isOpen, onSaveDraft, currentDraftId])

  // Handle minimize - save draft to database and close
  const handleMinimize = useCallback(async () => {
    if (!onSaveDraft) {
      onClose()
      return
    }

    // Save draft before closing
    if (title.trim() || content.trim()) {
      isSavingDraftRef.current = true
      try {
        const savedDraft = await onSaveDraft(title, content, currentDraftId)
        if (savedDraft) {
          setCurrentDraftId(savedDraft.id)
        }
      } finally {
        isSavingDraftRef.current = false
      }
    }
    onClose()
  }, [title, content, currentDraftId, onSaveDraft, onClose])

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title || "")
        setContent(note.content || "")
        setSelectedFolderId(note.folder_id || null)
        // Set draft ID if this is a draft
        if (note.is_draft) {
          setCurrentDraftId(note.id)
        }
        // Load existing attachments
        if (note.attachments) {
          setAttachments(
            note.attachments.map((att) => ({
              id: att.id,
              name: att.file_name,
              type: att.file_type,
              size: att.file_size,
            }))
          )
        } else {
          setAttachments([])
        }
        // Load linked thoughts and sources
        loadLinkedThoughts(note.id)
        loadLinkedSources(note.id)
      } else {
        // New note - reset everything
        setTitle("")
        setContent("")
        setSelectedFolderId(null)
        setAttachments([])
        setLinkedThoughts([])
        // Use default sources if provided (e.g., when creating from source details page)
        setLinkedSourceIds(defaultSourceIds)
        setCurrentDraftId(undefined)
      }
      setExtractedThoughts([])
      setSelectedExtracted(new Set())
      setShowCreateThought(false)
      setNewThoughtContent("")
      setSelectedText("")
    }
  }, [isOpen, note, defaultSourceIds])

  const loadLinkedThoughts = async (noteId: string) => {
    const { data, error } = await getLinkedThoughts(noteId)
    if (!error && data) {
      setLinkedThoughts(data)
    }
  }

  const loadLinkedSources = async (noteId: string) => {
    setIsLoadingSources(true)
    const { data, error } = await getNoteSourceIds(noteId)
    if (!error && data) {
      setLinkedSourceIds(data)
    }
    setIsLoadingSources(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const noteData: NoteInput & { folder_id?: string | null } = {
        title: title.trim() || "Untitled",
        content,
        folder_id: selectedFolderId,
      }
      // Pass note ID (or draft ID if editing a draft)
      const existingId = note?.id || currentDraftId

      // Save the note first
      onSave(noteData, existingId)

      // If we have an existing note ID, save the source links
      if (existingId) {
        await setNoteSources(existingId, linkedSourceIds)
      }

      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  // Handle creating a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !onCreateFolder || isFolderLoading) return
    setIsFolderLoading(true)
    try {
      const folder = await onCreateFolder(newFolderName.trim())
      if (folder) {
        setSelectedFolderId(folder.id)
        setNewFolderName("")
        setIsCreatingFolder(false)
      }
    } finally {
      setIsFolderLoading(false)
    }
  }

  // Handle text selection in editor
  const handleTextSelect = useCallback((text: string) => {
    if (text.trim()) {
      setSelectedText(text)
    }
  }, [])

  // Create thought from selected or entered text
  const handleCreateThought = async () => {
    const thoughtContent = newThoughtContent.trim() || selectedText.trim()
    if (!thoughtContent || isCreatingThought) return

    setIsCreatingThought(true)
    try {
      const response = await fetch("/api/gems/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gems: [{
            content: thoughtContent.substring(0, 200),
            context_tag: newThoughtContextTag,
            source: title || "Note",
            is_on_active_list: false,
          }]
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Link the created thought to the note if note exists
        if (note?.id && data.gems?.[0]?.id) {
          await linkThoughtToNote(note.id, data.gems[0].id)
          await loadLinkedThoughts(note.id)
        }
        setShowCreateThought(false)
        setNewThoughtContent("")
        setSelectedText("")
        setNewThoughtContextTag("other")
      }
    } catch (error) {
      console.error("Error creating thought:", error)
    } finally {
      setIsCreatingThought(false)
    }
  }

  // Toggle editing mode for an extracted thought
  const handleEditExtracted = (index: number) => {
    setExtractedThoughts(prev => prev.map((t, i) =>
      i === index
        ? { ...t, isEditing: true, editedContent: t.content, editedContextTag: t.context_tag }
        : t
    ))
  }

  // Save edited extracted thought
  const handleSaveEditedExtracted = (index: number) => {
    setExtractedThoughts(prev => prev.map((t, i) =>
      i === index
        ? {
            ...t,
            content: t.editedContent || t.content,
            context_tag: t.editedContextTag || t.context_tag,
            isEditing: false
          }
        : t
    ))
  }

  // Cancel editing extracted thought
  const handleCancelEditExtracted = (index: number) => {
    setExtractedThoughts(prev => prev.map((t, i) =>
      i === index ? { ...t, isEditing: false } : t
    ))
  }

  // Update edited content for extracted thought
  const handleUpdateExtractedContent = (index: number, content: string) => {
    setExtractedThoughts(prev => prev.map((t, i) =>
      i === index ? { ...t, editedContent: content } : t
    ))
  }

  // Update edited context tag for extracted thought
  const handleUpdateExtractedContextTag = (index: number, contextTag: string) => {
    setExtractedThoughts(prev => prev.map((t, i) =>
      i === index ? { ...t, editedContextTag: contextTag } : t
    ))
  }

  const handleAIAssist = useCallback(async (prompt: string, text: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai/write-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, text }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "AI assist failed")
      }

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error("AI assist error:", error)
      return ""
    }
  }, [])

  const handleExtractThoughts = async (append: boolean = false) => {
    if (!content.trim() || !hasAIConsent) return

    setIsExtracting(true)
    if (!append) {
      setExtractedThoughts([])
      setSelectedExtracted(new Set())
    }

    try {
      // Strip HTML tags for extraction
      const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textContent,
          source: title || "Note"
        }),
      })

      if (!response.ok) {
        throw new Error("Extraction failed")
      }

      const data = await response.json()
      if (data.thoughts && data.thoughts.length > 0) {
        if (append) {
          const existingCount = extractedThoughts.length
          setExtractedThoughts(prev => [...prev, ...data.thoughts])
          // Select all new thoughts by default
          setSelectedExtracted(prev => {
            const newSet = new Set(prev)
            data.thoughts.forEach((_: ExtractedThought, i: number) => newSet.add(existingCount + i))
            return newSet
          })
        } else {
          setExtractedThoughts(data.thoughts)
          // Select all by default
          setSelectedExtracted(new Set(data.thoughts.map((_: ExtractedThought, i: number) => i)))
        }
      }
    } catch (error) {
      console.error("Extract error:", error)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveExtractedThoughts = async () => {
    if (selectedExtracted.size === 0) return

    setIsSavingExtracted(true)
    const thoughtsToSave = extractedThoughts
      .filter((_, i) => selectedExtracted.has(i))
      .map(t => ({
        content: t.content,
        context_tag: t.context_tag,
        source: title || "Note",
        source_quote: t.source_quote,
        status: "passive" as const,
        is_on_active_list: false,
      }))

    try {
      const response = await fetch("/api/gems/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gems: thoughtsToSave }),
      })

      if (response.ok) {
        const data = await response.json()
        // Link the created thoughts to the note if note exists
        if (note?.id && data.gems?.length > 0) {
          for (const gem of data.gems) {
            await linkThoughtToNote(note.id, gem.id)
          }
          await loadLinkedThoughts(note.id)
        }
        // Remove saved thoughts from extracted list
        setExtractedThoughts(prev => prev.filter((_, i) => !selectedExtracted.has(i)))
        setSelectedExtracted(new Set())
      }
    } catch (error) {
      console.error("Save extracted thoughts error:", error)
    } finally {
      setIsSavingExtracted(false)
    }
  }

  // Extract more thoughts (keep existing ones)
  const handleExtractMore = async () => {
    await handleExtractThoughts(true)
  }

  // Try again (replace existing extracted thoughts)
  const handleTryAgain = async () => {
    setExtractedThoughts([])
    setSelectedExtracted(new Set())
    await handleExtractThoughts(false)
  }

  const toggleExtractedSelection = (index: number) => {
    const newSelected = new Set(selectedExtracted)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedExtracted(newSelected)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: AttachmentFile[] = []

    for (const file of Array.from(files)) {
      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        newAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          error: "File too large (max 10MB)",
        })
        continue
      }

      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined

      newAttachments.push({
        file,
        preview,
        name: file.name,
        type: file.type,
        size: file.size,
      })
    }

    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 10))
    e.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev]
      const removed = newAttachments.splice(index, 1)[0]
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newAttachments
    })
  }

  const handleLinkThought = async (thought: Thought) => {
    if (!note?.id) return

    setLinkingThought(true)
    try {
      const { error } = await linkThoughtToNote(note.id, thought.id)
      if (!error) {
        setLinkedThoughts((prev) => [...prev, thought])
      }
    } finally {
      setLinkingThought(false)
      setShowThoughtPicker(false)
      setThoughtSearchQuery("")
    }
  }

  const handleUnlinkThought = async (thoughtId: string) => {
    if (!note?.id) return

    const { error } = await unlinkThoughtFromNote(note.id, thoughtId)
    if (!error) {
      setLinkedThoughts((prev) => prev.filter((t) => t.id !== thoughtId))
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
    if (type.startsWith("video/")) return <FileVideo className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredThoughts = availableThoughts.filter((thought) => {
    // Filter out already linked thoughts
    if (linkedThoughts.some((lt) => lt.id === thought.id)) return false
    // Filter by search query
    if (thoughtSearchQuery) {
      return thought.content.toLowerCase().includes(thoughtSearchQuery.toLowerCase())
    }
    return true
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-7xl w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        <DialogHeader className="shrink-0 px-6 pt-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{note ? "Edit Note" : "New Note"}</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Draft saved indicator */}
              {draftSaved && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
              {/* Close button - saves draft and closes */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleMinimize}
              >
                <X className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Close</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Draft indicator banner */}
        {isDraft && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2">
            <Save className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning">
              Editing draft - changes auto-save. Click &quot;Publish Note&quot; when ready.
            </span>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed header area: Title and folder */}
            <div className="shrink-0 px-6 pt-6 pb-4 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Input
                  id="title"
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
              </div>

              {/* Folder selector */}
              {folders.length > 0 && (
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 text-muted-foreground" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        {selectedFolderId
                          ? folders.find(f => f.id === selectedFolderId)?.name || "Select folder"
                          : "No folder"
                        }
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => setSelectedFolderId(null)}>
                        <FileX className="h-4 w-4 mr-2" />
                        Unfiled
                        {!selectedFolderId && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {folders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => setSelectedFolderId(folder.id)}
                        >
                          <FolderIcon className="h-4 w-4 mr-2" />
                          {folder.name}
                          {selectedFolderId === folder.id && <Check className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                      ))}
                      {onCreateFolder && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setIsCreatingFolder(true)}>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            New folder...
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* New folder creation inline */}
              {isCreatingFolder && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                  <FolderPlus className="h-4 w-4 text-muted-foreground" />
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
                    className="h-7 text-sm flex-1"
                    autoFocus
                    disabled={isFolderLoading}
                    maxLength={100}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCreateFolder}
                    disabled={isFolderLoading}
                  >
                    {isFolderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
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
            </div>

            {/* Rich text editor - takes remaining space */}
            <div className="flex-1 overflow-hidden px-6 pb-6">
              <RichTextEditor
                content={content}
                onChange={setContent}
                onAIAssist={hasAIConsent ? handleAIAssist : undefined}
                onTextSelect={handleTextSelect}
                placeholder="Start writing your note..."
                className="h-full"
                editorClassName="min-h-[350px]"
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l bg-muted/30 overflow-y-auto p-4 space-y-4 hidden lg:block">
            {/* Attachments Section */}
            <Collapsible open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span className="font-medium">Attachments</span>
                  {attachments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {attachments.length}
                    </Badge>
                  )}
                </div>
                {attachmentsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {/* Upload button */}
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
                  />
                </label>

                {/* Attachments list */}
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border bg-background",
                      att.error && "border-destructive bg-destructive/10"
                    )}
                  >
                    {att.preview ? (
                      <img
                        src={att.preview}
                        alt={att.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                        {getFileIcon(att.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(att.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {attachments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No attachments
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Sources Section */}
            <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Sources</span>
                  {linkedSourceIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {linkedSourceIds.length}
                    </Badge>
                  )}
                </div>
                {sourcesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {isLoadingSources ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <MultiSourceSelector
                    selectedSourceIds={linkedSourceIds}
                    onSourcesChange={setLinkedSourceIds}
                    placeholder="Link sources..."
                    allowCreate={true}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Link this note to books, articles, or other sources
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* Linked Thoughts Section */}
            <Collapsible open={thoughtsOpen} onOpenChange={setThoughtsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium">Linked Thoughts</span>
                  {linkedThoughts.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {linkedThoughts.length}
                    </Badge>
                  )}
                </div>
                {thoughtsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {/* Actions */}
                <div className="flex gap-2">
                  {note?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setShowThoughtPicker(true)}
                      disabled={linkingThought}
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Link
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs border-warning/50 text-warning hover:bg-warning/10"
                    onClick={() => setShowCreateThought(true)}
                    disabled={showCreateThought || !!selectedText}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create
                  </Button>
                </div>

                {!note?.id && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Save note first to link thoughts
                  </p>
                )}

                {/* Linked thoughts list */}
                {linkedThoughts.map((thought) => (
                  <div
                    key={thought.id}
                    className="flex items-start gap-2 p-2 rounded-lg border bg-background"
                  >
                    <Lightbulb className="h-3 w-3 mt-1 text-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-2">{thought.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleUnlinkThought(thought.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {linkedThoughts.length === 0 && note?.id && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No linked thoughts
                  </p>
                )}

                {/* Thought picker */}
                {showThoughtPicker && (
                  <div className="border rounded-lg p-2 bg-background space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Select thought</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setShowThoughtPicker(false)
                          setThoughtSearchQuery("")
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Search..."
                      value={thoughtSearchQuery}
                      onChange={(e) => setThoughtSearchQuery(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredThoughts.length > 0 ? (
                        filteredThoughts.slice(0, 10).map((thought) => (
                          <button
                            key={thought.id}
                            onClick={() => handleLinkThought(thought)}
                            disabled={linkingThought}
                            className="w-full text-left p-2 rounded border text-xs hover:bg-muted transition-colors line-clamp-2"
                          >
                            {thought.content}
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No thoughts found
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Create thought from selection or manual entry */}
                {(selectedText || showCreateThought) && (
                  <div className="border rounded-lg p-2 bg-warning/5 border-warning/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-warning">
                        {selectedText ? "Create from selection" : "Create new thought"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setShowCreateThought(false)
                          setSelectedText("")
                          setNewThoughtContent("")
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={newThoughtContent || selectedText}
                      onChange={(e) => setNewThoughtContent(e.target.value)}
                      placeholder="Enter thought content..."
                      className="min-h-[60px] text-xs resize-none"
                      maxLength={200}
                    />
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-1 justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                CONTEXT_TAG_DOT_COLORS[newThoughtContextTag]
                              )} />
                              {CONTEXT_TAG_LABELS[newThoughtContextTag]}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          {Object.entries(CONTEXT_TAG_LABELS).map(([value, label]) => (
                            <DropdownMenuItem
                              key={value}
                              onClick={() => setNewThoughtContextTag(value as ContextTag)}
                              className={cn("gap-2", newThoughtContextTag === value && "bg-muted")}
                            >
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                CONTEXT_TAG_DOT_COLORS[value as ContextTag]
                              )} />
                              {label}
                              {newThoughtContextTag === value && <Check className="h-3 w-3 ml-auto" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-warning hover:bg-warning/90 text-warning-foreground"
                        onClick={handleCreateThought}
                        disabled={isCreatingThought || (!newThoughtContent.trim() && !selectedText.trim())}
                      >
                        {isCreatingThought ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              </CollapsibleContent>
            </Collapsible>

            {/* AI Extracted Thoughts Section */}
            {hasAIConsent && (
              <Collapsible open={extractedOpen} onOpenChange={setExtractedOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-highlight" />
                    <span className="font-medium">AI Extraction</span>
                    {extractedThoughts.length > 0 && (
                      <Badge variant="secondary" className="text-xs bg-highlight/20 text-highlight">
                        {extractedThoughts.length}
                      </Badge>
                    )}
                  </div>
                  {extractedOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {/* Extract actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-highlight/50 text-highlight hover:bg-highlight/10"
                      onClick={() => handleExtractThoughts(false)}
                      disabled={isExtracting || !content.trim()}
                    >
                      {isExtracting ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1" />
                      )}
                      Extract
                    </Button>
                    {extractedThoughts.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleExtractMore()}
                          disabled={isExtracting}
                          title="Extract more thoughts"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTryAgain()}
                          disabled={isExtracting}
                          title="Try again"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Extracted thoughts list */}
                  {extractedThoughts.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {selectedExtracted.size} of {extractedThoughts.length} selected
                        </span>
                        <Button
                          size="sm"
                          className="h-6 text-xs bg-highlight hover:bg-highlight/90 text-highlight-foreground"
                          onClick={handleSaveExtractedThoughts}
                          disabled={selectedExtracted.size === 0 || isSavingExtracted}
                        >
                          {isSavingExtracted ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {extractedThoughts.map((thought, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-2 rounded-lg border transition-colors",
                              selectedExtracted.has(index)
                                ? "bg-highlight/20 border-highlight/50"
                                : "bg-background hover:bg-muted border-border"
                            )}
                          >
                            {thought.isEditing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={thought.editedContent || ""}
                                  onChange={(e) => handleUpdateExtractedContent(index, e.target.value)}
                                  className="min-h-[50px] text-xs resize-none"
                                  maxLength={200}
                                />
                                <div className="flex items-center gap-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-6 text-xs flex-1 justify-between gap-1">
                                        <span className="flex items-center gap-1.5">
                                          <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            thought.editedContextTag && CONTEXT_TAG_DOT_COLORS[thought.editedContextTag as ContextTag]
                                          )} />
                                          {CONTEXT_TAG_LABELS[thought.editedContextTag as ContextTag] || thought.editedContextTag}
                                        </span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-44">
                                      {Object.entries(CONTEXT_TAG_LABELS).map(([value, label]) => (
                                        <DropdownMenuItem
                                          key={value}
                                          onClick={() => handleUpdateExtractedContextTag(index, value)}
                                          className={cn("gap-2", thought.editedContextTag === value && "bg-muted")}
                                        >
                                          <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            CONTEXT_TAG_DOT_COLORS[value as ContextTag]
                                          )} />
                                          {label}
                                          {thought.editedContextTag === value && <Check className="h-3 w-3 ml-auto" />}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleSaveEditedExtracted(index)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleCancelEditExtracted(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                  <button
                                    onClick={() => toggleExtractedSelection(index)}
                                    className={cn(
                                      "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                      selectedExtracted.has(index)
                                        ? "bg-highlight border-highlight"
                                        : "border-border hover:border-highlight"
                                    )}
                                  >
                                    {selectedExtracted.has(index) && <Check className="h-2.5 w-2.5 text-white" />}
                                  </button>
                                  <p className="text-xs flex-1 line-clamp-2">{thought.content}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 shrink-0"
                                    onClick={() => handleEditExtracted(index)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", CONTEXT_TAG_COLORS[thought.context_tag as ContextTag])}
                                >
                                  {CONTEXT_TAG_LABELS[thought.context_tag as ContextTag] || thought.context_tag}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {extractedThoughts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Extract thoughts from your note content using AI
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isDraft ? "Publishing..." : "Saving..."}
              </>
            ) : isDraft ? (
              "Publish Note"
            ) : note ? (
              "Save Changes"
            ) : (
              "Create Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
