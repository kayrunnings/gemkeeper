"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Gem as GemIcon,
  Loader2,
  Moon,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDailyGem, logCheckin, retireGem, resetSkipCount } from "@/lib/gems"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"

type CheckinState = "prompt" | "stale" | "success" | "skip"

// Map context tags to badge variants
const contextTagVariant: Record<ContextTag, string> = {
  meetings: "meetings",
  feedback: "feedback",
  conflict: "conflict",
  focus: "focus",
  health: "health",
  relationships: "relationships",
  parenting: "parenting",
  other: "other",
}

export default function CheckinPage() {
  const [gem, setGem] = useState<Gem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkinState, setCheckinState] = useState<CheckinState>("prompt")
  const [reflectionNote, setReflectionNote] = useState("")
  const [newApplicationCount, setNewApplicationCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  // Stale gem threshold (21 skips = 3 weeks)
  const STALE_THRESHOLD = 21

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserEmail(user.email ?? null)

        const result = await getDailyGem()
        if (result.gem) {
          setGem(result.gem)
          // Check if gem is stale
          if (result.gem.skip_count >= STALE_THRESHOLD) {
            setCheckinState("stale")
          }
        }
      } catch (err) {
        showError(err, "Failed to load check-in")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const handleYes = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await logCheckin(gem.id, "evening_checkin", "yes", reflectionNote || undefined)

      if (result.error) {
        showError(result.error)
        setIsSubmitting(false)
        return
      }

      setNewApplicationCount(gem.application_count + 1)
      setCheckinState("success")
      showSuccess("Great job!", "Your progress has been recorded.")
    } catch (err) {
      showError(err, "Failed to record check-in")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNo = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await logCheckin(gem.id, "evening_checkin", "no", reflectionNote || undefined)

      if (result.error) {
        showError(result.error)
        setIsSubmitting(false)
        return
      }

      // Check if this skip brings it to stale
      const newSkipCount = gem.skip_count + 1
      if (newSkipCount >= STALE_THRESHOLD) {
        // Update local gem state and show stale prompt
        setGem({ ...gem, skip_count: newSkipCount })
        setCheckinState("stale")
      } else {
        setCheckinState("skip")
      }
    } catch (err) {
      showError(err, "Failed to record check-in")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeep = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await resetSkipCount(gem.id)

      if (result.error) {
        showError(result.error)
        setIsSubmitting(false)
        return
      }

      // Treat as a skip acknowledgment
      setCheckinState("skip")
      showSuccess("Gem kept!", "We'll keep reminding you about this gem.")
    } catch (err) {
      showError(err, "Failed to reset skip count")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRelease = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await retireGem(gem.id, "release")

      if (result.error) {
        showError(result.error)
        setIsSubmitting(false)
        return
      }

      showSuccess("Gem released", "Making room for new wisdom.")
      router.push("/gems")
    } catch (err) {
      showError(err, "Failed to release gem")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ai-glow">
            <Moon className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading check-in...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Moon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Evening Check-in</h1>
              <p className="text-muted-foreground text-sm">Reflect on your day</p>
            </div>
          </div>

          {!gem ? (
            // No gems available
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <GemIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No active gems</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Add some gems to track your progress!
                </p>
                <Link href="/gems">
                  <Button className="gap-2">
                    <GemIcon className="h-4 w-4" />
                    Add a Gem
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : checkinState === "stale" ? (
            // Stale gem prompt
            <Card className="border-warning/30">
              <CardContent className="py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-warning" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Time to Reflect</h3>
                  <p className="text-muted-foreground">
                    It&apos;s been 3 weeks since you&apos;ve applied this gem. Is it still useful to you?
                  </p>
                </div>

                {/* Gem preview */}
                <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
                  <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                    {gem.context_tag === "other" && gem.custom_context
                      ? gem.custom_context
                      : CONTEXT_TAG_LABELS[gem.context_tag]}
                  </Badge>
                  <p className="text-sm">
                    {gem.content.length > 100 ? gem.content.substring(0, 100) + "..." : gem.content}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRelease}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Release
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleKeep}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Keep
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : checkinState === "success" ? (
            // Success state
            <Card>
              <CardContent className="py-10 text-center">
                <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-celebrate">
                  <Sparkles className="h-10 w-10 text-success" />
                </div>
                <h3 className="text-xl font-bold mb-2">Great job!</h3>
                <p className="text-muted-foreground mb-2">
                  That&apos;s {newApplicationCount} {newApplicationCount === 1 ? "time" : "times"} you&apos;ve applied this gem.
                </p>
                {newApplicationCount >= 5 && (
                  <p className="text-success font-medium mb-4">
                    This gem is ready to graduate!
                  </p>
                )}
                <div className="flex gap-3 justify-center mt-8">
                  <Link href="/gems">
                    <Button variant="outline">View Gems</Button>
                  </Link>
                  {newApplicationCount >= 5 && (
                    <Link href={`/gems/${gem.id}`}>
                      <Button>Graduate Gem</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : checkinState === "skip" ? (
            // Skip state
            <Card>
              <CardContent className="py-10 text-center">
                <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Moon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Tomorrow is another chance!</h3>
                <p className="text-muted-foreground mb-8">
                  Don&apos;t worry, we&apos;ll remind you again.
                </p>
                <Link href="/gems">
                  <Button>View Gems</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            // Check-in prompt
            <Card>
              <CardContent className="py-8 space-y-6">
                {/* Badge */}
                <div className="flex justify-center">
                  <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                    {gem.context_tag === "other" && gem.custom_context
                      ? gem.custom_context
                      : CONTEXT_TAG_LABELS[gem.context_tag]}
                  </Badge>
                </div>

                {/* Gem content */}
                <p className="text-xl leading-relaxed text-center whitespace-pre-wrap font-medium">
                  {gem.content}
                </p>

                {/* Source */}
                {gem.source && (
                  <p className="text-sm text-center text-muted-foreground">
                    — {gem.source}
                  </p>
                )}

                {/* Question */}
                <div className="pt-6 border-t space-y-4">
                  <p className="text-center font-semibold text-lg">
                    Did you apply this gem today?
                  </p>

                  {/* Optional reflection note */}
                  <div className="space-y-2">
                    <Label htmlFor="reflection" className="text-sm text-muted-foreground">
                      Reflection (optional)
                    </Label>
                    <Textarea
                      id="reflection"
                      placeholder="How did it go? What did you learn?"
                      value={reflectionNote}
                      onChange={(e) => setReflectionNote(e.target.value)}
                      className="resize-none min-h-[80px]"
                      rows={2}
                    />
                  </div>

                  {/* Response buttons */}
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[140px] gap-2 h-12"
                      onClick={handleNo}
                      disabled={isSubmitting}
                    >
                      <X className="h-5 w-5" />
                      No
                    </Button>
                    <Button
                      variant="success"
                      className="flex-1 max-w-[140px] gap-2 h-12"
                      onClick={handleYes}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      Yes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LayoutShell>
  )
}
