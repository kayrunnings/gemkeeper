"use client"

import { useState } from "react"
import { ContextTag, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/thought"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, ChevronDown, ChevronUp, Pencil, X, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExtractedThought {
  content: string
  context_tag: ContextTag
  source_quote?: string
  is_on_active_list?: boolean
}

interface ExtractedThoughtCardProps {
  thought: ExtractedThought
  selected: boolean
  onSelect: (selected: boolean) => void
  onUpdate: (thought: ExtractedThought) => void
  showActiveListToggle?: boolean
  activeListFull?: boolean
  activeListCount?: number
}

export function ExtractedThoughtCard({
  thought,
  selected,
  onSelect,
  onUpdate,
  showActiveListToggle = true,
  activeListFull = false,
}: ExtractedThoughtCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(thought.content)
  const [showQuote, setShowQuote] = useState(false)
  const [showTagSelect, setShowTagSelect] = useState(false)

  const handleActiveListToggle = (checked: boolean) => {
    onUpdate({ ...thought, is_on_active_list: checked })
  }

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onUpdate({ ...thought, content: editedContent.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedContent(thought.content)
    setIsEditing(false)
  }

  const handleContextTagChange = (value: ContextTag) => {
    onUpdate({ ...thought, context_tag: value })
    setShowTagSelect(false)
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
          ? "border-violet-300 bg-violet-50 dark:border-violet-500/50 dark:bg-violet-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
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
          {/* Context tag */}
          <div className="relative">
            <button
              onClick={() => setShowTagSelect(!showTagSelect)}
              className="focus:outline-none"
            >
              <Badge
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer hover:opacity-80",
                  CONTEXT_TAG_COLORS[thought.context_tag]
                )}
              >
                {CONTEXT_TAG_LABELS[thought.context_tag]}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Badge>
            </button>
            {showTagSelect && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTagSelect(false)}
                />
                <div
                  className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.entries(CONTEXT_TAG_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContextTagChange(value as ContextTag)
                      }}
                      className={cn(
                        "w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                        thought.context_tag === value && "bg-gray-50 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          CONTEXT_TAG_COLORS[value as ContextTag].replace("text-", "bg-").split(" ")[0]
                        )}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thought content */}
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
              <p className="text-sm text-gray-900 dark:text-gray-100 pr-8">
                {truncateContent(thought.content)}
              </p>
              <button
                onClick={() => {
                  setEditedContent(thought.content)
                  setIsEditing(true)
                }}
                className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          )}

          {/* Source quote accordion */}
          {thought.source_quote && (
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
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 italic">
                  &ldquo;{thought.source_quote}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Active List Toggle */}
          {showActiveListToggle && selected && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={thought.is_on_active_list || false}
                  onCheckedChange={handleActiveListToggle}
                  disabled={activeListFull && !thought.is_on_active_list}
                />
                <span className="flex items-center gap-1.5 text-sm">
                  <Star className={cn(
                    "h-3.5 w-3.5",
                    thought.is_on_active_list ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                  )} />
                  Add to Active List
                </span>
                {activeListFull && !thought.is_on_active_list && (
                  <span className="text-xs text-muted-foreground">(List full)</span>
                )}
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {thought.is_on_active_list
                  ? "Will appear in your daily check-ins"
                  : "Will be saved as passive (available for Moments)"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
