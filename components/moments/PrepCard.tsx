"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Clock,
  Check,
  ThumbsDown,
  Sparkles,
  Plus,
  ExternalLink,
  FileText,
  BookOpen,
  RotateCcw,
  MessageSquare,
  Loader2,
} from "lucide-react"
import type { MomentWithThoughts, MomentThought } from "@/types/moments"
import type { Thought } from "@/lib/types/thought"
import type { Note } from "@/lib/types"
import { CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/thought"
import { recordMomentThoughtFeedback, markThoughtReviewed, updateMomentStatus } from "@/lib/moments"
import { analyzeEventTitle, type TitleAnalysis } from "@/lib/moments/title-analysis"
import { ContextEnrichmentPrompt } from "./ContextEnrichmentPrompt"

// Extended type for moment thought with linked notes
interface MomentThoughtWithNotes extends MomentThought {
  linkedNotes?: Note[]
}

interface PrepCardProps {
  moment: MomentWithThoughts & { matched_thoughts: MomentThoughtWithNotes[] }
  onComplete?: () => void
  readOnly?: boolean
}

interface ThoughtCardProps {
  momentThought: MomentThoughtWithNotes & { thought?: Thought }
  momentId: string  // Epic 14: Need moment ID for learning
  onReviewed: () => void
  onFeedback: (wasHelpful: boolean) => void
  readOnly?: boolean
}

function MatchedThoughtCard({ momentThought, momentId, onReviewed, onFeedback, readOnly }: ThoughtCardProps) {
  const [isReviewed, setIsReviewed] = useState(momentThought.was_reviewed)
  const [feedback, setFeedback] = useState<boolean | null>(momentThought.was_helpful)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const thought = momentThought.thought
  if (!thought) return null

  // Epic 14: Check if this thought came from learning
  const isFromLearning = momentThought.match_source === 'learned' || momentThought.match_source === 'both'

  const handleGotIt = async () => {
    if (readOnly || isReviewed) return
    setIsReviewed(true)
    setShowConfirmation(true)

    // Mark as reviewed in moment_gems table
    await markThoughtReviewed(momentThought.id)

    // Epic 14: Record helpful signal for learning
    try {
      await fetch('/api/moments/learn/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moment_id: momentId,
          gem_id: momentThought.gem_id,
        }),
      })
    } catch (err) {
      console.error('Failed to record learning:', err)
    }

    // Hide confirmation after 2 seconds
    setTimeout(() => setShowConfirmation(false), 2000)

    onReviewed()
  }

  const handleNotHelpful = async () => {
    if (readOnly) return
    setFeedback(false)
    setIsReviewed(true)

    // Record feedback in moment_gems table
    await recordMomentThoughtFeedback(momentThought.id, false)

    // Epic 14: Record not-helpful signal for learning
    try {
      await fetch('/api/moments/learn/not-helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moment_id: momentId,
          gem_id: momentThought.gem_id,
        }),
      })
    } catch (err) {
      console.error('Failed to record learning:', err)
    }

    onFeedback(false)
  }

  // Relevance indicator color
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500"
    if (score >= 0.6) return "bg-yellow-500"
    return "bg-orange-500"
  }

  return (
    <Card
      data-testid="thought-card"
      className={cn(
        "transition-all relative overflow-hidden",
        isReviewed && "opacity-60"
      )}
    >
      {/* Visual confirmation overlay for "Got it" */}
      {showConfirmation && (
        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center z-10 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
            <Check className="h-5 w-5" />
            <span className="font-medium">Noted! This will help future matches.</span>
          </div>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                CONTEXT_TAG_COLORS[thought.context_tag]
              )}
            >
              {thought.context_tag === "other" && thought.custom_context
                ? thought.custom_context
                : CONTEXT_TAG_LABELS[thought.context_tag]}
            </Badge>
            {/* Epic 14: "Helped before" badge for learned thoughts */}
            {isFromLearning && (
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <RotateCcw className="h-3 w-3" />
                Helped before
              </Badge>
            )}
          </div>
          {/* Relevance indicator */}
          <div className="flex items-center gap-1.5" title={`${Math.round(momentThought.relevance_score * 100)}% relevant`}>
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                getRelevanceColor(momentThought.relevance_score)
              )}
            />
            <span className="text-xs text-muted-foreground">
              {Math.round(momentThought.relevance_score * 100)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Thought content */}
        <p className="text-sm leading-relaxed">{thought.content}</p>

        {/* Source */}
        {thought.source && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span>Source:</span>
            {thought.source_url ? (
              <a
                href={thought.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {thought.source}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span>{thought.source}</span>
            )}
          </div>
        )}

        {/* Linked Notes */}
        {momentThought.linkedNotes && momentThought.linkedNotes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Related notes:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {momentThought.linkedNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-xs hover:bg-secondary transition-colors"
                >
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">
                    {note.title || "Untitled Note"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI relevance reason */}
        {momentThought.relevance_reason && (
          <div className="p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Why this applies:</span>{" "}
              {momentThought.relevance_reason}
            </p>
          </div>
        )}

        {/* Actions */}
        {!readOnly && (
          <div className="flex gap-2 pt-2">
            <Button
              variant={isReviewed && feedback === null ? "default" : "outline"}
              size="sm"
              onClick={handleGotIt}
              disabled={isReviewed}
              className="flex-1 gap-1"
            >
              <Check className="h-4 w-4" />
              Got it
            </Button>
            <Button
              variant={feedback === false ? "destructive" : "outline"}
              size="sm"
              onClick={handleNotHelpful}
              disabled={feedback !== null}
              className="gap-1"
            >
              <ThumbsDown className="h-4 w-4" />
              Not helpful
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PrepCard({ moment, onComplete, readOnly = false }: PrepCardProps) {
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)

  // Epic 14: Enrichment state for generic titles without context
  const [showEnrichment, setShowEnrichment] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysis | null>(null)
  const [matchedThoughts, setMatchedThoughts] = useState(moment.matched_thoughts)
  const [userContext, setUserContext] = useState(moment.user_context)

  // Check if we should show enrichment prompt
  useEffect(() => {
    const title = moment.calendar_event_title || moment.description
    const analysis = analyzeEventTitle(title)
    setTitleAnalysis(analysis)

    // Show enrichment if: no user_context yet and no/few matches
    // Always offer enrichment when no thoughts matched, regardless of title
    if (!moment.user_context && moment.matched_thoughts.length === 0) {
      setShowEnrichment(true)
    } else if (analysis.isGeneric && !moment.user_context && moment.matched_thoughts.length <= 1) {
      // Also show for generic titles with few matches
      setShowEnrichment(true)
    }
  }, [moment])

  // Handle enrichment submission
  const handleEnrichmentSubmit = async (context: string) => {
    setIsEnriching(true)
    try {
      const response = await fetch(`/api/moments/${moment.id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_context: context,
          detected_event_type: titleAnalysis?.detectedEventType || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enrich moment')
      }

      const data = await response.json()
      setMatchedThoughts(data.matched_thoughts || [])
      setUserContext(context)
      setShowEnrichment(false)
    } catch (error) {
      console.error('Enrichment failed:', error)
    } finally {
      setIsEnriching(false)
    }
  }

  // Handle skip enrichment
  const handleSkipEnrichment = () => {
    setShowEnrichment(false)
  }

  // Calculate time until event (for calendar moments)
  const getTimeUntil = (startTime: string): string => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = start.getTime() - now.getTime()

    if (diffMs <= 0) return "now"

    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 60) return `in ${diffMins} min`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `in ${diffHours}h`

    const diffDays = Math.floor(diffHours / 24)
    return `in ${diffDays}d`
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    await updateMomentStatus(moment.id, 'completed')
    setIsCompleting(false)
    onComplete?.()
    router.push('/thoughts')
  }

  const handleBack = () => {
    router.back()
  }

  const sortedThoughts = [...matchedThoughts].sort(
    (a, b) => b.relevance_score - a.relevance_score
  )

  const isEmpty = sortedThoughts.length === 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Preparing for</span>
          </div>
          <h1 className="text-xl font-semibold">
            {moment.calendar_event_title || moment.description}
          </h1>
          {/* Epic 14: Show user-provided context if present */}
          {userContext && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 mt-0.5 text-blue-500" />
              <span className="italic">{userContext}</span>
            </div>
          )}
          {moment.calendar_event_start && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Starting {getTimeUntil(moment.calendar_event_start)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Epic 14: Show enrichment prompt for generic titles */}
      {showEnrichment && titleAnalysis && (
        <Card>
          <CardContent className="pt-6">
            <ContextEnrichmentPrompt
              eventTitle={moment.calendar_event_title || moment.description}
              analysis={titleAnalysis}
              onSubmit={handleEnrichmentSubmit}
              onSkip={handleSkipEnrichment}
              isLoading={isEnriching}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading state while enriching */}
      {isEnriching && (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Finding your thoughts...</p>
              <p className="text-sm text-muted-foreground">
                Matching your knowledge to this moment
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matched Thoughts */}
      {!showEnrichment && !isEnriching && isEmpty ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">No thoughts matched this moment</p>
              <p className="text-sm text-muted-foreground">
                {userContext
                  ? "Try adding a thought for next time!"
                  : "Try adding context to find better matches."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {!userContext && titleAnalysis && (
                <Button
                  onClick={() => setShowEnrichment(true)}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Context & Try Again
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/thoughts')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add a thought for next time
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !showEnrichment && !isEnriching ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {sortedThoughts.length} thought{sortedThoughts.length !== 1 ? 's' : ''} to prepare with
          </p>
          {sortedThoughts.map((momentThought) => (
            <MatchedThoughtCard
              key={momentThought.id}
              momentThought={momentThought}
              momentId={moment.id}
              onReviewed={() => {}}
              onFeedback={() => {}}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : null}

      {/* Footer */}
      {!readOnly && !isEmpty && !showEnrichment && !isEnriching && (
        <div className="sticky bottom-6 pt-4">
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full"
            size="lg"
          >
            {isCompleting ? "Completing..." : "Done Preparing"}
          </Button>
        </div>
      )}
    </div>
  )
}
