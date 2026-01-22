"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Gem as GemIcon,
  Loader2,
  LogOut,
  Moon,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Menu,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDailyGem, logCheckin, retireGem, resetSkipCount } from "@/lib/gems"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { MobileNav } from "@/components/app-sidebar"

type CheckinState = "prompt" | "stale" | "success" | "skip"

export default function CheckinPage() {
  const [gem, setGem] = useState<Gem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkinState, setCheckinState] = useState<CheckinState>("prompt")
  const [reflectionNote, setReflectionNote] = useState("")
  const [newApplicationCount, setNewApplicationCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Stale gem threshold (21 skips = 3 weeks)
  const STALE_THRESHOLD = 21

  useEffect(() => {
    async function loadData() {
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

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handleYes = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    const result = await logCheckin(gem.id, "evening_checkin", "yes", reflectionNote || undefined)

    if (result.error) {
      console.error("Error logging check-in:", result.error)
      setIsSubmitting(false)
      return
    }

    setNewApplicationCount(gem.application_count + 1)
    setCheckinState("success")
    setIsSubmitting(false)
  }

  const handleNo = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    const result = await logCheckin(gem.id, "evening_checkin", "no", reflectionNote || undefined)

    if (result.error) {
      console.error("Error logging check-in:", result.error)
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
    setIsSubmitting(false)
  }

  const handleKeep = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    const result = await resetSkipCount(gem.id)

    if (result.error) {
      console.error("Error resetting skip count:", result.error)
      setIsSubmitting(false)
      return
    }

    // Treat as a skip acknowledgment
    setCheckinState("skip")
    setIsSubmitting(false)
  }

  const handleRelease = async () => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    const result = await retireGem(gem.id, "release")

    if (result.error) {
      console.error("Error releasing gem:", result.error)
      setIsSubmitting(false)
      return
    }

    router.push("/gems")
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading check-in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/gems" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <GemIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">GemKeeper</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l">
            <div
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium"
              title={userEmail ?? undefined}
            >
              {userEmail?.[0]?.toUpperCase() ?? "U"}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Sign out"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
              <Moon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold">Evening Check-in</h2>
          </div>

          {!gem ? (
            // No gems available
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <GemIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No active gems</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
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
            <Card className="border-amber-200">
              <CardContent className="py-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Time to Reflect</h3>
                  <p className="text-muted-foreground">
                    It&apos;s been 3 weeks since you&apos;ve applied this gem. Is it still useful to you?
                  </p>
                </div>

                {/* Gem preview */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      CONTEXT_TAG_COLORS[gem.context_tag]
                    )}
                  >
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
                    className="flex-1 gap-2 text-destructive hover:text-destructive"
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
              <CardContent className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Great job!</h3>
                <p className="text-muted-foreground mb-2">
                  That&apos;s {newApplicationCount} {newApplicationCount === 1 ? "time" : "times"} you&apos;ve applied this gem.
                </p>
                {newApplicationCount >= 5 && (
                  <p className="text-green-600 font-medium mb-4">
                    This gem is ready to graduate!
                  </p>
                )}
                <div className="flex gap-3 justify-center mt-6">
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
              <CardContent className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Moon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Tomorrow is another chance!</h3>
                <p className="text-muted-foreground mb-6">
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
              <CardContent className="py-6 space-y-6">
                {/* Badge */}
                <div className="flex justify-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm",
                      CONTEXT_TAG_COLORS[gem.context_tag]
                    )}
                  >
                    {gem.context_tag === "other" && gem.custom_context
                      ? gem.custom_context
                      : CONTEXT_TAG_LABELS[gem.context_tag]}
                  </Badge>
                </div>

                {/* Gem content */}
                <p className="text-lg leading-relaxed text-center whitespace-pre-wrap">
                  {gem.content}
                </p>

                {/* Source */}
                {gem.source && (
                  <p className="text-sm text-center text-muted-foreground">
                    — {gem.source}
                  </p>
                )}

                {/* Question */}
                <div className="pt-4 border-t space-y-4">
                  <p className="text-center font-medium">
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
                      className="resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Response buttons */}
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[160px] gap-2"
                      onClick={handleNo}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                      No
                    </Button>
                    <Button
                      className="flex-1 max-w-[160px] gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleYes}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Yes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
