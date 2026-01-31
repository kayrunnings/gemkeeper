"use client"

import { useState, useRef, useEffect } from "react"
import { Note, NoteInput } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Bold, Italic, List, ListOrdered, BookOpen, Loader2 } from "lucide-react"
import { MultiSourceSelector } from "@/components/sources/SourceSelector"
import { getNoteSourceIds, setNoteSources } from "@/lib/note-sources"

interface NoteEditorProps {
  note: Note | null // null for new note, existing note for edit
  isOpen: boolean
  onClose: () => void
  onSave: (note: NoteInput, existingId?: string, sourceIds?: string[]) => void
  defaultSourceId?: string // Pre-select a source when creating from source detail page
}

export function NoteEditor({ note, isOpen, onClose, onSave, defaultSourceId }: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [sourceIds, setSourceIds] = useState<string[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(false)

  // Track the last initialized note to avoid re-initializing on re-renders
  const lastInitializedNoteRef = useRef<string | null>(null)
  const wasOpenRef = useRef(false)

  // Initialize form when dialog opens (only once per open)
  // This is a standard pattern for controlled forms that need to sync with props
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const noteId = note?.id ?? null
    const shouldInitialize = isOpen && !wasOpenRef.current

    if (shouldInitialize || (isOpen && lastInitializedNoteRef.current !== noteId)) {
      if (note) {
        setTitle(note.title || "")
        setContent(note.content || "")
        // Load existing sources for this note
        loadNoteSources(note.id)
      } else {
        setTitle("")
        setContent("")
        // If a default source is provided (e.g., from source detail page), use it
        setSourceIds(defaultSourceId ? [defaultSourceId] : [])
      }
      lastInitializedNoteRef.current = noteId
    }

    wasOpenRef.current = isOpen
  }, [note, isOpen, defaultSourceId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const loadNoteSources = async (noteId: string) => {
    setIsLoadingSources(true)
    const { data } = await getNoteSourceIds(noteId)
    setSourceIds(data)
    setIsLoadingSources(false)
  }

  const handleSave = () => {
    onSave(
      {
        title: title.trim() || "Untitled",
        content,
      },
      note?.id,
      sourceIds
    )
    onClose()
  }

  // Simple formatting helpers (insert at cursor)
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.querySelector("textarea[name='content']") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newContent =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end)
    
    setContent(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? "Edit Note" : "New Note"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          {/* Content with formatting toolbar */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>

            {/* Formatting toolbar */}
            <div className="flex gap-1 p-1 border rounded-md bg-muted/50 w-fit">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertFormatting("**")}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertFormatting("*")}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertFormatting("\n- ", "")}
                title="Bullet list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertFormatting("\n1. ", "")}
                title="Numbered list"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              id="content"
              name="content"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-y"
            />
          </div>

          {/* Sources */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Sources (optional)
            </Label>
            {isLoadingSources ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sources...
              </div>
            ) : (
              <MultiSourceSelector
                selectedSourceIds={sourceIds}
                onSourcesChange={setSourceIds}
                placeholder="Search and link sources..."
                allowCreate={true}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Link this note to books, articles, or other sources
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {note ? "Save Changes" : "Create Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
