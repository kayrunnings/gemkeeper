"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Thought } from "@/lib/types/thought"
import { Context } from "@/lib/types/context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Archive, Loader2, Quote, RotateCcw, Trash2 } from "lucide-react"
import { restoreThought, deleteThought } from "@/lib/thoughts"
import { useToast } from "@/components/error-toast"

type SortOrder = "desc" | "asc"

interface LibraryArchiveTabProps {
  selectedContextId: string | null
  contexts: Context[]
  searchQuery?: string
  sortOrder?: SortOrder
}

export function LibraryArchiveTab({
  selectedContextId,
  contexts,
  searchQuery,
  sortOrder = "desc",
}: LibraryArchiveTabProps) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [thoughtToDelete, setThoughtToDelete] = useState<Thought | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    loadArchivedThoughts()
  }, [selectedContextId, searchQuery, sortOrder])

  async function loadArchivedThoughts() {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    let query = supabase
      .from("gems")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "retired")
      .order("retired_at", { ascending: sortOrder === "asc" })

    if (selectedContextId) {
      query = query.eq("context_id", selectedContextId)
    }

    if (searchQuery) {
      query = query.or(
        `content.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading archived thoughts:", error)
    }

    setThoughts(data || [])
    setIsLoading(false)
  }

  const handleRestore = async (thought: Thought) => {
    setIsRestoring(thought.id)
    const { error } = await restoreThought(thought.id)

    if (error) {
      showError(new Error(error), "Failed to restore thought")
    } else {
      showSuccess("Thought restored successfully")
      setThoughts((prev) => prev.filter((t) => t.id !== thought.id))
    }
    setIsRestoring(null)
  }

  const handleDelete = async () => {
    if (!thoughtToDelete) return

    setIsDeleting(true)
    const { error } = await deleteThought(thoughtToDelete.id)

    if (error) {
      showError(new Error(error), "Failed to delete thought")
    } else {
      showSuccess("Thought permanently deleted")
      setThoughts((prev) => prev.filter((t) => t.id !== thoughtToDelete.id))
    }
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setThoughtToDelete(null)
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

  const getContext = (contextId: string | null) => {
    if (!contextId) return null
    return contexts.find((c) => c.id === contextId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (thoughts.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {searchQuery
            ? "No archived thoughts found"
            : "No archived thoughts. Thoughts you retire will appear here."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {thoughts.map((thought) => {
          const context = getContext(thought.context_id)

          return (
            <Card
              key={thought.id}
              className="group opacity-70 hover:opacity-100 transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center shrink-0">
                    <Quote className="h-5 w-5 text-gray-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground line-clamp-2 mb-2">
                      &ldquo;{thought.content}&rdquo;
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      {thought.source && (
                        <>
                          <span>{thought.source}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Archived {formatDate(thought.retired_at)}</span>
                      <span>•</span>
                      {context ? (
                        <Badge
                          variant="outline"
                          className="opacity-50"
                          style={{
                            borderColor: context.color || undefined,
                            color: context.color || undefined,
                          }}
                        >
                          {context.name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="opacity-50 text-muted-foreground border-muted-foreground/50"
                        >
                          Uncategorized
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(thought)}
                        disabled={isRestoring === thought.id}
                      >
                        {isRestoring === thought.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-1" />
                        )}
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setThoughtToDelete(thought)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thought Permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This thought will be permanently
              deleted from your account.
            </DialogDescription>
          </DialogHeader>
          {thoughtToDelete && (
            <div className="bg-secondary/50 rounded-lg p-3 text-sm">
              &ldquo;{thoughtToDelete.content}&rdquo;
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
