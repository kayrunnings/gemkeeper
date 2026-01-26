"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Discovery } from "@/lib/types/discovery"
import type { ContextWithCount } from "@/lib/types/context"

interface SaveDiscoveryModalProps {
  discovery: Discovery
  contexts: ContextWithCount[]
  suggestedContextId: string | null
  onClose: () => void
  onSaved: (discovery: Discovery) => void
}

export function SaveDiscoveryModal({
  discovery,
  contexts,
  suggestedContextId,
  onClose,
  onSaved,
}: SaveDiscoveryModalProps) {
  const [thoughtContent, setThoughtContent] = useState(discovery.thought_content)
  const [contextId, setContextId] = useState(suggestedContextId || contexts[0]?.id || "")
  const [addToActiveList, setAddToActiveList] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const charCount = thoughtContent.length
  const isOverLimit = charCount > 200

  const handleSave = async () => {
    if (!thoughtContent.trim()) {
      setError("Thought content is required")
      return
    }

    if (isOverLimit) {
      setError("Thought must be 200 characters or less")
      return
    }

    if (!contextId) {
      setError("Please select a context")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/discover/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discovery_id: discovery.id,
          thought_content: thoughtContent.trim(),
          context_id: contextId,
          is_on_active_list: addToActiveList,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save thought")
        return
      }

      onSaved({ ...discovery, status: "saved", saved_gem_id: data.thought.id })
    } catch (err) {
      console.error("Save error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save This Thought</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Thought content */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="thought-content">Thought</Label>
              <span className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount}/200
              </span>
            </div>
            <Textarea
              id="thought-content"
              value={thoughtContent}
              onChange={(e) => setThoughtContent(e.target.value)}
              placeholder="Edit the thought if needed..."
              rows={3}
              className={isOverLimit ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Edit this insight to make it your own
            </p>
          </div>

          {/* Context selection */}
          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Select
              id="context"
              value={contextId}
              onChange={(e) => setContextId(e.target.value)}
            >
              <option value="" disabled>
                Select a context
              </option>
              {contexts.map((context) => (
                <option key={context.id} value={context.id}>
                  {context.name} ({context.thought_count}/{context.thought_limit})
                </option>
              ))}
            </Select>
          </div>

          {/* Add to Active List checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active-list"
              checked={addToActiveList}
              onChange={(e) => setAddToActiveList(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="active-list" className="text-sm font-normal">
              Add to Active List (for daily prompts)
            </Label>
          </div>

          {/* Source info */}
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
            <p>
              <strong>Source:</strong> {discovery.source_title}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isOverLimit}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Thought"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
