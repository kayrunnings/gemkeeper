"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS, CONTEXT_TAG_COLORS, MAX_ACTIVE_GEMS } from "@/lib/types/gem"
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
import { Plus, Gem as GemIcon, Loader2, MoreHorizontal, Trash2, ExternalLink, LogOut, Menu, X, StickyNote } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function GemsPage() {
  const [gems, setGems] = useState<Gem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Fetch gems and user on mount
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
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching gems:", error)
      } else {
        setGems(data || [])
      }

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handleGemCreated = (gem: Gem) => {
    setGems((prev) => [gem, ...prev])
    setIsFormOpen(false)
  }

  const handleDeleteGem = async (gemId: string) => {
    if (!window.confirm("Are you sure you want to delete this gem?")) {
      return
    }

    const { error } = await supabase
      .from("gems")
      .delete()
      .eq("id", gemId)

    if (error) {
      console.error("Error deleting gem:", error)
      return
    }

    setGems((prev) => prev.filter((gem) => gem.id !== gemId))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isThisYear = date.getFullYear() === now.getFullYear()
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(isThisYear ? {} : { year: "numeric" }),
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  const gemCount = gems.length
  const isAtLimit = gemCount >= MAX_ACTIVE_GEMS

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your gems...</p>
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
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GemIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">GemKeeper</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="gap-2"
              disabled={isAtLimit}
              title={isAtLimit ? `Maximum ${MAX_ACTIVE_GEMS} active gems reached` : undefined}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Gem</span>
            </Button>

            {/* User info and sign out */}
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
        </div>
      </header>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-muted/30 border-r p-4 pt-20 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <StickyNote className="h-4 w-4" />
                Notes
              </Link>
              <Link
                href="/gems"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <GemIcon className="h-4 w-4" />
                Gems
              </Link>
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-64 border-r bg-muted/30 p-4">
          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
            >
              <StickyNote className="h-4 w-4" />
              Notes
            </Link>
            <Link
              href="/gems"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground"
            >
              <GemIcon className="h-4 w-4" />
              Gems
            </Link>
          </nav>
        </aside>

        {/* Gems area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header with count */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Your Gems</h2>
                <p className={cn(
                  "text-sm mt-1",
                  isAtLimit ? "text-amber-600 font-medium" : "text-muted-foreground"
                )}>
                  {gemCount}/{MAX_ACTIVE_GEMS} active gems
                  {isAtLimit && " — Retire or graduate a gem to add more"}
                </p>
              </div>
            </div>

            {/* Gems grid */}
            {gems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <GemIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No gems yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Capture wisdom, insights, and advice that you want to remember and apply.
                  </p>
                  <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Gem
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {gems.map((gem) => (
                  <Card key={gem.id} className="group relative">
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
                        <span className="text-xs text-muted-foreground">
                          {formatDate(gem.created_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {truncateContent(gem.content)}
                      </p>

                      {gem.source && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Source:</span>
                          {gem.source_url ? (
                            <a
                              href={gem.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {gem.source}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-foreground">{gem.source}</span>
                          )}
                        </div>
                      )}

                      {/* Actions dropdown */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDeleteGem(gem.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Gem form modal */}
      <GemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onGemCreated={handleGemCreated}
        currentGemCount={gemCount}
      />
    </div>
  )
}
