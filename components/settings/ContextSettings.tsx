"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContextWithCount } from "@/lib/types/context"
import { getContexts, deleteContext } from "@/lib/contexts"
import { ContextForm } from "./ContextForm"
import { useToast } from "@/components/error-toast"

interface ContextSettingsProps {
  className?: string
}

export function ContextSettings({ className }: ContextSettingsProps) {
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContext, setEditingContext] = useState<ContextWithCount | null>(null)
  const [deletingContext, setDeletingContext] = useState<ContextWithCount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    loadContexts()
  }, [])

  async function loadContexts() {
    setIsLoading(true)
    const { contexts: data, error } = await getContexts()
    if (error) {
      showError(error, "Failed to load contexts")
    } else {
      setContexts(data)
    }
    setIsLoading(false)
  }

  const handleAddContext = () => {
    setEditingContext(null)
    setIsFormOpen(true)
  }

  const handleEditContext = (context: ContextWithCount) => {
    setEditingContext(context)
    setIsFormOpen(true)
  }

  const handleDeleteContext = async () => {
    if (!deletingContext) return

    setIsDeleting(true)
    const { error } = await deleteContext(deletingContext.id)
    if (error) {
      showError(error)
    } else {
      showSuccess("Context deleted", "Thoughts have been moved to 'Other'")
      await loadContexts()
    }
    setIsDeleting(false)
    setDeletingContext(null)
  }

  const handleFormSaved = () => {
    loadContexts()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingContext(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Contexts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Contexts
              </CardTitle>
              <CardDescription>
                Organize your thoughts by life areas
              </CardDescription>
            </div>
            <Button onClick={handleAddContext} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {contexts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contexts yet. Add your first context to organize thoughts.
            </p>
          ) : (
            contexts.map((context) => (
              <div
                key={context.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: context.color || "#6B7280" }}
                  />
                  {/* Name and count */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{context.name}</span>
                      {context.is_default && (
                        <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {context.thought_count} / {context.thought_limit} thoughts
                    </p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditContext(context)}
                    title="Edit context"
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!context.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingContext(context)}
                      title="Delete context"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <ContextForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSaved={handleFormSaved}
        context={editingContext}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingContext}
        onOpenChange={(open) => !open && setDeletingContext(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Context</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingContext?.name}"?
              {deletingContext && deletingContext.thought_count > 0 && (
                <>
                  {" "}
                  The {deletingContext.thought_count} thought
                  {deletingContext.thought_count !== 1 ? "s" : ""} in this context
                  will be moved to "Other".
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingContext(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContext}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
