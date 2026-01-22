"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Clock,
  Calendar,
  Sparkles,
  Trash2,
  Power,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"
import type { GemSchedule, ScheduleInput, ScheduleType, NLPScheduleResult } from "@/types/schedules"
import { DAY_NAMES } from "@/types/schedules"
import {
  createGemSchedule,
  updateGemSchedule,
  deleteGemSchedule,
  toggleScheduleActive,
  generateHumanReadable,
} from "@/lib/schedules"

interface SchedulePickerProps {
  gemId: string
  existingSchedules: GemSchedule[]
  onScheduleCreate: (schedule: GemSchedule) => void
  onScheduleUpdate: (schedule: GemSchedule) => void
  onScheduleDelete: (scheduleId: string) => void
  isOpen: boolean
  onClose: () => void
}

type TabType = "visual" | "nlp"

// Time options in 15-minute increments
const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    )
  }
}

// Day of month options
const DAY_OF_MONTH_OPTIONS = [
  ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}` })),
  { value: -1, label: "Last day" },
]

export function SchedulePicker({
  gemId,
  existingSchedules,
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete,
  isOpen,
  onClose,
}: SchedulePickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("visual")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Visual picker state
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily")
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Weekdays default
  const [selectedTime, setSelectedTime] = useState("09:00")
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(1)

  // NLP state
  const [nlpInput, setNlpInput] = useState("")
  const [nlpResult, setNlpResult] = useState<NLPScheduleResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const resetForm = () => {
    setScheduleType("daily")
    setSelectedDays([1, 2, 3, 4, 5])
    setSelectedTime("09:00")
    setSelectedDayOfMonth(1)
    setNlpInput("")
    setNlpResult(null)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const buildScheduleInput = (): ScheduleInput => {
    const input: ScheduleInput = {
      schedule_type: scheduleType,
      time_of_day: selectedTime,
    }

    if (scheduleType === "weekly") {
      input.days_of_week = [...selectedDays].sort((a, b) => a - b)
    } else if (scheduleType === "monthly") {
      input.day_of_month = selectedDayOfMonth
    }

    return input
  }

  const getPreviewText = (): string => {
    try {
      const input = buildScheduleInput()
      return generateHumanReadable(input)
    } catch {
      return "Select schedule options"
    }
  }

  const handleVisualSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const input = buildScheduleInput()
      const { schedule, error: createError } = await createGemSchedule(gemId, input)

      if (createError) {
        setError(createError)
        return
      }

      if (schedule) {
        onScheduleCreate(schedule)
        handleClose()
      }
    } catch (err) {
      setError("Failed to create schedule")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNLPParse = async () => {
    if (!nlpInput.trim()) return

    setIsParsing(true)
    setError(null)
    setNlpResult(null)

    try {
      const response = await fetch("/api/schedules/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlpInput }),
      })

      if (!response.ok) {
        throw new Error("Failed to parse schedule")
      }

      const data = await response.json()
      setNlpResult(data.result)
    } catch (err) {
      setError("Failed to parse schedule. Try again or use the visual picker.")
    } finally {
      setIsParsing(false)
    }
  }

  const handleNLPConfirm = async () => {
    if (!nlpResult) return

    setIsSubmitting(true)
    setError(null)

    try {
      const input: ScheduleInput = {
        schedule_type: nlpResult.schedule_type,
        time_of_day: nlpResult.time_of_day,
        days_of_week: nlpResult.days_of_week || undefined,
        day_of_month: nlpResult.day_of_month || undefined,
      }

      const { schedule, error: createError } = await createGemSchedule(gemId, input)

      if (createError) {
        setError(createError)
        return
      }

      if (schedule) {
        onScheduleCreate(schedule)
        handleClose()
      }
    } catch (err) {
      setError("Failed to create schedule")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    const { error } = await deleteGemSchedule(scheduleId)
    if (!error) {
      onScheduleDelete(scheduleId)
    }
  }

  const handleToggleSchedule = async (schedule: GemSchedule) => {
    const { error } = await toggleScheduleActive(schedule.id, !schedule.is_active)
    if (!error) {
      onScheduleUpdate({ ...schedule, is_active: !schedule.is_active })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Check-ins
          </DialogTitle>
        </DialogHeader>

        {/* Existing Schedules */}
        {existingSchedules.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Current Schedules</Label>
            <div className="space-y-2">
              {existingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    schedule.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {schedule.human_readable}
                    </p>
                    {schedule.next_trigger_at && schedule.is_active && (
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(schedule.next_trigger_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleSchedule(schedule)}
                      title={schedule.is_active ? "Pause" : "Activate"}
                    >
                      <Power className={cn("h-4 w-4", schedule.is_active ? "text-green-600" : "text-muted-foreground")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "visual" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("visual")}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Visual
          </Button>
          <Button
            variant={activeTab === "nlp" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("nlp")}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Natural Language
          </Button>
        </div>

        {/* Visual Picker */}
        {activeTab === "visual" && (
          <div className="space-y-4">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <div className="flex gap-2 flex-wrap">
                {(["daily", "weekly", "monthly"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={scheduleType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScheduleType(type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Day Selection (for weekly) */}
            {scheduleType === "weekly" && (
              <div className="space-y-2">
                <Label>Days</Label>
                <div className="flex gap-1 flex-wrap">
                  {DAY_NAMES.map((day, index) => (
                    <Button
                      key={day}
                      variant={selectedDays.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(index)}
                      className="w-12"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                    className="text-xs"
                  >
                    Weekdays
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDays([0, 6])}
                    className="text-xs"
                  >
                    Weekends
                  </Button>
                </div>
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {scheduleType === "monthly" && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedDayOfMonth}
                  onChange={(e) => setSelectedDayOfMonth(Number(e.target.value))}
                >
                  {DAY_OF_MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Selection */}
            <div className="space-y-2">
              <Label>Time</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                {TIME_OPTIONS.map((time) => {
                  const [h, m] = time.split(":").map(Number)
                  const period = h >= 12 ? "PM" : "AM"
                  const displayH = h % 12 || 12
                  return (
                    <option key={time} value={time}>
                      {displayH}:{m.toString().padStart(2, "0")} {period}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{getPreviewText()}</p>
            </div>
          </div>
        )}

        {/* NLP Picker */}
        {activeTab === "nlp" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Describe your schedule</Label>
              <Textarea
                placeholder="e.g., every Tuesday at 2pm, weekday mornings at 8..."
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
                className="min-h-[80px]"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {nlpInput.length}/200
              </p>
            </div>

            <Button
              onClick={handleNLPParse}
              disabled={!nlpInput.trim() || isParsing}
              className="w-full"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Parse Schedule
                </>
              )}
            </Button>

            {/* NLP Result */}
            {nlpResult && (
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{nlpResult.human_readable}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      nlpResult.confidence >= 0.8
                        ? "bg-green-100 text-green-800"
                        : nlpResult.confidence >= 0.5
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {Math.round(nlpResult.confidence * 100)}% confident
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {nlpResult.cron_expression}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleNLPConfirm}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Apply parsed values to visual picker
                      if (nlpResult.schedule_type) setScheduleType(nlpResult.schedule_type)
                      if (nlpResult.days_of_week) setSelectedDays(nlpResult.days_of_week)
                      if (nlpResult.time_of_day) setSelectedTime(nlpResult.time_of_day)
                      if (nlpResult.day_of_month) setSelectedDayOfMonth(nlpResult.day_of_month)
                      setActiveTab("visual")
                    }}
                  >
                    Edit Manually
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {activeTab === "visual" && (
            <Button onClick={handleVisualSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Schedule"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
