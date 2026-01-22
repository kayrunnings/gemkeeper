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
import { Note } from "@/lib/types"
import { AIConsentModal } from "./ai-consent-modal"
import { grantAIConsent } from "@/app/settings/actions"

interface ExtractFromNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onGemsCreated: () => void
  note: Note
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

export function ExtractFromNoteModal({
  isOpen,
  onClose,
  onGemsCreated,
  note,
  activeGemCount,
  hasAIConsent,
}: ExtractFromNoteModalProps) {
  const [step, setStep] = useState<Step>("input")
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
      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("audio/") &&
        !file.type.startsWith("video/")
      ) {
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("Files must be under 10MB")
        continue
      }

      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined

      const base64 = await fileToBase64(file)

      newFiles.push({ file, preview, base64 })
    }

    setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 5))
    e.target.value = ""
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
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

      // Combine note title and content
      const noteTitle = note.title || "Untitled Note"
      const noteContent = `${noteTitle}\n\n${note.content || ""}`

      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent,
          source: `Note: ${noteTitle}`,
          media: mediaData.length > 0 ? mediaData : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setShowConsentModal(true)
          setStep("input")
          return
        }
        throw new Error(data.error || "Failed to extract gems")
      }

      setExtractedGems(data.gems)
      setUsage(data.usage)
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
          source: `Note: ${note.title || "Untitled Note"}`,
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
    setTimeout(() => handleExtract(), 100)
    return { error: null }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
    if (type.startsWith("video/")) return <FileVideo className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + "..."
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              {step === "success" ? "Gems Added!" : "Extract Gems from Note"}
            </DialogTitle>
            {step === "input" && (
              <DialogDescription>
                Extract actionable insights from &ldquo;{note.title || "Untitled Note"}&rdquo;
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Input Step */}
            {step === "input" && (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Note preview */}
                <div className="p-4 bg-gray-50 border rounded-lg space-y-2">
                  <h4 className="font-medium">{note.title || "Untitled Note"}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {truncateContent(note.content || "")}
                  </p>
                </div>

                {/* Optional media upload */}
                <div className="space-y-2">
                  <Label>Add supporting media (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add screenshots, images, audio or video to enhance extraction
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mediaFiles.map((mf, i) => (
                      <div
                        key={i}
                        className="relative group border rounded-lg p-2 flex items-center gap-2 bg-white"
                      >
                        {mf.preview ? (
                          <img
                            src={mf.preview}
                            alt=""
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            {getFileIcon(mf.file.type)}
                          </div>
                        )}
                        <span className="text-xs text-gray-600 max-w-[100px] truncate">
                          {mf.file.name}
                        </span>
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {mediaFiles.length < 5 && (
                      <label className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-violet-400 transition-colors flex items-center gap-2 text-sm text-muted-foreground">
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
                </div>

                {usage && (
                  <p className="text-xs text-muted-foreground">
                    {usage.extractionsRemaining} extraction
                    {usage.extractionsRemaining !== 1 ? "s" : ""} remaining today
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExtract}
                    className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  >
                    <Sparkles className="h-4 w-4" />
                    Extract Gems
                  </Button>
                </div>
              </div>
            )}

            {/* Loading Step */}
            {step === "loading" && (
              <div className="py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
                <p className="text-lg font-medium">Analyzing note...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This usually takes 5-10 seconds
                </p>
              </div>
            )}

            {/* Review Step */}
            {step === "review" && (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    Found {extractedGems.length} potential gem
                    {extractedGems.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} selected
                  </p>
                </div>

                {selectedCount > availableSlots && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      You have {activeGemCount}/{MAX_ACTIVE_GEMS} active gems. You
                      can save up to {availableSlots} more.
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
                    className="ml-auto gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Save Selected ({selectedCount})</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Added {savedCount} gem{savedCount !== 1 ? "s" : ""} to your
                  collection!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Your new gems are ready for daily practice.
                </p>
                <Button onClick={onClose}>Done</Button>
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
