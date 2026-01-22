"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Sprout,
} from "lucide-react"
import type { MomentWithThoughts } from "@/types/moments"
import { MAX_MOMENT_DESCRIPTION_LENGTH } from "@/types/moments"

interface MomentEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onMomentCreated: (moment: MomentWithThoughts) => void
}

type ModalState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export function MomentEntryModal({
  isOpen,
  onClose,
  onMomentCreated,
}: MomentEntryModalProps) {
  const [description, setDescription] = useState("")
  const [state, setState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleClose = () => {
    setDescription("")
    setState('idle')
    setErrorMessage(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!description.trim()) return

    setState('loading')
    setErrorMessage(null)

    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create moment")
      }

      const data = await response.json()
      const moment: MomentWithThoughts = data.moment

      if (moment.gems_matched_count === 0) {
        setState('empty')
      } else {
        setState('success')
        onMomentCreated(moment)
        handleClose()
      }
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const handleRetry = () => {
    setState('idle')
    setErrorMessage(null)
  }

  const isDisabled = !description.trim() || state === 'loading'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            New Moment
          </DialogTitle>
          <DialogDescription>
            Describe what&apos;s coming up and we&apos;ll find your relevant thoughts.
          </DialogDescription>
        </DialogHeader>

        {/* Idle / Input State */}
        {(state === 'idle' || state === 'loading') && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="What's coming up? e.g., '1:1 with my manager about promotion'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={MAX_MOMENT_DESCRIPTION_LENGTH}
                disabled={state === 'loading'}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/{MAX_MOMENT_DESCRIPTION_LENGTH}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="w-full gap-2"
            >
              {state === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding your wisdom...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Find My Thoughts
                </>
              )}
            </Button>
          </div>
        )}

        {/* Loading State with Shimmer */}
        {state === 'loading' && (
          <div className="space-y-3 mt-4">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {state === 'empty' && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Sprout className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No thoughts matched this moment, but you&apos;ve got this!
              </p>
              <p className="text-xs text-muted-foreground">
                Your wisdom is still growing.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setState('idle')}>
                Try Different Words
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="space-y-4">
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              "bg-destructive/10 text-destructive"
            )}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{errorMessage || "Something went wrong"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
