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
  initialContent?: string
}

type ModalState = 'empty' | 'input' | 'analyzing' | 'suggestions' | 'saving' | 'success' | 'error'

interface PastedImage {
  data: string
  mimeType: string
  name: string
  size: number // size in bytes
}

// Validation constants
const MAX_IMAGE_SIZE_MB = 4
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function AICaptureModal({
  isOpen,
  onClose,
  contexts = [],
  initialContent,
}: AICaptureModalProps) {
  const [content, setContent] = useState("")
  const [state, setState] = useState<ModalState>('empty')
  const [suggestions, setSuggestions] = useState<CaptureItem[]>([])
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState({ thoughts: 0, notes: 0, sources: 0 })
  const [images, setImages] = useState<PastedImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasAutoAnalyzed = useRef(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // If there's initial content, use it
      if (initialContent && initialContent.trim()) {
        setContent(initialContent)
        setState('input')
        hasAutoAnalyzed.current = false
      } else {
        setContent("")
        setState('empty')
      }
      setSuggestions([])
      setContentType(null)
      setError(null)
      setImages([])
      setImageError(null)
    } else {
      hasAutoAnalyzed.current = false
    }
  }, [isOpen, initialContent])

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

  // Auto-analyze when there's initial content
  useEffect(() => {
    if (
      isOpen &&
      initialContent &&
      initialContent.trim() &&
      state === 'input' &&
      !hasAutoAnalyzed.current
    ) {
      hasAutoAnalyzed.current = true
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleAnalyzeWithContent(initialContent.trim())
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, initialContent, state])

  // Handle paste events for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    setImageError(null)

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()

        // Validate MIME type
        if (!SUPPORTED_IMAGE_TYPES.includes(item.type)) {
          setImageError(`Unsupported image format. Please use JPEG, PNG, GIF, or WebP.`)
          return
        }

        const file = item.getAsFile()
        if (file) {
          // Validate file size
          if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setImageError(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`)
            return
          }

          const reader = new FileReader()
          reader.onerror = () => {
            setImageError('Failed to read image. Please try again.')
          }
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            // Extract the base64 data without the data URL prefix
            const base64Data = base64.split(',')[1]
            setImages(prev => [...prev, {
              data: base64Data,
              mimeType: item.type,
              name: `image-${Date.now()}.${item.type.split('/')[1]}`,
              size: file.size,
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

  // Helper to safely parse JSON response
  const safeParseResponse = async (response: Response): Promise<{ data?: Record<string, unknown>; error?: string }> => {
    try {
      const text = await response.text()
      if (!text || text.trim() === '') {
        return { error: 'Server returned an empty response' }
      }
      const data = JSON.parse(text)
      return { data }
    } catch {
      return { error: 'Failed to parse server response' }
    }
  }

  // Internal function to analyze specific content (used for auto-analyze)
  const handleAnalyzeWithContent = async (contentToAnalyze: string) => {
    if (!contentToAnalyze.trim()) return

    setState('analyzing')
    setError(null)

    try {
      const response = await fetch('/api/capture/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToAnalyze,
          images: images.length > 0 ? images.map(img => ({
            mimeType: img.mimeType,
            data: img.data,
          })) : undefined,
        }),
      })

      const { data, error: parseError } = await safeParseResponse(response)

      if (parseError) {
        throw new Error(parseError)
      }

      if (!response.ok) {
        throw new Error((data?.error as string) || 'Failed to analyze content')
      }

      if (!data?.suggestions || (data.suggestions as unknown[]).length === 0) {
        throw new Error('No insights detected in the content. Try adding more context or paste different content.')
      }

      setSuggestions(data.suggestions as CaptureItem[])
      setContentType(data.contentType as ContentType)
      setState('suggestions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
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

      const { data, error: parseError } = await safeParseResponse(response)

      if (parseError) {
        throw new Error(parseError)
      }

      if (!response.ok) {
        throw new Error((data?.error as string) || 'Failed to analyze content')
      }

      if (!data?.suggestions || (data.suggestions as unknown[]).length === 0) {
        throw new Error('No insights detected in the content. Try adding more context or paste different content.')
      }

      setSuggestions(data.suggestions as CaptureItem[])
      setContentType(data.contentType as ContentType)
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

      const { data, error: parseError } = await safeParseResponse(response)

      if (parseError) {
        throw new Error(parseError)
      }

      if (!response.ok) {
        throw new Error((data?.error as string) || 'Failed to save items')
      }

      setSavedCount(data?.created as { thoughts: number; notes: number; sources: number })
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
              {imageError && (
                <p className="text-sm text-destructive">{imageError}</p>
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
              {imageError && (
                <p className="text-sm text-destructive">{imageError}</p>
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
