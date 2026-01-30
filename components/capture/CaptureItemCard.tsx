"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Gem, StickyNote, BookOpen, Pencil, Check, X, Link } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CaptureItem } from "@/lib/types/capture"
import type { ContextWithCount } from "@/lib/types/context"

interface CaptureItemCardProps {
  item: CaptureItem
  contexts: ContextWithCount[]
  linkedThoughts?: CaptureItem[]
  onUpdate: (updates: Partial<CaptureItem>) => void
  onToggleSelect: (selected: boolean) => void
}

const typeConfig = {
  thought: {
    label: "THOUGHT",
    icon: Gem,
    color: "text-warning bg-warning/10",
    borderColor: "border-warning/30",
  },
  note: {
    label: "NOTE",
    icon: StickyNote,
    color: "text-success bg-success/10",
    borderColor: "border-success/30",
  },
  source: {
    label: "SOURCE",
    icon: BookOpen,
    color: "text-info bg-info/10",
    borderColor: "border-info/30",
  },
}

export function CaptureItemCard({
  item,
  contexts,
  linkedThoughts = [],
  onUpdate,
  onToggleSelect,
}: CaptureItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)

  const config = typeConfig[item.type]
  const Icon = config.icon

  const handleSaveEdit = () => {
    onUpdate({ content: editContent })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(item.content)
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        item.selected
          ? `${config.borderColor} bg-card`
          : "border-border/50 bg-muted/30 opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={item.selected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />

        <div className="flex-1 min-w-0 space-y-3">
          {/* Type badge and edit button */}
          <div className="flex items-center justify-between">
            <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium", config.color)}>
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </div>

            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="h-7 gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-7 gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{item.content}</p>
          )}

          {/* Source attribution */}
          {item.source && (
            <p className="text-xs text-muted-foreground">
              Source: {item.source}
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-0.5 hover:text-foreground"
                >
                  <Link className="h-3 w-3" />
                </a>
              )}
            </p>
          )}

          {/* Options row */}
          <div className="flex flex-wrap gap-4 pt-2">
            {/* Context selector */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Context:</Label>
              <Select
                value={item.contextId || ""}
                onChange={(e) =>
                  onUpdate({ contextId: e.target.value || undefined })
                }
                className="h-8 w-[140px] text-xs"
              >
                <option value="">No context</option>
                {contexts.map((ctx) => (
                  <option key={ctx.id} value={ctx.id}>
                    {ctx.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Add to Active List toggle (for thoughts only) */}
            {item.type === 'thought' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`active-list-${item.id}`}
                  checked={item.addToActiveList || false}
                  onChange={(e) =>
                    onUpdate({ addToActiveList: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label
                  htmlFor={`active-list-${item.id}`}
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Add to Active List
                </Label>
              </div>
            )}

            {/* Link to thought (for notes) */}
            {item.type === 'note' && linkedThoughts.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Link to:</Label>
                <Select
                  value={item.linkToThoughtId || ""}
                  onChange={(e) =>
                    onUpdate({ linkToThoughtId: e.target.value || undefined })
                  }
                  className="h-8 w-[160px] text-xs"
                >
                  <option value="">No link</option>
                  {linkedThoughts.map((thought) => (
                    <option key={thought.id} value={thought.id}>
                      {thought.content.slice(0, 40)}...
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
