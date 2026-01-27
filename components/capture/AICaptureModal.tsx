"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Sparkles, X, CheckCircle2, Image as ImageIcon, Loader2 } from "lucide-react"
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

interface PastedImage {
  data: string
  mimeType: string
  name: string
}

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
  const [images, setImages] = useState<PastedImage[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent("")
      setState('empty')
      setSuggestions([])
      setContentType(null)
      setError(null)
      setImages([])
    }
  }, [isOpen])

  // Determine if we have content (text or images)
  const hasContent = content.trim().length > 0 || images.length > 0

  // Update state based on content - only transition between empty and input
  useEffect(() => {
    if (state === 'empty' && hasContent) {
      setState('input')
    } else if (state === 'input' && !hasContent) {
      setState('empty')
    }
  }, [hasContent, state])

  // Handle paste events for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            // Extract the base64 data without the data URL prefix
            const base64Data = base64.split(',')[1]
            setImages(prev => [...prev, {
              data: base64Data,
              mimeType: item.type,
              name: `image-${Date.now()}.${item.type.split('/')[1]}`
            }])
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }, [])

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    if (!hasContent) return

    setState('analyzing')
    setError(null)

    try {
      const response = await fetch('/api/capture/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          images: images.length > 0 ? images.map(img => ({
            mimeType: img.mimeType,
            data: img.data,
          })) : undefined,
        }),
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
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Paste or type anything here... You can also paste images!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  className="min-h-[120px] resize-none"
                  autoFocus
                />
                {images.length === 0 && (
                  <div className="absolute bottom-2 right-2 pointer-events-none">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`data:${img.mimeType};base64,${img.data}`}
                        alt={img.name}
                        className="h-16 w-16 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <CaptureEmptyState onExampleClick={handleExampleClick} />
            </div>
          )}

          {/* Input State */}
          {state === 'input' && (
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                placeholder="Paste or type anything here... You can also paste images!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                className="min-h-[150px] resize-none"
                autoFocus
              />
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`data:${img.mimeType};base64,${img.data}`}
                        alt={img.name}
                        className="h-16 w-16 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {content.length} characters{images.length > 0 && ` + ${images.length} image${images.length > 1 ? 's' : ''}`}
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={!hasContent}
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
