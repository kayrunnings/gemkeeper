"use client"

import { useState, useEffect } from "react"
import { Thought, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS, MAX_ACTIVE_LIST } from "@/lib/types/thought"
import type { ContextWithCount } from "@/lib/types/context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  Edit,
  Archive,
  Trophy,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThoughtEditForm } from "@/components/thought-edit-form"
import { RetireThoughtDialog } from "@/components/retire-thought-dialog"
import { GraduateThoughtDialog } from "@/components/graduate-thought-dialog"
import { SchedulePicker } from "@/components/schedules/SchedulePicker"
import { getThoughtSchedules, getNextTriggerForThought } from "@/lib/schedules"
import { toggleActiveList, getActiveListCount } from "@/lib/thoughts"
import { getContexts } from "@/lib/contexts"
import { useToast } from "@/components/error-toast"
import type { ThoughtSchedule } from "@/types/schedules"

interface ThoughtDetailProps {
  thought: Thought
  onThoughtUpdated: (thought: Thought) => void
  onThoughtRetired: () => void
  onThoughtGraduated: () => void
}

export function ThoughtDetail({ thought, onThoughtUpdated, onThoughtRetired, onThoughtGraduated }: ThoughtDetailProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRetireOpen, setIsRetireOpen] = useState(false)
  const [isGraduateOpen, setIsGraduateOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true)
  const [schedules, setSchedules] = useState<ThoughtSchedule[]>([])
  const [nextTrigger, setNextTrigger] = useState<Date | null>(null)
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [activeListCount, setActiveListCount] = useState(0)
  const [isOnActiveList, setIsOnActiveList] = useState(thought.is_on_active_list)
  const { showError, showSuccess } = useToast()

  // Load schedules and contexts
  useEffect(() => {
    async function loadData() {
      // Load schedules
      const { schedules: thoughtSchedules } = await getThoughtSchedules(thought.id)
      setSchedules(thoughtSchedules)

      if (thoughtSchedules.filter(s => s.is_active).length > 0) {
        const { nextTrigger: trigger } = await getNextTriggerForThought(thought.id)
        setNextTrigger(trigger)
      }

      // Load contexts for colors
      const { contexts: contextData } = await getContexts()
      setContexts(contextData)

      // Load active list count
      const { count } = await getActiveListCount()
      setActiveListCount(count)
    }
    loadData()
  }, [thought.id])

  // Sync isOnActiveList with thought prop
  useEffect(() => {
    setIsOnActiveList(thought.is_on_active_list)
  }, [thought.is_on_active_list])

  const handleScheduleCreate = (schedule: ThoughtSchedule) => {
    setSchedules((prev) => [...prev, schedule])
    if (schedule.is_active && schedule.next_trigger_at) {
      const triggerDate = new Date(schedule.next_trigger_at)
      if (!nextTrigger || triggerDate < nextTrigger) {
        setNextTrigger(triggerDate)
      }
    }
  }

  const handleScheduleUpdate = (updatedSchedule: ThoughtSchedule) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
    )
  }

  const handleScheduleDelete = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
  }

  const handleToggleActiveList = async () => {
    const { thought: updatedThought, error } = await toggleActiveList(thought.id)
    if (error) {
      showError(error)
      return
    }

    if (updatedThought) {
      setIsOnActiveList(updatedThought.is_on_active_list)
      onThoughtUpdated({ ...thought, is_on_active_list: updatedThought.is_on_active_list })

      // Update active list count
      const { count } = await getActiveListCount()
      setActiveListCount(count)

      if (updatedThought.is_on_active_list) {
        showSuccess("Added to Active List", "This thought will appear in daily prompts")
      } else {
        showSuccess("Removed from Active List", "This thought is now passive")
      }
    }
  }

  // Get context for thought - first by ID, then by matching context_tag to slug
  const getContextForThought = () => {
    // First try to find by context_id
    if (thought.context_id) {
      return contexts.find((c) => c.id === thought.context_id) || null
    }
    // Fall back to matching context_tag to slug
    if (thought.context_tag) {
      return contexts.find((c) => c.slug === thought.context_tag) || null
    }
    return null
  }

  const context = getContextForThought()
  const activeScheduleCount = schedules.filter((s) => s.is_active).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const canGraduate = thought.application_count >= 5

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            {/* Context badge - use context color if available */}
            {context ? (
              <Badge
                variant="outline"
                className="text-sm border-2"
                style={{
                  borderColor: context.color || "#6B7280",
                  color: context.color || "#6B7280",
                }}
              >
                {context.name}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "text-sm",
                  CONTEXT_TAG_COLORS[thought.context_tag]
                )}
              >
                {thought.context_tag === "other" && thought.custom_context
                  ? thought.custom_context
                  : CONTEXT_TAG_LABELS[thought.context_tag]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full content */}
          <div>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {thought.content}
            </p>
          </div>

          {/* Source */}
          {thought.source && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Source:</span>
              {thought.source_url ? (
                <a
                  href={thought.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {thought.source}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-foreground">{thought.source}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-success mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-lg font-semibold">{thought.application_count}</span>
              </div>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-warning mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-lg font-semibold">{thought.skip_count}</span>
              </div>
              <p className="text-xs text-muted-foreground">Skips</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-info mb-1">
                <Calendar className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(thought.created_at)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsRetireOpen(true)}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              Retire
            </Button>
            <Button
              variant="default"
              onClick={() => setIsGraduateOpen(true)}
              disabled={!canGraduate}
              className="gap-2"
              title={!canGraduate ? "Apply this thought 5+ times to graduate it" : undefined}
            >
              <Trophy className="h-4 w-4" />
              Graduate
            </Button>
          </div>

          {!canGraduate && (
            <p className="text-sm text-muted-foreground">
              Apply this thought {5 - thought.application_count} more {5 - thought.application_count === 1 ? "time" : "times"} to unlock graduation.
            </p>
          )}

          {/* Active List Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnActiveList ? (
                  <Star className="h-4 w-4 text-primary fill-current" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">Active List</span>
                <span className="text-sm text-muted-foreground">({activeListCount}/{MAX_ACTIVE_LIST})</span>
              </div>
              <Button
                variant={isOnActiveList ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleActiveList}
                className="gap-2"
              >
                {isOnActiveList ? (
                  <>
                    <StarOff className="h-4 w-4" />
                    Remove
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isOnActiveList
                ? "This thought is on your Active List and will appear in daily prompts."
                : "Add to Active List to include in daily prompts."}
            </p>
          </div>

          {/* Schedule Section */}
          <div className="border-t pt-4">
            <button
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Schedules</span>
                {activeScheduleCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeScheduleCount}
                  </Badge>
                )}
              </div>
              {isScheduleExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isScheduleExpanded && (
              <div className="mt-3 space-y-3">
                {/* Next check-in */}
                {nextTrigger && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Next check-in:</span>
                    <span className="font-medium text-foreground">
                      {nextTrigger.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Active schedules list */}
                {schedules.filter(s => s.is_active).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {schedules
                      .filter((s) => s.is_active)
                      .map((schedule) => (
                        <Badge
                          key={schedule.id}
                          variant="outline"
                          className="bg-info/10 text-info border-info/30"
                        >
                          {schedule.human_readable}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No schedules set. Add one to get reminders for this thought.
                  </p>
                )}

                {/* Add schedule button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {schedules.length > 0 ? "Manage Schedules" : "Add Schedule"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <ThoughtEditForm
        thought={thought}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onThoughtUpdated={onThoughtUpdated}
      />

      {/* Retire dialog */}
      <RetireThoughtDialog
        thought={thought}
        isOpen={isRetireOpen}
        onClose={() => setIsRetireOpen(false)}
        onRetired={onThoughtRetired}
      />

      {/* Graduate dialog */}
      <GraduateThoughtDialog
        thought={thought}
        isOpen={isGraduateOpen}
        onClose={() => setIsGraduateOpen(false)}
        onGraduated={onThoughtGraduated}
      />

      {/* Schedule picker */}
      <SchedulePicker
        gemId={thought.id}
        existingSchedules={schedules}
        onScheduleCreate={handleScheduleCreate}
        onScheduleUpdate={handleScheduleUpdate}
        onScheduleDelete={handleScheduleDelete}
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </>
  )
}
