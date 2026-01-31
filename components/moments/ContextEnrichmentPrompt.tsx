"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sparkles, ChevronRight, SkipForward, Search, ChevronDown, ChevronUp } from "lucide-react"
import type { EventType, TitleAnalysis } from "@/lib/moments/title-analysis"
import { getChipsForEventType, searchChips, ALL_CHIPS } from "@/lib/moments/title-analysis"

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
  const [chipSearchQuery, setChipSearchQuery] = useState("")
  const [showAllChips, setShowAllChips] = useState(false)

  // Get chips based on event type
  const eventTypeChips = getChipsForEventType(analysis.detectedEventType)

  // Get chips to display based on search or default
  const displayChips = useMemo(() => {
    if (chipSearchQuery.trim()) {
      // Search mode - show matching chips from ALL_CHIPS
      return searchChips(chipSearchQuery, analysis.detectedEventType)
    }
    if (showAllChips) {
      // Show more chips - combine event-specific and popular from ALL_CHIPS
      const popularChips = ALL_CHIPS.slice(0, 20).filter(c => !eventTypeChips.includes(c))
      return [...eventTypeChips, ...popularChips]
    }
    // Default - show first 8 chips for the event type
    return eventTypeChips.slice(0, 8)
  }, [chipSearchQuery, showAllChips, eventTypeChips, analysis.detectedEventType])

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
        {analysis.isGeneric ? (
          <>
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
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Add context to find more targeted thoughts.
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

      {/* Chip Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for topics..."
            value={chipSearchQuery}
            onChange={(e) => setChipSearchQuery(e.target.value)}
            className="pl-9 h-9"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Quick-select Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {chipSearchQuery ? 'Search results:' : 'Quick select:'}
          </p>
          {selectedChips.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedChips([])}
              className="text-xs text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
          {displayChips.map((chip) => (
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
        {/* Show more / Show less toggle */}
        {!chipSearchQuery && eventTypeChips.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllChips(!showAllChips)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAllChips ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show more topics
              </>
            )}
          </button>
        )}
      </div>

      {/* Selected Chips Summary */}
      {selectedChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground">Selected:</span>
          {selectedChips.map((chip) => (
            <Badge
              key={chip}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-destructive/20"
              onClick={() => handleChipToggle(chip)}
            >
              {chip} ×
            </Badge>
          ))}
        </div>
      )}

      {/* Text Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add more specific context... (optional)"
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
