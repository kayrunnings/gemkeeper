"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SaveDiscoveryModal } from "./SaveDiscoveryModal"
import type { Discovery } from "@/lib/types/discovery"
import type { ContextWithCount } from "@/lib/types/context"

interface DiscoveryDetailProps {
  discovery: Discovery
  contexts: ContextWithCount[]
  onClose: () => void
  onSaved: (discovery: Discovery) => void
  onSkipped: (discovery: Discovery) => void
}

export function DiscoveryDetail({
  discovery,
  contexts,
  onClose,
  onSaved,
  onSkipped,
}: DiscoveryDetailProps) {
  const [isSkipping, setIsSkipping] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const suggestedContext = contexts.find((c) => c.id === discovery.suggested_context_id)

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      const response = await fetch("/api/discover/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discovery_id: discovery.id }),
      })

      if (response.ok) {
        onSkipped({ ...discovery, status: "skipped" })
      }
    } catch (err) {
      console.error("Skip error:", err)
    } finally {
      setIsSkipping(false)
    }
  }

  const handleSave = () => {
    setShowSaveModal(true)
  }

  const handleSaveComplete = (savedDiscovery: Discovery) => {
    setShowSaveModal(false)
    onSaved(savedDiscovery)
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {suggestedContext && (
                <Badge
                  variant="outline"
                  className="border-2"
                  style={{
                    borderColor: suggestedContext.color || "#6B7280",
                    color: suggestedContext.color || "#6B7280",
                  }}
                >
                  {suggestedContext.name}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  discovery.content_type === "trending" && "bg-orange-100 text-orange-800",
                  discovery.content_type === "evergreen" && "bg-green-100 text-green-800"
                )}
              >
                {discovery.content_type}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Thought content */}
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-lg font-medium leading-relaxed">
                &ldquo;{discovery.thought_content}&rdquo;
              </p>
            </div>

            {/* Source */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Source</h4>
              <a
                href={discovery.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {discovery.source_title}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Why this for you */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Why this for you</h4>
              <p className="text-sm">{discovery.relevance_reason}</p>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Article Summary</h4>
              <p className="text-sm text-muted-foreground">{discovery.article_summary}</p>
            </div>

            {/* Read full article link */}
            <a
              href={discovery.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Read full article
              <ExternalLink className="h-3 w-3" />
            </a>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSkipping}
                className="flex-1"
              >
                {isSkipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Not for me
                  </>
                )}
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save This Thought
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save modal */}
      {showSaveModal && (
        <SaveDiscoveryModal
          discovery={discovery}
          contexts={contexts}
          suggestedContextId={discovery.suggested_context_id}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaveComplete}
        />
      )}
    </>
  )
}
