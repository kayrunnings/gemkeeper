"use client"

import { useState, useEffect, useCallback } from "react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Paperclip,
  X,
  Link2,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileAudio,
  FileVideo,
  Upload,
  Lightbulb,
  Plus,
  Trash2,
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

interface EnhancedNoteEditorProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (note: NoteInput & { context_id?: string }, existingId?: string) => void
  contexts?: Context[]
  availableThoughts?: Thought[]
  hasAIConsent?: boolean
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
}: EnhancedNoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [linkedThoughts, setLinkedThoughts] = useState<Thought[]>([])
  const [linkingThought, setLinkingThought] = useState(false)
  const [showThoughtPicker, setShowThoughtPicker] = useState(false)
  const [thoughtSearchQuery, setThoughtSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("edit")
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (note) {
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
        setTitle("")
        setContent("")
        setSelectedContextId(null)
        setAttachments([])
        setLinkedThoughts([])
      }
      setActiveTab("edit")
    }
  }, [isOpen, note])

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
      <DialogContent className="sm:max-w-6xl w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">{note ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
            <TabsTrigger value="links">
              Links {linkedThoughts.length > 0 && `(${linkedThoughts.length})`}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            {/* Edit Tab */}
            <TabsContent value="edit" className="mt-0 space-y-4 h-full flex flex-col">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Context selector */}
              {contexts.length > 0 && (
                <div className="space-y-2">
                  <Label>Context (optional)</Label>
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
                </div>
              )}

              {/* Rich text editor */}
              <div className="space-y-2 flex-1 flex flex-col">
                <Label>Content</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  onAIAssist={hasAIConsent ? handleAIAssist : undefined}
                  placeholder="Start writing your note..."
                  className="flex-1 min-h-[400px]"
                  editorClassName="min-h-[350px]"
                />
              </div>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-0 space-y-4">
              {/* Upload button */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
                  />
                </label>
                <span className="text-sm text-muted-foreground">
                  Max 10 files, 10MB each
                </span>
              </div>

              {/* Attachments list */}
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        att.error && "border-destructive bg-destructive/10"
                      )}
                    >
                      {att.preview ? (
                        <img
                          src={att.preview}
                          alt={att.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                          {getFileIcon(att.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.size)}
                        </p>
                        {att.error && (
                          <p className="text-xs text-destructive">{att.error}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No attachments yet</p>
                  <p className="text-sm">Upload images, documents, or media files</p>
                </div>
              )}
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="mt-0 space-y-4">
              {/* Linked thoughts section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Linked Thoughts
                  </Label>
                  {note?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowThoughtPicker(true)}
                      disabled={linkingThought}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Link Thought
                    </Button>
                  )}
                </div>

                {!note?.id && (
                  <p className="text-sm text-muted-foreground">
                    Save the note first to link thoughts.
                  </p>
                )}

                {linkedThoughts.length > 0 ? (
                  <div className="space-y-2">
                    {linkedThoughts.map((thought) => (
                      <div
                        key={thought.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <Lightbulb className="h-4 w-4 mt-1 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{thought.content}</p>
                          {thought.source && (
                            <p className="text-xs text-muted-foreground mt-1">
                              From: {thought.source}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnlinkThought(thought.id)}
                          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  note?.id && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No linked thoughts</p>
                      <p className="text-sm">Connect related thoughts to this note</p>
                    </div>
                  )
                )}
              </div>

              {/* Thought picker dialog */}
              {showThoughtPicker && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label>Select a thought to link</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowThoughtPicker(false)
                        setThoughtSearchQuery("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Search thoughts..."
                    value={thoughtSearchQuery}
                    onChange={(e) => setThoughtSearchQuery(e.target.value)}
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredThoughts.length > 0 ? (
                      filteredThoughts.slice(0, 20).map((thought) => (
                        <button
                          key={thought.id}
                          onClick={() => handleLinkThought(thought)}
                          disabled={linkingThought}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <p className="text-sm line-clamp-2">{thought.content}</p>
                          {thought.source && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {thought.source}
                            </p>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No thoughts available to link
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
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
