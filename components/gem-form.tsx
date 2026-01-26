"use client"

import { useState } from "react"
import {
  Gem,
  CreateGemInput,
  MAX_ACTIVE_GEMS,
} from "@/lib/types/gem"
import type { ContextWithCount } from "@/lib/types/context"
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
import { AlertCircle, Loader2 } from "lucide-react"
import { createGem } from "@/app/gems/actions"
import { cn } from "@/lib/utils"
import { ContextDropdown } from "@/components/contexts/ContextDropdown"

const MAX_CONTENT_LENGTH = 500

interface GemFormProps {
  isOpen: boolean
  onClose: () => void
  onGemCreated: (gem: Gem) => void
  currentGemCount: number
}

export function GemForm({ isOpen, onClose, onGemCreated, currentGemCount }: GemFormProps) {
  const [content, setContent] = useState("")
  const [source, setSource] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [contextId, setContextId] = useState<string | null>(null)
  const [selectedContext, setSelectedContext] = useState<ContextWithCount | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAtLimit = currentGemCount >= MAX_ACTIVE_GEMS
  const contentLength = content.length
  const isContentTooLong = contentLength > MAX_CONTENT_LENGTH
  const isContextAtLimit = selectedContext ? selectedContext.thought_count >= selectedContext.thought_limit : false
  const canSubmit =
    content.trim() &&
    contextId &&
    !isContentTooLong &&
    !isAtLimit &&
    !isContextAtLimit &&
    !isSubmitting

  const resetForm = () => {
    setContent("")
    setSource("")
    setSourceUrl("")
    setContextId(null)
    setSelectedContext(null)
    setError(null)
  }

  const handleContextChange = (id: string, context: ContextWithCount) => {
    setContextId(id)
    setSelectedContext(context)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || !contextId) return

    setIsSubmitting(true)
    setError(null)

    const input: CreateGemInput = {
      content: content.trim(),
      context_id: contextId,
      // Set context_tag based on selected context slug for backwards compat
      context_tag: selectedContext?.slug as CreateGemInput["context_tag"] || "other",
      ...(source.trim() && { source: source.trim() }),
      ...(sourceUrl.trim() && { source_url: sourceUrl.trim() }),
    }

    const result = await createGem(input)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result.gem) {
      onGemCreated(result.gem)
      resetForm()
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Gem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message for limit */}
          {isAtLimit && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Maximum thoughts reached</p>
                <p className="mt-1">
                  You have {MAX_ACTIVE_GEMS} active thoughts. Please retire or graduate a thought
                  before adding a new one.
                </p>
              </div>
            </div>
          )}

          {/* General error */}
          {error && !isAtLimit && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Wisdom / Insight <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Enter the wisdom, advice, or insight you want to remember..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn(
                "min-h-[120px] resize-y",
                isContentTooLong && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isAtLimit}
            />
            <p
              className={cn(
                "text-xs text-right",
                isContentTooLong ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {contentLength}/{MAX_CONTENT_LENGTH} characters
            </p>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label>
              Context <span className="text-destructive">*</span>
            </Label>
            <ContextDropdown
              value={contextId}
              onChange={handleContextChange}
              disabled={isAtLimit}
              showCount={true}
            />
            {isContextAtLimit && selectedContext && (
              <p className="text-xs text-destructive">
                {selectedContext.name} is full ({selectedContext.thought_count}/{selectedContext.thought_limit})
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Choose which life area this thought belongs to
            </p>
          </div>

          {/* Source (optional) */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              placeholder="Book, article, person, etc."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={200}
              disabled={isAtLimit}
            />
          </div>

          {/* Source URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="source-url">Source URL (optional)</Label>
            <Input
              id="source-url"
              type="url"
              placeholder="https://..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={isAtLimit}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Gem"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
