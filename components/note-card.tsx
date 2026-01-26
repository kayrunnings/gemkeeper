"use client"

import { Note, Folder } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Trash2, Edit, FolderIcon, FileX, Check, Sparkles } from "lucide-react"

interface NoteCardProps {
  note: Note
  folders?: Folder[]
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void
  onMoveToFolder?: (noteId: string, folderId: string | null) => void
  onExtractGems?: (note: Note) => void
}

export function NoteCard({
  note,
  folders = [],
  onEdit,
  onDelete,
  onMoveToFolder,
  onExtractGems,
}: NoteCardProps) {
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    })
  }

  // Get a plain text preview of the content (strip any markdown-like formatting)
  const getPreview = (content: string | null, maxLength: number = 120) => {
    if (!content) return ""
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
      .replace(/\*(.*?)\*/g, "$1") // Italic
      .replace(/^[-*]\s/gm, "") // List items
      .replace(/^\d+\.\s/gm, "") // Numbered lists
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText
  }

  // Get current folder name
  const currentFolder = folders.find((f) => f.id === note.folder_id)

  return (
    <Card className="group relative hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
      <div onClick={() => onEdit(note)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium pr-8 line-clamp-1">
            {note.title || "Untitled"}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(note.updated_at)}</span>
            {currentFolder && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FolderIcon className="h-3 w-3" />
                  {currentFolder.name}
                </span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Content preview */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {getPreview(note.content) || "No content"}
          </p>
        </CardContent>
      </div>

      {/* Action buttons - always visible on mobile, hover on desktop */}
      <div className="absolute bottom-3 right-3 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-[var(--glass-card-bg)] backdrop-blur-sm rounded-lg p-1 border border-[var(--glass-card-border)]">
        {/* Move to folder dropdown */}
        {onMoveToFolder && folders.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
                aria-label="Move to folder"
              >
                <FolderIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onMoveToFolder(note.id, folder.id)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4" />
                    {folder.name}
                  </span>
                  {note.folder_id === folder.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onMoveToFolder(note.id, null)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FileX className="h-4 w-4" />
                  Unfiled
                </span>
                {note.folder_id === null && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onExtractGems && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            onClick={(e) => {
              e.stopPropagation()
              onExtractGems(note)
            }}
            aria-label="Extract gems from note"
            title="Extract gems with AI"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(note)
          }}
          aria-label="Edit note"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(note.id)
          }}
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
