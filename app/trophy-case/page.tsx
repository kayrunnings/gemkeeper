"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, ContextTag } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gem as GemIcon, Trophy, CheckCircle, Calendar, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"

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

export default function TrophyCasePage() {
  const [gems, setGems] = useState<Gem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
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

        const { data, error } = await supabase
          .from("gems")
          .select("*")
          .eq("status", "graduated")
          .order("graduated_at", { ascending: false })

        if (error) {
          showError(error, "Failed to load trophy case")
        } else {
          setGems(data || [])
        }
      } catch (err) {
        showError(err, "Failed to load trophy case")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  // Calculate stats
  const totalGems = gems.length
  const totalApplications = gems.reduce((sum, gem) => sum + gem.application_count, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center ai-glow">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading trophy case...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Trophy Case</h1>
              {totalGems > 0 && (
                <p className="text-muted-foreground">
                  {totalGems} gem{totalGems !== 1 ? "s" : ""} graduated, {totalApplications} total applications
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gems list */}
        {gems.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center mb-6">
                <Trophy className="h-10 w-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No graduated thoughts yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Apply a thought 5 or more times to graduate it to your ThoughtBank!
              </p>
              <Link href="/thoughts">
                <Button className="gap-2">
                  <GemIcon className="h-4 w-4" />
                  View Your Thoughts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {gems.map((gem) => (
              <Card
                key={gem.id}
                className="relative overflow-hidden card-hover"
              >
                {/* Gradient accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500" />

                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                      {gem.context_tag === "other" && gem.custom_context
                        ? gem.custom_context
                        : CONTEXT_TAG_LABELS[gem.context_tag]}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                      <Trophy className="h-3 w-3" />
                      Graduated {formatDate(gem.graduated_at)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
                    {truncateContent(gem.content)}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    {gem.source && (
                      <span className="truncate max-w-[150px]" title={gem.source}>
                        {gem.source}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-success">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {gem.application_count} applications
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Created {formatDate(gem.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  )
}
