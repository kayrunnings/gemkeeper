"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save, X, Gem, StickyNote, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { CaptureItemCard } from "./CaptureItemCard"
import type { CaptureItem } from "@/lib/types/capture"
import type { ContextWithCount } from "@/lib/types/context"

interface CaptureSuggestionsProps {
  suggestions: CaptureItem[]
  contexts: ContextWithCount[]
  onSave: (items: CaptureItem[]) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function CaptureSuggestions({
  suggestions: initialSuggestions,
  contexts,
  onSave,
  onCancel,
  isSaving = false,
}: CaptureSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CaptureItem[]>(initialSuggestions)

  const selectedItems = suggestions.filter((item) => item.selected)

  // Group by type for display
  const thoughtItems = suggestions.filter((item) => item.type === 'thought')
  const noteItems = suggestions.filter((item) => item.type === 'note')
  const sourceItems = suggestions.filter((item) => item.type === 'source')

  const handleUpdateItem = (id: string, updates: Partial<CaptureItem>) => {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }

  const handleToggleSelect = (id: string, selected: boolean) => {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected } : item
      )
    )
  }

  const handleSelectAll = () => {
    setSuggestions((prev) => prev.map((item) => ({ ...item, selected: true })))
  }

  const handleDeselectAll = () => {
    setSuggestions((prev) => prev.map((item) => ({ ...item, selected: false })))
  }

  const handleSave = async () => {
    await onSave(selectedItems)
  }

  // Get thoughts that can be linked to notes
  const linkableThoughts = thoughtItems.filter((t) => t.selected)

  const renderSection = (
    items: CaptureItem[],
    icon: React.ReactNode,
    title: string,
    emptyMessage: string
  ) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title} ({items.length})
        </h4>
        <div className="space-y-3">
          {items.map((item) => (
            <CaptureItemCard
              key={item.id}
              item={item}
              contexts={contexts}
              linkedThoughts={item.type === 'note' ? linkableThoughts : undefined}
              onUpdate={(updates) => handleUpdateItem(item.id, updates)}
              onToggleSelect={(selected) => handleToggleSelect(item.id, selected)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">
            We found {suggestions.length} item{suggestions.length !== 1 && "s"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedItems.length} selected
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="text-xs"
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Grouped items */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {renderSection(
          thoughtItems,
          <Gem className="h-4 w-4 text-amber-500" />,
          "Thoughts",
          "No thoughts detected"
        )}

        {renderSection(
          noteItems,
          <StickyNote className="h-4 w-4 text-green-500" />,
          "Notes",
          "No notes detected"
        )}

        {renderSection(
          sourceItems,
          <BookOpen className="h-4 w-4 text-blue-500" />,
          "Sources",
          "No sources detected"
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedItems.length === 0 || isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save {selectedItems.length} Item{selectedItems.length !== 1 && "s"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
