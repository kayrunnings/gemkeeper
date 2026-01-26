"use client"

import { useState } from "react"
import { ContextTag } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, ChevronDown, ChevronUp, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextDropdown, useContexts } from "@/components/contexts/ContextDropdown"
import type { ContextWithCount } from "@/lib/types/context"

export interface ExtractedGem {
  content: string
  context_tag: ContextTag
  // New: optional context_id for new context system
  context_id?: string
  source_quote?: string
}

interface ExtractedGemCardProps {
  gem: ExtractedGem
  selected: boolean
  onSelect: (selected: boolean) => void
  onUpdate: (gem: ExtractedGem) => void
}

export function ExtractedGemCard({
  gem,
  selected,
  onSelect,
  onUpdate,
}: ExtractedGemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(gem.content)
  const [showQuote, setShowQuote] = useState(false)
  const { contexts } = useContexts()

  // Get current context_id, or find matching context by slug if not set
  const getCurrentContextId = (): string | null => {
    if (gem.context_id) return gem.context_id
    // Try to find a context matching the context_tag (slug matches tag for defaults)
    const matchingContext = contexts.find((c) => c.slug === gem.context_tag)
    return matchingContext?.id || null
  }

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onUpdate({ ...gem, content: editedContent.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedContent(gem.content)
    setIsEditing(false)
  }

  const handleContextChange = (contextId: string, context: ContextWithCount) => {
    // Update both context_id and context_tag (for backwards compat)
    onUpdate({
      ...gem,
      context_id: contextId,
      context_tag: context.slug as ContextTag,
    })
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        selected
          ? "border-violet-300 bg-violet-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onSelect(!selected)}
          className={cn(
            "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
            selected
              ? "bg-violet-500 border-violet-500"
              : "border-gray-300 hover:border-violet-400"
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Context selector */}
          <div className="w-fit">
            <ContextDropdown
              value={getCurrentContextId()}
              onChange={handleContextChange}
              showCount={false}
              className="h-7 text-xs"
            />
          </div>

          {/* Gem content */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
                maxLength={200}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {editedContent.length}/200
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-7 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-7 px-2"
                    disabled={!editedContent.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <p className="text-sm text-gray-900 pr-8">
                {truncateContent(gem.content)}
              </p>
              <button
                onClick={() => {
                  setEditedContent(gem.content)
                  setIsEditing(true)
                }}
                className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          )}

          {/* Source quote accordion */}
          {gem.source_quote && (
            <div className="mt-2">
              <button
                onClick={() => setShowQuote(!showQuote)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-700"
              >
                {showQuote ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Source quote
              </button>
              {showQuote && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 italic">
                  &ldquo;{gem.source_quote}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
