"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Note, NoteInput } from "@/lib/types"
import { Thought } from "@/lib/types/thought"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  Maximize2,
  Save,
} from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"
import { cn } from "@/lib/utils"
import { linkThoughtToNote, unlinkThoughtFromNote, getLinkedThoughts } from "@/lib/note-links"

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
}

interface NoteDraft {
  title: string
  content: string
  selectedContextId: string | null
  noteId?: string
  timestamp: number
}

const DRAFT_STORAGE_KEY = "gemkeeper_note_draft"

interface EnhancedNoteEditorProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (note: NoteInput & { context_id?: string }, existingId?: string) => void
  contexts?: Context[]
  availableThoughts?: Thought[]
  hasAIConsent?: boolean
  onMinimize?: (draft: NoteDraft) => void
  minimizedDraft?: NoteDraft | null
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

export type { NoteDraft }

export function EnhancedNoteEditor({
  note,
  isOpen,
  onClose,
  onSave,
  contexts = [],
  availableThoughts = [],
  hasAIConsent = false,
  onMinimize,
  minimizedDraft,
}: EnhancedNoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [linkedThoughts, setLinkedThoughts] = useState<Thought[]>([])
  const [linkingThought, setLinkingThought] = useState(false)
  const [showThoughtPicker, setShowThoughtPicker] = useState(false)
  const [thoughtSearchQuery, setThoughtSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Collapsible sections state
  const [attachmentsOpen, setAttachmentsOpen] = useState(true)
  const [thoughtsOpen, setThoughtsOpen] = useState(true)

  // AI extraction state
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedThoughts, setExtractedThoughts] = useState<ExtractedThought[]>([])
  const [selectedExtracted, setSelectedExtracted] = useState<Set<number>>(new Set())

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      setHasDraft(true)
    }
  }, [])

  // Auto-save draft when content changes
  useEffect(() => {
    if (!isOpen) return
    if (!title.trim() && !content.trim()) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new auto-save timer (save after 2 seconds of inactivity)
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft()
    }, 2000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, content, selectedContextId, isOpen])

  const saveDraft = useCallback(() => {
    if (!title.trim() && !content.trim()) return

    const draft: NoteDraft = {
      title,
      content,
      selectedContextId,
      noteId: note?.id,
      timestamp: Date.now(),
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    setDraftSaved(true)
    setHasDraft(true)
    // Reset the saved indicator after 2 seconds
    setTimeout(() => setDraftSaved(false), 2000)
  }, [title, content, selectedContextId, note?.id])

  const loadDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      const draft: NoteDraft = JSON.parse(savedDraft)
      setTitle(draft.title)
      setContent(draft.content)
      setSelectedContextId(draft.selectedContextId)
    }
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    setHasDraft(false)
  }, [])

  const handleMinimize = useCallback(() => {
    const draft: NoteDraft = {
      title,
      content,
      selectedContextId,
      noteId: note?.id,
      timestamp: Date.now(),
    }
    // Save to localStorage before minimizing
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    setHasDraft(true)
    if (onMinimize) {
      onMinimize(draft)
    }
    onClose()
  }, [title, content, selectedContextId, note?.id, onMinimize, onClose])

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Check if we have a minimized draft to restore
      if (minimizedDraft) {
        setTitle(minimizedDraft.title)
        setContent(minimizedDraft.content)
        setSelectedContextId(minimizedDraft.selectedContextId)
        if (minimizedDraft.noteId) {
          loadLinkedThoughts(minimizedDraft.noteId)
        }
      } else if (note) {
        setTitle(note.title || "")
        setContent(note.content || "")
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
        // Load linked thoughts
        loadLinkedThoughts(note.id)
      } else {
        // Check for saved draft in localStorage
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (savedDraft && !note) {
          // Offer to restore draft
          setHasDraft(true)
        }
        setTitle("")
        setContent("")
        setSelectedContextId(null)
        setAttachments([])
        setLinkedThoughts([])
      }
      setExtractedThoughts([])
      setSelectedExtracted(new Set())
    }
  }, [isOpen, note, minimizedDraft])

  const loadLinkedThoughts = async (noteId: string) => {
    const { data, error } = await getLinkedThoughts(noteId)
    if (!error && data) {
      setLinkedThoughts(data)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const noteData: NoteInput & { context_id?: string } = {
        title: title.trim() || "Untitled",
        content,
      }
      if (selectedContextId) {
        noteData.context_id = selectedContextId
      }
      onSave(noteData, note?.id)
      // Clear draft after successful save
      clearDraft()
      onClose()
    } finally {
      setIsSaving(false)
    }
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

  const handleExtractThoughts = async () => {
    if (!content.trim() || !hasAIConsent) return

    setIsExtracting(true)
    setExtractedThoughts([])
    setSelectedExtracted(new Set())

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
        setExtractedThoughts(data.thoughts)
        // Select all by default
        setSelectedExtracted(new Set(data.thoughts.map((_: ExtractedThought, i: number) => i)))
      }
    } catch (error) {
      console.error("Extract error:", error)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveExtractedThoughts = async () => {
    if (selectedExtracted.size === 0) return

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
        setExtractedThoughts([])
        setSelectedExtracted(new Set())
        // Reload linked thoughts if note exists
        if (note?.id) {
          loadLinkedThoughts(note.id)
        }
      }
    } catch (error) {
      console.error("Save extracted thoughts error:", error)
    }
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
      <DialogContent className="sm:max-w-7xl w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{note ? "Edit Note" : "New Note"}</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Draft saved indicator */}
              {draftSaved && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Save className="h-3 w-3" />
                  Draft saved
                </span>
              )}
              {/* Minimize button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMinimize}
                title="Minimize and save draft"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Draft restore banner */}
        {hasDraft && !note && !minimizedDraft && !title && !content && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-amber-500" />
              <span className="text-sm">You have an unsaved draft from a previous session.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDraft}
                className="text-xs"
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                Restore Draft
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDraft}
                className="text-xs text-muted-foreground"
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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

            {/* Context selector */}
            {contexts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contexts.map((context) => (
                  <Badge
                    key={context.id}
                    variant={selectedContextId === context.id ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedContextId === context.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    style={{
                      borderColor: context.color,
                      backgroundColor: selectedContextId === context.id ? context.color : undefined,
                    }}
                    onClick={() =>
                      setSelectedContextId(
                        selectedContextId === context.id ? null : context.id
                      )
                    }
                  >
                    {context.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Rich text editor */}
            <div className="flex-1">
              <RichTextEditor
                content={content}
                onChange={setContent}
                onAIAssist={hasAIConsent ? handleAIAssist : undefined}
                placeholder="Start writing your note..."
                className="min-h-[400px]"
                editorClassName="min-h-[350px]"
              />
            </div>

            {/* AI Features Panel */}
            {hasAIConsent && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  <span className="font-medium text-violet-700 dark:text-violet-300">AI Features</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Use AI Assist in the toolbar above to improve, simplify, expand, or continue your writing.
                  Extract thoughts from this note using the button in the sidebar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/20"
                    onClick={handleExtractThoughts}
                    disabled={isExtracting || !content.trim()}
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Extract Thoughts from Note
                  </Button>
                </div>
              </div>
            )}

            {/* Extracted Thoughts Results */}
            {extractedThoughts.length > 0 && (
              <div className="border rounded-lg p-4 bg-amber-500/5 border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      Extracted Thoughts ({selectedExtracted.size} selected)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveExtractedThoughts}
                    disabled={selectedExtracted.size === 0}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Save Selected
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {extractedThoughts.map((thought, index) => (
                    <div
                      key={index}
                      onClick={() => toggleExtractedSelection(index)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedExtracted.has(index)
                          ? "bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      <p className="text-sm">{thought.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {thought.context_tag}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  {hasAIConsent && content.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300"
                      onClick={handleExtractThoughts}
                      disabled={isExtracting}
                    >
                      {isExtracting ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1" />
                      )}
                      Extract
                    </Button>
                  )}
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
                    <Lightbulb className="h-3 w-3 mt-1 text-amber-500 shrink-0" />
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
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
