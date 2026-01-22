"use client"

import { useState } from "react"
import {
  Gem,
  CreateGemInput,
  ContextTag,
  CONTEXT_TAG_LABELS,
} from "@/lib/types/gem"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { updateGem } from "@/lib/gems"
import { cn } from "@/lib/utils"

const CONTEXT_TAGS: ContextTag[] = [
  "meetings",
  "feedback",
  "conflict",
  "focus",
  "health",
  "relationships",
  "parenting",
  "other",
]

const MAX_CONTENT_LENGTH = 500

interface GemEditFormProps {
  gem: Gem
  isOpen: boolean
  onClose: () => void
  onGemUpdated: (gem: Gem) => void
}

export function GemEditForm({ gem, isOpen, onClose, onGemUpdated }: GemEditFormProps) {
  const [content, setContent] = useState(gem.content)
  const [source, setSource] = useState(gem.source || "")
  const [sourceUrl, setSourceUrl] = useState(gem.source_url || "")
  const [contextTag, setContextTag] = useState<ContextTag>(gem.context_tag)
  const [customContext, setCustomContext] = useState(gem.custom_context || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contentLength = content.length
  const isContentTooLong = contentLength > MAX_CONTENT_LENGTH
  const canSubmit =
    content.trim() &&
    contextTag &&
    !isContentTooLong &&
    !isSubmitting &&
    (contextTag !== "other" || customContext.trim())

  const handleClose = () => {
    // Reset to original values
    setContent(gem.content)
    setSource(gem.source || "")
    setSourceUrl(gem.source_url || "")
    setContextTag(gem.context_tag)
    setCustomContext(gem.custom_context || "")
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    const input: Partial<CreateGemInput> = {
      content: content.trim(),
      context_tag: contextTag,
      source: source.trim() || undefined,
      source_url: sourceUrl.trim() || undefined,
      custom_context: contextTag === "other" ? customContext.trim() : undefined,
    }

    const result = await updateGem(gem.id, input)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result.gem) {
      onGemUpdated(result.gem)
      onClose()
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Gem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error */}
          {error && (
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

          {/* Context tag */}
          <div className="space-y-2">
            <Label>
              Context Tag <span className="text-destructive">*</span>
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {CONTEXT_TAG_LABELS[contextTag]}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px]">
                {CONTEXT_TAGS.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => setContextTag(tag)}
                    className={cn(contextTag === tag && "bg-muted")}
                  >
                    {CONTEXT_TAG_LABELS[tag]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Custom context (shown when "other" is selected) */}
          {contextTag === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-context">
                Custom Context <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custom-context"
                placeholder="Describe when this gem applies..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          {/* Source (optional) */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              placeholder="Book, article, person, etc."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={200}
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
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
