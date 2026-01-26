"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Context, CreateContextInput, UpdateContextInput } from "@/lib/types/context"
import {
  PRESET_CONTEXT_COLORS,
  CONTEXT_NAME_MAX_LENGTH,
  CONTEXT_THOUGHT_LIMIT_MIN,
  CONTEXT_THOUGHT_LIMIT_MAX,
  CONTEXT_THOUGHT_LIMIT_DEFAULT,
} from "@/lib/types/context"
import { createContext, updateContext } from "@/lib/contexts"
import { useToast } from "@/components/error-toast"

interface ContextFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  context?: Context | null // If provided, we're editing; otherwise, creating
}

export function ContextForm({ isOpen, onClose, onSaved, context }: ContextFormProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_CONTEXT_COLORS[0])
  const [thoughtLimit, setThoughtLimit] = useState(CONTEXT_THOUGHT_LIMIT_DEFAULT)
  const [isSaving, setIsSaving] = useState(false)
  const { showError, showSuccess } = useToast()

  const isEditing = !!context

  // Reset form when dialog opens or context changes
  useEffect(() => {
    if (isOpen) {
      if (context) {
        setName(context.name)
        setColor(context.color || PRESET_CONTEXT_COLORS[0])
        setThoughtLimit(context.thought_limit)
      } else {
        setName("")
        setColor(PRESET_CONTEXT_COLORS[0])
        setThoughtLimit(CONTEXT_THOUGHT_LIMIT_DEFAULT)
      }
    }
  }, [isOpen, context])

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      showError("Context name is required")
      return
    }
    if (name.trim().length > CONTEXT_NAME_MAX_LENGTH) {
      showError(`Context name must be ${CONTEXT_NAME_MAX_LENGTH} characters or less`)
      return
    }

    // Validate thought limit
    if (thoughtLimit < CONTEXT_THOUGHT_LIMIT_MIN || thoughtLimit > CONTEXT_THOUGHT_LIMIT_MAX) {
      showError(`Thought limit must be between ${CONTEXT_THOUGHT_LIMIT_MIN} and ${CONTEXT_THOUGHT_LIMIT_MAX}`)
      return
    }

    setIsSaving(true)

    try {
      if (isEditing && context) {
        // Update existing context
        const input: UpdateContextInput = {
          name: name.trim(),
          color,
          thought_limit: thoughtLimit,
        }
        const { error } = await updateContext(context.id, input)
        if (error) {
          showError(error)
        } else {
          showSuccess("Context updated!")
          onSaved()
          onClose()
        }
      } else {
        // Create new context
        const input: CreateContextInput = {
          name: name.trim(),
          color,
          thought_limit: thoughtLimit,
        }
        const { error } = await createContext(input)
        if (error) {
          showError(error)
        } else {
          showSuccess("Context created!")
          onSaved()
          onClose()
        }
      }
    } catch (err) {
      showError(err, "Failed to save context")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Context" : "New Context"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your context settings."
              : "Create a new context to organize your thoughts."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="context-name">Name</Label>
            <Input
              id="context-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Career, Creativity, Side Project"
              maxLength={CONTEXT_NAME_MAX_LENGTH}
              disabled={context?.is_default}
            />
            {context?.is_default && (
              <p className="text-xs text-muted-foreground">
                Default context names cannot be changed
              </p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {name.length}/{CONTEXT_NAME_MAX_LENGTH}
            </p>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_CONTEXT_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    color === presetColor
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
          </div>

          {/* Thought limit */}
          <div className="space-y-2">
            <Label htmlFor="thought-limit">Thought Limit</Label>
            <div className="flex items-center gap-3">
              <Input
                id="thought-limit"
                type="number"
                value={thoughtLimit}
                onChange={(e) => setThoughtLimit(Number(e.target.value))}
                min={CONTEXT_THOUGHT_LIMIT_MIN}
                max={CONTEXT_THOUGHT_LIMIT_MAX}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                thoughts max
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Set how many thoughts this context can hold ({CONTEXT_THOUGHT_LIMIT_MIN}-{CONTEXT_THOUGHT_LIMIT_MAX})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Context"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
