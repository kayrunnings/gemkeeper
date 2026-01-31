"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sparkles, ChevronRight, SkipForward } from "lucide-react"
import type { EventType, TitleAnalysis } from "@/lib/moments/title-analysis"
import { getChipsForEventType } from "@/lib/moments/title-analysis"

interface ContextEnrichmentPromptProps {
  eventTitle: string
  analysis: TitleAnalysis
  onSubmit: (userContext: string) => void
  onSkip: () => void
  isLoading?: boolean
}

export function ContextEnrichmentPrompt({
  eventTitle,
  analysis,
  onSubmit,
  onSkip,
  isLoading = false,
}: ContextEnrichmentPromptProps) {
  const [userContext, setUserContext] = useState("")
  const [selectedChips, setSelectedChips] = useState<string[]>([])

  const chips = getChipsForEventType(analysis.detectedEventType)
  const questions = analysis.suggestedQuestions || []

  const handleChipToggle = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip)
        ? prev.filter((c) => c !== chip)
        : [...prev, chip]
    )
  }

  const handleSubmit = () => {
    // Combine chips and text input
    const chipText = selectedChips.length > 0 ? selectedChips.join(", ") : ""
    const combinedContext = [chipText, userContext.trim()]
      .filter(Boolean)
      .join(" - ")

    onSubmit(combinedContext)
  }

  const hasContext = userContext.trim().length > 0 || selectedChips.length > 0

  // Get display label for event type
  const getEventTypeLabel = (type: EventType): string => {
    const labels: Record<EventType, string> = {
      '1:1': '1:1 Meeting',
      'team_meeting': 'Team Meeting',
      'interview': 'Interview',
      'presentation': 'Presentation',
      'review': 'Review',
      'planning': 'Planning',
      'social': 'Social',
      'external': 'External Meeting',
      'unknown': 'Meeting',
    }
    return labels[type] || 'Meeting'
  }

  return (
    <div className="space-y-4">
      {/* Event Detection Badge */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-muted-foreground">
          Detected:
        </span>
        <Badge variant="secondary" className="text-xs">
          {getEventTypeLabel(analysis.detectedEventType)}
        </Badge>
      </div>

      {/* Event Title */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="font-medium">{eventTitle}</p>
        {analysis.genericReason === 'short' && (
          <p className="text-xs text-muted-foreground mt-1">
            This title is quite brief. Adding context will help find better matches.
          </p>
        )}
        {analysis.genericReason === 'common_pattern' && (
          <p className="text-xs text-muted-foreground mt-1">
            This is a common meeting type. What specifically will you discuss?
          </p>
        )}
        {analysis.genericReason === 'no_description' && (
          <p className="text-xs text-muted-foreground mt-1">
            No description found. What&apos;s the focus of this meeting?
          </p>
        )}
      </div>

      {/* Contextual Question */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {questions[0]}
          </p>
        </div>
      )}

      {/* Quick-select Chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Quick select:</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipToggle(chip)}
              disabled={isLoading}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                "border hover:border-primary/50",
                selectedChips.includes(chip)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add more context... (optional)"
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          className="min-h-[80px] resize-none"
          maxLength={200}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground text-right">
          {userContext.length}/200
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isLoading}
          className="gap-2"
        >
          <SkipForward className="h-4 w-4" />
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 gap-2"
        >
          {isLoading ? (
            "Finding thoughts..."
          ) : (
            <>
              Find Thoughts
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Skip hint */}
      <p className="text-xs text-center text-muted-foreground">
        {hasContext
          ? "Your context will help find more relevant thoughts"
          : "Skip to search with just the event title"}
      </p>
    </div>
  )
}
