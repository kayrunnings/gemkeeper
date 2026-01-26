"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gem, CONTEXT_TAG_LABELS } from "@/lib/types/gem"
import type { ContextWithCount } from "@/lib/types/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Archive, MoreHorizontal, Trash2, RotateCcw, Sparkles, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LayoutShell } from "@/components/layout-shell"
import { useToast } from "@/components/error-toast"
import { getRetiredThoughts, restoreThought, deleteThought } from "@/lib/thoughts"
import { getContexts } from "@/lib/contexts"

export default function RetiredPage() {
  const [thoughts, setThoughts] = useState<Gem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  // Fetch retired thoughts on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserEmail(user.email ?? null)

        // Fetch retired thoughts
        const { thoughts: retiredThoughts, error } = await getRetiredThoughts()
        if (error) {
          showError(error, "Failed to load retired thoughts")
        } else {
          setThoughts(retiredThoughts)
        }

        // Fetch contexts for display
        const { contexts: contextData } = await getContexts()
        setContexts(contextData)
      } catch (err) {
        showError(err, "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const handleRestore = async (thoughtId: string) => {
    const { thought, error } = await restoreThought(thoughtId)
    if (error) {
      showError(error, "Failed to restore thought")
      return
    }

    if (thought) {
      setThoughts((prev) => prev.filter((t) => t.id !== thoughtId))
      showSuccess("Thought restored!", "The thought is now active again.")
    }
  }

  const handleDelete = async (thoughtId: string) => {
    const { error } = await deleteThought(thoughtId)
    if (error) {
      showError(error, "Failed to delete thought")
      return
    }

    setThoughts((prev) => prev.filter((t) => t.id !== thoughtId))
    setDeleteConfirmId(null)
    showSuccess("Thought deleted", "The thought has been permanently removed.")
  }

  // Get context by ID for displaying colored badges
  const getContextById = (contextId: string | null) => {
    if (!contextId) return null
    return contexts.find((c) => c.id === contextId)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center ai-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground">Loading retired thoughts...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/thoughts">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Thoughts
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="h-6 w-6 text-muted-foreground" />
              Retired Thoughts
            </h1>
            <p className="text-muted-foreground mt-1">
              {thoughts.length} retired thought{thoughts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border mb-6">
          <Archive className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p>
              Retired thoughts are archived for reference. They won't appear in daily prompts or Moments.
              You can restore them to active status or delete them permanently.
            </p>
          </div>
        </div>

        {/* Thoughts grid */}
        {thoughts.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <Archive className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No retired thoughts</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                When you retire thoughts, they'll appear here for reference.
              </p>
              <Link href="/thoughts">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Thoughts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {thoughts.map((thought) => {
              const context = getContextById(thought.context_id)
              return (
                <Card key={thought.id} className="group relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Context badge - use new context if available, fall back to context_tag */}
                        {context ? (
                          <Badge
                            variant="outline"
                            className="border-2 opacity-60"
                            style={{
                              borderColor: context.color || "#6B7280",
                              color: context.color || "#6B7280",
                            }}
                          >
                            {context.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="opacity-60">
                            {thought.context_tag === "other" && thought.custom_context
                              ? thought.custom_context
                              : CONTEXT_TAG_LABELS[thought.context_tag]}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Retired {formatDate(thought.retired_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/70">
                      {truncateContent(thought.content)}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {thought.source && (
                        <span className="truncate max-w-[150px]" title={thought.source}>
                          {thought.source}
                        </span>
                      )}
                      <span>
                        {thought.application_count} application{thought.application_count !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(thought.id)}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRestore(thought.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmId(thought.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete thought permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The thought will be permanently deleted from your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  )
}
