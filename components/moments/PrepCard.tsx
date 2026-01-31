"use client"

import { useState } from "react"
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
} from "lucide-react"
import type { MomentWithThoughts, MomentThought } from "@/types/moments"
import type { Thought } from "@/lib/types/thought"
import type { Note } from "@/lib/types"
import { CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/thought"
import { recordMomentThoughtFeedback, markThoughtReviewed, updateMomentStatus } from "@/lib/moments"

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

  const thought = momentThought.thought
  if (!thought) return null

  // Epic 14: Check if this thought came from learning
  const isFromLearning = momentThought.match_source === 'learned' || momentThought.match_source === 'both'

  const handleGotIt = async () => {
    if (readOnly || isReviewed) return
    setIsReviewed(true)

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
        "transition-all",
        isReviewed && "opacity-60"
      )}
    >
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

  const sortedThoughts = [...moment.matched_thoughts].sort(
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
          {moment.user_context && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 mt-0.5 text-blue-500" />
              <span className="italic">{moment.user_context}</span>
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

      {/* Matched Thoughts */}
      {isEmpty ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">No thoughts matched this moment</p>
              <p className="text-sm text-muted-foreground">
                But you&apos;ve got this!
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/thoughts')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add a thought for next time
            </Button>
          </CardContent>
        </Card>
      ) : (
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
      )}

      {/* Footer */}
      {!readOnly && !isEmpty && (
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
