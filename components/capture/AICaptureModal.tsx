"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Sparkles, X, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CaptureEmptyState } from "./CaptureEmptyState"
import { CaptureAnalyzing } from "./CaptureAnalyzing"
import { CaptureSuggestions } from "./CaptureSuggestions"
import type { CaptureItem, ContentType } from "@/lib/types/capture"
import type { ContextWithCount } from "@/lib/types/context"

interface AICaptureModalProps {
  isOpen: boolean
  onClose: () => void
  contexts?: ContextWithCount[]
}

type ModalState = 'empty' | 'input' | 'analyzing' | 'suggestions' | 'saving' | 'success' | 'error'

export function AICaptureModal({
  isOpen,
  onClose,
  contexts = [],
}: AICaptureModalProps) {
  const [content, setContent] = useState("")
  const [state, setState] = useState<ModalState>('empty')
  const [suggestions, setSuggestions] = useState<CaptureItem[]>([])
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState({ thoughts: 0, notes: 0, sources: 0 })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent("")
      setState('empty')
      setSuggestions([])
      setContentType(null)
      setError(null)
    }
  }, [isOpen])

  // Update state based on content
  useEffect(() => {
    if (content.trim()) {
      setState('input')
    } else if (state === 'input') {
      setState('empty')
    }
  }, [content, state])

  const handleAnalyze = async () => {
    if (!content.trim()) return

    setState('analyzing')
    setError(null)

    try {
      const response = await fetch('/api/capture/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze content')
      }

      const data = await response.json()

      if (data.suggestions.length === 0) {
        throw new Error('No insights detected in the content. Try adding more context or paste different content.')
      }

      setSuggestions(data.suggestions)
      setContentType(data.contentType)
      setState('suggestions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  const handleSave = async (items: CaptureItem[]) => {
    setState('saving')
    setError(null)

    try {
      const response = await fetch('/api/capture/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save items')
      }

      const data = await response.json()
      setSavedCount(data.created)
      setState('success')

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setState('suggestions') // Go back to suggestions on error
    }
  }

  const handleCancel = () => {
    if (state === 'suggestions') {
      setState('input')
      setSuggestions([])
    } else {
      onClose()
    }
  }

  const handleExampleClick = (example: string) => {
    setContent(example)
    setState('input')
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Capture
          </DialogTitle>
          <DialogDescription>
            Paste any content — we'll extract thoughts, notes, and sources
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Empty State */}
          {state === 'empty' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Paste or type anything here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                autoFocus
              />
              <CaptureEmptyState onExampleClick={handleExampleClick} />
            </div>
          )}

          {/* Input State */}
          {state === 'input' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Paste or type anything here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] resize-none"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {content.length} characters
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={!content.trim()}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze Content
                </Button>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {state === 'analyzing' && (
            <CaptureAnalyzing />
          )}

          {/* Suggestions State */}
          {(state === 'suggestions' || state === 'saving') && (
            <CaptureSuggestions
              suggestions={suggestions}
              contexts={contexts}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={state === 'saving'}
            />
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Saved successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  {savedCount.thoughts > 0 && `${savedCount.thoughts} thought${savedCount.thoughts > 1 ? 's' : ''}`}
                  {savedCount.thoughts > 0 && savedCount.notes > 0 && ', '}
                  {savedCount.notes > 0 && `${savedCount.notes} note${savedCount.notes > 1 ? 's' : ''}`}
                  {(savedCount.thoughts > 0 || savedCount.notes > 0) && savedCount.sources > 0 && ', '}
                  {savedCount.sources > 0 && `${savedCount.sources} source${savedCount.sources > 1 ? 's' : ''}`}
                  {' '}added to your library
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Something went wrong</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={() => setState('input')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
