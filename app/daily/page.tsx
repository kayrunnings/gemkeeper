"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gem as GemIcon,
  Sun,
  Check,
  HelpCircle,
  X,
  Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDailyGem, logCheckin } from "@/lib/gems"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"

type ResponseType = "yes" | "no" | "maybe"

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

export default function DailyPage() {
  const [gem, setGem] = useState<Gem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState<ResponseType | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { showError } = useToast()

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
        }
      } catch (err) {
        showError(err, "Failed to load daily gem")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const handleResponse = async (selectedResponse: ResponseType) => {
    if (!gem || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = await logCheckin(gem.id, "morning_prompt", selectedResponse)

      if (result.error) {
        showError(result.error)
        setIsSubmitting(false)
        return
      }

      setResponse(selectedResponse)
    } catch (err) {
      showError(err, "Failed to record response")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getResponseMessage = () => {
    switch (response) {
      case "yes":
        return {
          title: "Great choice!",
          message: "Come back this evening to check in on how it went.",
          icon: <Sparkles className="h-10 w-10 text-success" />,
          bgClass: "bg-success/10",
        }
      case "maybe":
        return {
          title: "That's okay!",
          message: "Keep this gem in mind. Check in tonight either way.",
          icon: <HelpCircle className="h-10 w-10 text-warning" />,
          bgClass: "bg-warning/10",
        }
      case "no":
        return {
          title: "No worries!",
          message: "We'll surface another gem tomorrow. You can still check in tonight.",
          icon: <X className="h-10 w-10 text-muted-foreground" />,
          bgClass: "bg-secondary",
        }
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ai-glow">
            <Sun className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading your daily gem...</p>
        </div>
      </div>
    )
  }

  const responseMessage = getResponseMessage()

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sun className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Daily Gem</h1>
              <p className="text-muted-foreground text-sm">Start your day with intention</p>
            </div>
          </div>

          {!gem ? (
            // No thoughts available
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <GemIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No active thoughts</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Add some thoughts to receive daily prompts!
                </p>
                <Link href="/thoughts">
                  <Button className="gap-2">
                    <GemIcon className="h-4 w-4" />
                    Add a Thought
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : response ? (
            // Response confirmation
            <Card>
              <CardContent className="py-10 text-center">
                <div className={`w-20 h-20 rounded-2xl ${responseMessage?.bgClass} flex items-center justify-center mx-auto mb-6 animate-celebrate`}>
                  {responseMessage?.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{responseMessage?.title}</h3>
                <p className="text-muted-foreground mb-8">{responseMessage?.message}</p>
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
            <Card className="overflow-hidden">
              <CardContent className="py-8 space-y-6">
                {/* Badge */}
                <div className="flex justify-center">
                  <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                    {gem.context_tag === "other" && gem.custom_context
                      ? gem.custom_context
                      : CONTEXT_TAG_LABELS[gem.context_tag]}
                  </Badge>
                </div>

                {/* Gem content - large and prominent */}
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
                    Will you apply this gem today?
                  </p>

                  {/* Response buttons */}
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[110px] gap-2 h-12"
                      onClick={() => handleResponse("no")}
                      disabled={isSubmitting}
                    >
                      <X className="h-5 w-5" />
                      No
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[110px] gap-2 h-12"
                      onClick={() => handleResponse("maybe")}
                      disabled={isSubmitting}
                    >
                      <HelpCircle className="h-5 w-5" />
                      Maybe
                    </Button>
                    <Button
                      variant="success"
                      className="flex-1 max-w-[110px] gap-2 h-12"
                      onClick={() => handleResponse("yes")}
                      disabled={isSubmitting}
                    >
                      <Check className="h-5 w-5" />
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
