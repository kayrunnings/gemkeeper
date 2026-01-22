"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, MAX_ACTIVE_GEMS, ContextTag } from "@/lib/types/gem"
import { GemForm } from "@/components/gem-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Gem as GemIcon, Loader2, MoreHorizontal, Trash2, CheckCircle, Sparkles, AlertCircle } from "lucide-react"
import { ExtractGemsModal } from "@/components/extract-gems-modal"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"
import { MomentFAB } from "@/components/moments/MomentFAB"

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

export default function GemsPage() {
  const [gems, setGems] = useState<Gem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hasAIConsent, setHasAIConsent] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  // Fetch gems and user on mount
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
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (error) {
          showError(error, "Failed to load gems")
        } else {
          setGems(data || [])
        }

        // Fetch profile for AI consent status
        const { data: profile } = await supabase
          .from("profiles")
          .select("ai_consent_given")
          .eq("id", user.id)
          .single()

        setHasAIConsent(profile?.ai_consent_given ?? false)
      } catch (err) {
        showError(err, "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const handleGemCreated = (gem: Gem) => {
    setGems((prev) => [gem, ...prev])
    setIsFormOpen(false)
    showSuccess("Gem added!", "Your wisdom has been captured.")
  }

  const handleGemsExtracted = async () => {
    // Refresh gems list after extraction
    const { data } = await supabase
      .from("gems")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (data) {
      setGems(data)
    }
    setIsExtractModalOpen(false)
    showSuccess("Gems extracted!", "AI has found wisdom in your content.")
  }

  const handleDeleteGem = async (gemId: string) => {
    if (!window.confirm("Are you sure you want to delete this gem?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("gems")
        .delete()
        .eq("id", gemId)

      if (error) {
        showError(error, "Failed to delete gem")
        return
      }

      setGems((prev) => prev.filter((gem) => gem.id !== gemId))
      showSuccess("Gem deleted")
    } catch (err) {
      showError(err, "Failed to delete gem")
    }
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  const gemCount = gems.length
  const isAtLimit = gemCount >= MAX_ACTIVE_GEMS

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center ai-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground">Loading your gems...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Gems</h1>
            <p className="text-muted-foreground mt-1">
              {gemCount} of {MAX_ACTIVE_GEMS} active gems
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsExtractModalOpen(true)}
              variant="ai"
              className="gap-2"
              disabled={isAtLimit}
              title={isAtLimit ? `Maximum ${MAX_ACTIVE_GEMS} active gems reached` : "Extract gems from content using AI"}
            >
              <Sparkles className="h-4 w-4 ai-sparkle" />
              Extract with AI
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="gap-2"
              disabled={isAtLimit}
              title={isAtLimit ? `Maximum ${MAX_ACTIVE_GEMS} active gems reached` : undefined}
            >
              <Plus className="h-4 w-4" />
              Add Gem
            </Button>
          </div>
        </div>

        {/* Limit warning */}
        {isAtLimit && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning mb-6">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">You&apos;ve reached the maximum of {MAX_ACTIVE_GEMS} active gems</p>
              <p className="text-sm opacity-80 mt-0.5">
                Retire or graduate some gems to add more wisdom to your collection.
              </p>
            </div>
          </div>
        )}

        {/* Gems grid */}
        {gems.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <GemIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No gems yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Capture wisdom, insights, and advice that you want to remember and apply in your life.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setIsExtractModalOpen(true)} variant="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Extract with AI
                </Button>
                <Button onClick={() => setIsFormOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add manually
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {gems.map((gem) => (
              <Link key={gem.id} href={`/gems/${gem.id}`}>
                <Card className="group relative cursor-pointer card-hover h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={contextTagVariant[gem.context_tag] as "meetings" | "feedback" | "conflict" | "focus" | "health" | "relationships" | "parenting" | "other"}>
                        {gem.context_tag === "other" && gem.custom_context
                          ? gem.custom_context
                          : CONTEXT_TAG_LABELS[gem.context_tag]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(gem.created_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {truncateContent(gem.content)}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {gem.source && (
                        <span className="truncate max-w-[150px]" title={gem.source}>
                          {gem.source}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                        {gem.application_count} {gem.application_count === 1 ? "application" : "applications"}
                      </span>
                    </div>

                    {/* Actions dropdown */}
                    <div
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.preventDefault()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8 bg-card/80 backdrop-blur-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteGem(gem.id)
                            }}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Gem form modal */}
      <GemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onGemCreated={handleGemCreated}
        currentGemCount={gemCount}
      />

      {/* Extract gems modal */}
      <ExtractGemsModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        onGemsCreated={handleGemsExtracted}
        activeGemCount={gemCount}
        hasAIConsent={hasAIConsent}
      />

      {/* Moment FAB */}
      <MomentFAB />
    </LayoutShell>
  )
}
