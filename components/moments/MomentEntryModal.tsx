"use client"

import { useState, useEffect } from "react"
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
  Calendar,
} from "lucide-react"
import type { MomentWithThoughts, CalendarEventData } from "@/types/moments"
import { MAX_MOMENT_DESCRIPTION_LENGTH } from "@/types/moments"
import { analyzeEventTitle, type TitleAnalysis, type EventType } from "@/lib/moments/title-analysis"
import { ContextEnrichmentPrompt } from "./ContextEnrichmentPrompt"

interface MomentEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onMomentCreated: (moment: MomentWithThoughts) => void
  // Optional: Pre-populate from calendar event
  calendarEvent?: {
    id: string
    title: string
    description?: string
    start_time: string
  }
}

type ModalState = 'idle' | 'enrichment' | 'loading' | 'success' | 'empty' | 'error'

export function MomentEntryModal({
  isOpen,
  onClose,
  onMomentCreated,
  calendarEvent,
}: MomentEntryModalProps) {
  const [description, setDescription] = useState("")
  const [state, setState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Epic 14: Enrichment state
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysis | null>(null)
  const [userContext, setUserContext] = useState<string>("")
  const [detectedEventType, setDetectedEventType] = useState<EventType | null>(null)

  // Handle calendar event pre-population
  useEffect(() => {
    if (calendarEvent && isOpen) {
      const analysis = analyzeEventTitle(
        calendarEvent.title,
        calendarEvent.description
      )
      setTitleAnalysis(analysis)
      setDetectedEventType(analysis.detectedEventType)
      setDescription(calendarEvent.title)

      // Always show enrichment for calendar events - user can skip if not needed
      setState('enrichment')
    }
  }, [calendarEvent, isOpen])

  const handleClose = () => {
    setDescription("")
    setState('idle')
    setErrorMessage(null)
    setTitleAnalysis(null)
    setUserContext("")
    setDetectedEventType(null)
    onClose()
  }

  const handleSubmit = async (contextOverride?: string) => {
    const finalDescription = description.trim()
    if (!finalDescription) return

    setState('loading')
    setErrorMessage(null)

    // Prepare request body with Epic 14 fields
    const requestBody: Record<string, unknown> = {
      description: finalDescription,
      user_context: contextOverride || userContext || null,
      detected_event_type: detectedEventType || null,
    }

    // Add calendar data if from calendar event
    if (calendarEvent) {
      requestBody.source = 'calendar'
      requestBody.calendarData = {
        event_id: calendarEvent.id,
        title: calendarEvent.title,
        start_time: calendarEvent.start_time,
      }
    }

    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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

  // Handle enrichment submission
  const handleEnrichmentSubmit = (context: string) => {
    setUserContext(context)
    // Use combined description for matching
    const enrichedDescription = context
      ? `${description}: ${context}`
      : description
    handleSubmit(context)
  }

  // Handle skip enrichment
  const handleSkipEnrichment = () => {
    handleSubmit()
  }

  // Story 18.2: Always show enrichment for manual entries too
  // This lets users add context chips for any moment, not just generic titles
  const handleManualSubmit = () => {
    const analysis = analyzeEventTitle(description.trim())
    setTitleAnalysis(analysis)
    setDetectedEventType(analysis.detectedEventType)
    setState('enrichment')
  }

  const handleRetry = () => {
    setState('idle')
    setErrorMessage(null)
    setTitleAnalysis(null)
    setUserContext("")
  }

  const isDisabled = !description.trim() || state === 'loading'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {calendarEvent ? (
              <Calendar className="h-5 w-5 text-blue-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-500" />
            )}
            {state === 'enrichment' ? 'Add Context' : 'New Moment'}
          </DialogTitle>
          <DialogDescription>
            {state === 'enrichment'
              ? "Help us find better matches by adding some context."
              : "Describe what's coming up and we'll find your relevant thoughts."}
          </DialogDescription>
        </DialogHeader>

        {/* Idle / Input State */}
        {state === 'idle' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="What's coming up? e.g., '1:1 with my manager about promotion'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={MAX_MOMENT_DESCRIPTION_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/{MAX_MOMENT_DESCRIPTION_LENGTH}
              </p>
            </div>

            <Button
              onClick={handleManualSubmit}
              disabled={isDisabled}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Find My Thoughts
            </Button>
          </div>
        )}

        {/* Enrichment State (Epic 14) */}
        {state === 'enrichment' && titleAnalysis && (
          <ContextEnrichmentPrompt
            eventTitle={description}
            analysis={titleAnalysis}
            onSubmit={handleEnrichmentSubmit}
            onSkip={handleSkipEnrichment}
            isLoading={false}
          />
        )}

        {/* Loading State */}
        {state === 'loading' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Finding your thoughts...</p>
                <p className="text-xs text-muted-foreground">
                  Matching your knowledge to this moment
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
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
