"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS } from "@/lib/types/gem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gem as GemIcon, Loader2, LogOut, Trophy, CheckCircle, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function TrophyCasePage() {
  const [gems, setGems] = useState<Gem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
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

      const { data, error } = await supabase
        .from("gems")
        .select("*")
        .eq("status", "graduated")
        .order("graduated_at", { ascending: false })

      if (error) {
        console.error("Error fetching graduated gems:", error)
      } else {
        setGems(data || [])
      }

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trophy case...</p>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with trophy */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Trophy Case</h2>
              {totalGems > 0 && (
                <p className="text-sm text-muted-foreground">
                  {totalGems} gem{totalGems !== 1 ? "s" : ""} graduated, {totalApplications} total applications
                </p>
              )}
            </div>
          </div>

          {/* Gems list */}
          {gems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="font-medium mb-2">No graduated gems yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Apply a gem 5 or more times to graduate it to your trophy case!
                </p>
                <Link href="/gems">
                  <Button className="gap-2">
                    <GemIcon className="h-4 w-4" />
                    View Your Gems
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {gems.map((gem) => (
                <Card key={gem.id} className="bg-gradient-to-r from-yellow-50/50 to-amber-50/50 border-yellow-200/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
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
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Trophy className="h-3 w-3" />
                        Graduated {formatDate(gem.graduated_at)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
                      {truncateContent(gem.content)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {gem.source && (
                        <span className="truncate">{gem.source}</span>
                      )}
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Applied {gem.application_count} times
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(gem.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
