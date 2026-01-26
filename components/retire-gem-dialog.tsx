"use client"

import { useState } from "react"
import { Gem, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/gem"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Archive, Loader2, AlertCircle } from "lucide-react"
import { retireGem } from "@/lib/gems"
import { cn } from "@/lib/utils"

interface RetireGemDialogProps {
  gem: Gem
  isOpen: boolean
  onClose: () => void
  onRetired: () => void
}

export function RetireGemDialog({ gem, isOpen, onClose, onRetired }: RetireGemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetire = async (mode: "release" | "archive") => {
    setIsSubmitting(true)
    setError(null)

    const result = await retireGem(gem.id, mode)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onRetired()
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retire or Delete Thought</DialogTitle>
          <DialogDescription>
            Choose what to do with this thought.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Gem preview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                CONTEXT_TAG_COLORS[gem.context_tag]
              )}
            >
              {gem.context_tag === "other" && gem.custom_context
                ? gem.custom_context
                : CONTEXT_TAG_LABELS[gem.context_tag]}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {truncateContent(gem.content)}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => handleRetire("archive")}
              disabled={isSubmitting}
            >
              <Archive className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Retire</p>
                <p className="text-xs text-muted-foreground">
                  Move to Retired page. You can restore it later.
                </p>
              </div>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3 text-destructive hover:text-destructive"
              onClick={() => handleRetire("release")}
              disabled={isSubmitting}
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Delete Permanently</p>
                <p className="text-xs text-muted-foreground">
                  This cannot be undone.
                </p>
              </div>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
