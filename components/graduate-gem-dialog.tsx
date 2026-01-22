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
import { Trophy, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { graduateGem } from "@/lib/gems"
import { cn } from "@/lib/utils"

interface GraduateGemDialogProps {
  gem: Gem
  isOpen: boolean
  onClose: () => void
  onGraduated: () => void
}

export function GraduateGemDialog({ gem, isOpen, onClose, onGraduated }: GraduateGemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const handleClose = () => {
    setShowCelebration(false)
    setError(null)
    onClose()
  }

  const handleGraduate = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await graduateGem(gem.id)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    // Show celebration animation
    setShowCelebration(true)
    setIsSubmitting(false)

    // Wait for celebration, then redirect
    setTimeout(() => {
      onGraduated()
    }, 2000)
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !showCelebration && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {showCelebration ? (
          // Celebration view
          <div className="py-8 text-center">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-bounce" />
              <Sparkles className="absolute -bottom-1 -left-1 h-5 w-5 text-amber-500 animate-bounce delay-100" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-muted-foreground">
              You&apos;ve graduated this gem to the Trophy Case!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Applied {gem.application_count} times. Well done!
            </p>
          </div>
        ) : (
          // Confirmation view
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Graduate Gem
              </DialogTitle>
              <DialogDescription>
                Congratulations! You&apos;ve applied this gem {gem.application_count} times.
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
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg space-y-2">
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
                <p className="text-sm">
                  {truncateContent(gem.content)}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Graduating this gem will move it to your Trophy Case, celebrating your success
                in applying this wisdom consistently.
              </p>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleGraduate}
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Graduating...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4" />
                    Graduate
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
