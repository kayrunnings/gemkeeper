"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gem as GemIcon,
  Loader2,
  LogOut,
  Sun,
  Check,
  HelpCircle,
  X,
  Sparkles,
  Menu,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDailyGem, logCheckin } from "@/lib/gems"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { MobileNav } from "@/components/app-sidebar"

type ResponseType = "yes" | "no" | "maybe"

export default function DailyPage() {
  const [gem, setGem] = useState<Gem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState<ResponseType | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
      }

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handleResponse = async (selectedResponse: ResponseType) => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    const result = await logCheckin(gem.id, "morning_prompt", selectedResponse)

    if (result.error) {
      console.error("Error logging check-in:", result.error)
      setIsSubmitting(false)
      return
    }

    setResponse(selectedResponse)
    setIsSubmitting(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const getResponseMessage = () => {
    switch (response) {
      case "yes":
        return {
          title: "Great choice!",
          message: "Come back this evening to check in on how it went.",
          icon: <Sparkles className="h-8 w-8 text-green-500" />,
        }
      case "maybe":
        return {
          title: "That's okay!",
          message: "Keep this gem in mind. Check in tonight either way.",
          icon: <HelpCircle className="h-8 w-8 text-amber-500" />,
        }
      case "no":
        return {
          title: "No worries!",
          message: "We'll surface another gem tomorrow. You can still check in tonight.",
          icon: <X className="h-8 w-8 text-muted-foreground" />,
        }
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your daily gem...</p>
        </div>
      </div>
    )
  }

  const responseMessage = getResponseMessage()

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
            <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold">Daily Gem</h2>
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
                  Add some gems to receive daily prompts!
                </p>
                <Link href="/gems">
                  <Button className="gap-2">
                    <GemIcon className="h-4 w-4" />
                    Add a Gem
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : response ? (
            // Response confirmation
            <Card>
              <CardContent className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  {responseMessage?.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{responseMessage?.title}</h3>
                <p className="text-muted-foreground mb-6">{responseMessage?.message}</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/gems">
                    <Button variant="outline">View Gems</Button>
                  </Link>
                  <Link href="/checkin">
                    <Button>Go to Check-in</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Gem prompt
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

                {/* Gem content - large and prominent */}
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
                <div className="pt-4 border-t">
                  <p className="text-center font-medium mb-4">
                    Will you apply this gem today?
                  </p>

                  {/* Response buttons */}
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[120px] gap-2"
                      onClick={() => handleResponse("no")}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                      No
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[120px] gap-2"
                      onClick={() => handleResponse("maybe")}
                      disabled={isSubmitting}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Maybe
                    </Button>
                    <Button
                      className="flex-1 max-w-[120px] gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleResponse("yes")}
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
