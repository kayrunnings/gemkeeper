"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Folder } from "@/lib/types"
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
  Folder as FolderIcon,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileX,
  X,
  Check,
  Loader2,
  Gem,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type FilterType = "all" | "favorites" | "unfiled" | { folderId: string }

interface SidebarProps {
  folders: Folder[]
  selectedFilter: FilterType
  onFilterSelect: (filter: FilterType) => void
  onCreateFolder: (name: string) => Promise<void>
  onRenameFolder: (folderId: string, name: string) => Promise<void>
  onDeleteFolder: (folderId: string) => Promise<void>
  noteCounts?: { [key: string]: number }
  favoritesCount?: number // Kept for backwards compatibility but not used
  allNotesCount?: number
  unfiledCount?: number
}

export function Sidebar({
  folders,
  selectedFilter,
  onFilterSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  noteCounts = {},
  allNotesCount = 0,
  unfiledCount = 0,
}: SidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isSelected = (filter: FilterType) => {
    if (typeof selectedFilter === "string" && typeof filter === "string") {
      return selectedFilter === filter
    }
    if (typeof selectedFilter === "object" && typeof filter === "object") {
      return selectedFilter.folderId === filter.folderId
    }
    return false
  }

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim()
    if (!trimmedName || isLoading) return

    setIsLoading(true)
    try {
      await onCreateFolder(trimmedName)
      setNewFolderName("")
      setIsCreatingFolder(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartRename = (folder: Folder) => {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  const handleRenameFolder = async () => {
    if (!editingFolderId || isLoading) return
    const trimmedName = editingFolderName.trim()
    if (!trimmedName) {
      handleCancelRename()
      return
    }

    setIsLoading(true)
    try {
      await onRenameFolder(editingFolderId, trimmedName)
      setEditingFolderId(null)
      setEditingFolderName("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRename = () => {
    setEditingFolderId(null)
    setEditingFolderName("")
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm("Are you sure you want to delete this folder? Notes in this folder will become unfiled.")) {
      return
    }
    await onDeleteFolder(folderId)
  }

  // Handle keyboard events for folder creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCreatingFolder) {
          setIsCreatingFolder(false)
          setNewFolderName("")
        }
        if (editingFolderId) {
          handleCancelRename()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isCreatingFolder, editingFolderId])

  return (
    <aside className="w-64 border-r border-[var(--glass-sidebar-border)] bg-[var(--glass-sidebar-bg)] backdrop-blur-xl p-4 flex flex-col gap-1 h-full overflow-y-auto">
      {/* All Notes */}
      <button
        onClick={() => onFilterSelect("all")}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
          isSelected("all")
            ? "glass-button-primary text-primary-foreground shadow-sm"
            : "hover:bg-[var(--glass-hover-bg)] text-foreground"
        )}
      >
        <StickyNote className="h-4 w-4" />
        <span className="flex-1">All Notes</span>
        <span className="text-xs opacity-70">{allNotesCount}</span>
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
            }}
            onBlur={() => {
              if (newFolderName.trim()) {
                handleCreateFolder()
              } else {
                setIsCreatingFolder(false)
                setNewFolderName("")
              }
            }}
            placeholder="Folder name"
            className="h-7 text-sm"
            autoFocus
            disabled={isLoading}
            maxLength={100}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleCreateFolder}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              setIsCreatingFolder(false)
              setNewFolderName("")
            }}
            disabled={isLoading}
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
                    if (e.key === "Escape") handleCancelRename()
                  }}
                  onBlur={() => {
                    if (editingFolderName.trim()) {
                      handleRenameFolder()
                    } else {
                      handleCancelRename()
                    }
                  }}
                  className="h-7 text-sm"
                  autoFocus
                  disabled={isLoading}
                  maxLength={100}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleRenameFolder}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleCancelRename}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onFilterSelect({ folderId: folder.id })}
                onDoubleClick={(e) => {
                  e.preventDefault()
                  handleStartRename(folder)
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left pr-8",
                  isSelected({ folderId: folder.id })
                    ? "glass-button-primary text-primary-foreground shadow-sm"
                    : "hover:bg-[var(--glass-hover-bg)] text-foreground"
                )}
              >
                <FolderIcon className="h-4 w-4" />
                <span className="flex-1 truncate">{folder.name}</span>
                <span className="text-xs opacity-70">
                  {noteCounts[folder.id] || 0}
                </span>
              </button>
            )}

            {/* Context menu - only show when not editing */}
            {editingFolderId !== folder.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                      isSelected({ folderId: folder.id }) && "text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20"
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

      {/* Empty state for folders */}
      {folders.length === 0 && !isCreatingFolder && (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No folders yet
        </p>
      )}

      {/* Divider */}
      <div className="my-2 border-t border-[var(--glass-sidebar-border)]" />

      {/* Unfiled */}
      <button
        onClick={() => onFilterSelect("unfiled")}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
          isSelected("unfiled")
            ? "glass-button-primary text-primary-foreground shadow-sm"
            : "hover:bg-[var(--glass-hover-bg)] text-foreground"
        )}
      >
        <FileX className="h-4 w-4" />
        <span className="flex-1">Unfiled</span>
        <span className="text-xs opacity-70">{unfiledCount}</span>
      </button>

      {/* Divider */}
      <div className="my-2 border-t border-[var(--glass-sidebar-border)]" />

      {/* Thoughts link */}
      <Link
        href="/thoughts"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left hover:bg-[var(--glass-hover-bg)] text-foreground"
      >
        <Gem className="h-4 w-4" />
        <span className="flex-1">Thoughts</span>
      </Link>
    </aside>
  )
}
