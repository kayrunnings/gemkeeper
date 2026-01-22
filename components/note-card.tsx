"use client"

import { Note, Folder } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Star, Trash2, Edit, FolderIcon, FileX, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface NoteCardProps {
  note: Note
  folders?: Folder[]
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onToggleFavorite: (noteId: string) => void
  onMoveToFolder?: (noteId: string, folderId: string | null) => void
  onExtractGems?: (note: Note) => void
}

export function NoteCard({
  note,
  folders = [],
  onEdit,
  onDelete,
  onToggleFavorite,
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
  const getPreview = (content: string, maxLength: number = 120) => {
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
      {/* Favorite indicator */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(note.id)
        }}
        className={cn(
          "absolute top-3 right-3 p-1.5 rounded-full transition-colors",
          note.is_favorite
            ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
        )}
        aria-label={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star className={cn("h-4 w-4", note.is_favorite && "fill-current")} />
      </button>

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

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {note.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Action buttons - show on hover */}
      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
