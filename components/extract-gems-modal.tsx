"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Upload,
  X,
  Image as ImageIcon,
  FileAudio,
  FileVideo,
} from "lucide-react"
import { ExtractedGemCard, ExtractedGem } from "./extracted-gem-card"
import { MAX_ACTIVE_GEMS } from "@/lib/types/gem"
import { AIConsentModal } from "./ai-consent-modal"
import { grantAIConsent } from "@/app/settings/actions"

interface ExtractGemsModalProps {
  isOpen: boolean
  onClose: () => void
  onGemsCreated: () => void
  activeGemCount: number
  hasAIConsent: boolean
}

type Step = "input" | "loading" | "review" | "success"

interface MediaFile {
  file: File
  preview?: string
  base64?: string
}

interface UsageStatus {
  extractionsToday: number
  extractionsRemaining: number
  tokensToday: number
  canExtract: boolean
  resetTime: string
}

export function ExtractGemsModal({
  isOpen,
  onClose,
  onGemsCreated,
  activeGemCount,
  hasAIConsent,
}: ExtractGemsModalProps) {
  const [step, setStep] = useState<Step>("input")
  const [content, setContent] = useState("")
  const [source, setSource] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [extractedGems, setExtractedGems] = useState<ExtractedGem[]>([])
  const [selectedGems, setSelectedGems] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentGranted, setConsentGranted] = useState(hasAIConsent)

  const availableSlots = MAX_ACTIVE_GEMS - activeGemCount
  const selectedCount = selectedGems.size
  const canSave = selectedCount > 0 && selectedCount <= availableSlots

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("input")
      setContent("")
      setSource("")
      setMediaFiles([])
      setExtractedGems([])
      setSelectedGems(new Set())
      setError(null)
      setSavedCount(0)
      setConsentGranted(hasAIConsent)
    } else {
      // Clean up object URLs when modal closes
      mediaFiles.forEach((mf) => {
        if (mf.preview) {
          URL.revokeObjectURL(mf.preview)
        }
      })
    }
  }, [isOpen, hasAIConsent]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: MediaFile[] = []
    for (const file of Array.from(files)) {
      // Validate file type
      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("audio/") &&
        !file.type.startsWith("video/")
      ) {
        continue
      }

      // Limit file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Files must be under 10MB")
        continue
      }

      // Create preview for images
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined

      // Convert to base64
      const base64 = await fileToBase64(file)

      newFiles.push({ file, preview, base64 })
    }

    setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 5)) // Limit to 5 files
    e.target.value = "" // Reset input
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  const removeFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleExtract = async () => {
    if (!consentGranted) {
      setShowConsentModal(true)
      return
    }

    setStep("loading")
    setError(null)

    try {
      const mediaData = mediaFiles
        .filter((mf) => mf.base64)
        .map((mf) => ({
          mimeType: mf.file.type,
          data: mf.base64!,
        }))

      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || undefined,
          source: source || undefined,
          media: mediaData.length > 0 ? mediaData : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          // Consent required
          setShowConsentModal(true)
          setStep("input")
          return
        }
        throw new Error(data.error || "Failed to extract gems")
      }

      setExtractedGems(data.gems)
      setUsage(data.usage)
      // Select all gems by default
      setSelectedGems(new Set(data.gems.map((_: ExtractedGem, i: number) => i)))
      setStep("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract gems")
      setStep("input")
    }
  }

  const handleSaveSelected = async () => {
    if (!canSave) return

    setIsSaving(true)
    setError(null)

    try {
      const gemsToSave = extractedGems
        .filter((_, i) => selectedGems.has(i))
        .map((gem) => ({
          content: gem.content,
          context_tag: gem.context_tag,
          source: source || undefined,
        }))

      const response = await fetch("/api/gems/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gems: gemsToSave }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save gems")
      }

      setSavedCount(data.count)
      setStep("success")
      onGemsCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save gems")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTryAgain = () => {
    setStep("input")
    setExtractedGems([])
    setSelectedGems(new Set())
    setError(null)
  }

  const handleGemSelect = (index: number, selected: boolean) => {
    setSelectedGems((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(index)
      } else {
        next.delete(index)
      }
      return next
    })
  }

  const handleGemUpdate = (index: number, gem: ExtractedGem) => {
    setExtractedGems((prev) => {
      const next = [...prev]
      next[index] = gem
      return next
    })
  }

  const handleConsentGranted = async (): Promise<{ error: string | null }> => {
    const result = await grantAIConsent()
    if (result.error) {
      return { error: result.error }
    }
    setConsentGranted(true)
    setShowConsentModal(false)
    // Continue with extraction
    setTimeout(() => handleExtract(), 100)
    return { error: null }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
    if (type.startsWith("video/")) return <FileVideo className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  const hasInput = content.length >= 100 || mediaFiles.length > 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              {step === "success" ? "Gems Added!" : "Extract Gems with AI"}
            </DialogTitle>
            {step === "input" && (
              <DialogDescription>
                Paste text or upload media to extract actionable insights
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Input Step */}
            {step === "input" && (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content">
                    Paste article, book notes, or transcript...
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your content here..."
                    className="min-h-[180px] resize-none"
                    maxLength={10000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{content.length} / 10,000 characters</span>
                    {content.length > 0 && content.length < 100 && (
                      <span className="text-warning">
                        Minimum 100 characters required
                      </span>
                    )}
                  </div>
                </div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <Label>Or upload media (images, audio, video)</Label>
                  <div className="flex flex-wrap gap-2">
                    {mediaFiles.map((mf, i) => (
                      <div
                        key={i}
                        className="relative group border rounded-xl p-2 flex items-center gap-2 bg-secondary/50"
                      >
                        {mf.preview ? (
                          <img
                            src={mf.preview}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                            {getFileIcon(mf.file.type)}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                          {mf.file.name}
                        </span>
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {mediaFiles.length < 5 && (
                      <label className="border-2 border-dashed rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        Add media
                        <input
                          type="file"
                          accept="image/*,audio/*,video/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max 5 files, 10MB each. Images, audio, and video supported.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source (optional)</Label>
                  <Input
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., Book title, article name"
                  />
                </div>

                {usage && (
                  <p className="text-xs text-muted-foreground">
                    {usage.extractionsRemaining} extraction
                    {usage.extractionsRemaining !== 1 ? "s" : ""} remaining today
                  </p>
                )}

                <Button
                  onClick={handleExtract}
                  disabled={!hasInput}
                  variant="ai"
                  className="w-full gap-2 h-12"
                >
                  <Sparkles className="h-4 w-4" />
                  Extract Gems
                </Button>
              </div>
            )}

            {/* Loading Step */}
            {step === "loading" && (
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-6 ai-glow">
                  <Sparkles className="h-10 w-10 text-white ai-sparkle" />
                </div>
                <p className="text-xl font-semibold mb-2">AI is thinking...</p>
                <p className="text-muted-foreground">
                  Analyzing your content for insights
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="h-1 w-48 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-full ai-shimmer" />
                  </div>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === "review" && (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    Found {extractedGems.length} potential gem
                    {extractedGems.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} selected
                  </p>
                </div>

                {selectedCount > availableSlots && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20 text-warning">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      You have {activeGemCount}/{MAX_ACTIVE_GEMS} active gems. You
                      can save up to {availableSlots} more.
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {extractedGems.map((gem, i) => (
                    <ExtractedGemCard
                      key={i}
                      gem={gem}
                      selected={selectedGems.has(i)}
                      onSelect={(selected) => handleGemSelect(i, selected)}
                      onUpdate={(updated) => handleGemUpdate(i, updated)}
                    />
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={handleTryAgain}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSelected}
                    disabled={!canSave || isSaving}
                    variant="ai"
                    className="ml-auto gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Selected ({selectedCount})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-celebrate">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Added {savedCount} gem{savedCount !== 1 ? "s" : ""} to your
                  collection!
                </h3>
                <p className="text-muted-foreground mb-8">
                  Your new gems are ready for daily practice.
                </p>
                <Button onClick={onClose} className="h-11">View Gems</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AIConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsentGranted}
      />
    </>
  )
}
