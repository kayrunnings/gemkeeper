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
import { Badge } from "@/components/ui/badge"
import { X, Bold, Italic, List, ListOrdered, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface NoteEditorProps {
  note: Note | null // null for new note, existing note for edit
  isOpen: boolean
  onClose: () => void
  onSave: (note: NoteInput, existingId?: string) => void
}

export function NoteEditor({ note, isOpen, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)

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
        setTitle(note.title)
        setContent(note.content)
        setTags(note.tags)
        setIsFavorite(note.is_favorite)
      } else {
        setTitle("")
        setContent("")
        setTags([])
        setIsFavorite(false)
      }
      setTagInput("")
      lastInitializedNoteRef.current = noteId
    }

    wasOpenRef.current = isOpen
  }, [note, isOpen])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = () => {
    onSave(
      {
        title: title.trim() || "Untitled",
        content,
        tags,
        is_favorite: isFavorite,
      },
      note?.id
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
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{note ? "Edit Note" : "New Note"}</span>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isFavorite
                  ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
            </button>
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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
              >
                Add
              </Button>
            </div>
            
            {/* Tags list */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {tags.length}/10 tags • Press Enter to add
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
