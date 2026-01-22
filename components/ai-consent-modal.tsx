"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, AlertCircle, Shield } from "lucide-react"

interface AIConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConsent: () => Promise<{ error: string | null }>
}

export function AIConsentModal({ isOpen, onClose, onConsent }: AIConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleConsent = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await onConsent()

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI-Powered Gem Extraction
          </DialogTitle>
          <DialogDescription>
            Please review how your content will be processed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-sm text-violet-900">
                When you use this feature, your pasted content will be sent to
                Google&apos;s Gemini AI to extract key insights.
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">•</span>
              <span>Your content is processed but not stored by Google</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">•</span>
              <span>Extracted thoughts are saved to your ThoughtFolio account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">•</span>
              <span>You can review and edit all extracted thoughts before saving</span>
            </li>
          </ul>

          <p className="text-xs text-muted-foreground">
            You can disable AI features anytime in Settings.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConsent}
            disabled={isSubmitting}
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                I Understand, Continue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
