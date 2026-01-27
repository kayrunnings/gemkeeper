"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, ChevronDown, ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MomentWithThoughts } from "@/types/moments"

interface QuickMomentEntryProps {
  onClose: () => void
}

export function QuickMomentEntry({ onClose }: QuickMomentEntryProps) {
  const [description, setDescription] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [matchedThoughts, setMatchedThoughts] = useState<MomentWithThoughts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          scheduled_for: scheduledDate && scheduledTime
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create moment")
      }

      const data = await response.json()
      const moment: MomentWithThoughts = data.moment

      if (moment.gems_matched_count === 0) {
        setMatchedThoughts(moment)
      } else {
        // Navigate to prep card
        router.push(`/moments/${moment.id}/prepare`)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPrepCard = () => {
    if (matchedThoughts) {
      router.push(`/moments/${matchedThoughts.id}/prepare`)
      onClose()
    }
  }

  return (
    <div
      className={cn(
        "absolute bottom-16 right-0 mb-2",
        "bg-card border border-border rounded-xl shadow-xl",
        "w-[320px] sm:w-[360px]",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Quick Moment
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {!matchedThoughts ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="moment-description" className="text-sm">
                What are you preparing for?
              </Label>
              <Textarea
                id="moment-description"
                placeholder="e.g., 1:1 with my manager about career growth"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                maxLength={500}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>

            {/* Optional Date/Time */}
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDatePicker ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Add date & time (optional)
            </button>

            {showDatePicker && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="moment-date" className="text-xs">Date</Label>
                  <Input
                    id="moment-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="text-sm"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="moment-time" className="text-xs">Time</Label>
                  <Input
                    id="moment-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding thoughts...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Find Relevant Thoughts
                </>
              )}
            </Button>
          </>
        ) : (
          /* Results state - no matches */
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {matchedThoughts.gems_matched_count === 0
                  ? "No thoughts matched, but you've got this!"
                  : `Found ${matchedThoughts.gems_matched_count} relevant thoughts!`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {matchedThoughts.gems_matched_count === 0
                  ? "Your wisdom is still growing."
                  : "Review them before your moment."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              {matchedThoughts.gems_matched_count > 0 && (
                <Button onClick={handleViewPrepCard} className="flex-1">
                  View Prep Card
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
