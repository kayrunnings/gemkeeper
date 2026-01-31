"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { createSource } from "@/lib/sources"
import {
  SourceType,
  SourceStatus,
  SOURCE_TYPE_LABELS,
  SOURCE_TYPE_ICONS,
  SOURCE_STATUS_LABELS,
  SOURCE_STATUS_ICONS,
} from "@/lib/types/source"
import { Loader2, BookOpen, Search } from "lucide-react"
import { useToast } from "@/components/error-toast"

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSourceCreated?: (sourceId: string) => void
  defaultType?: SourceType
}

export function AddSourceModal({
  isOpen,
  onClose,
  onSourceCreated,
  defaultType = "book",
}: AddSourceModalProps) {
  const [name, setName] = useState("")
  const [author, setAuthor] = useState("")
  const [type, setType] = useState<SourceType>(defaultType)
  const [status, setStatus] = useState<SourceStatus>("want_to_read")
  const [url, setUrl] = useState("")
  const [isbn, setIsbn] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const { showError, showSuccess } = useToast()

  const resetForm = () => {
    setName("")
    setAuthor("")
    setType(defaultType)
    setStatus("want_to_read")
    setUrl("")
    setIsbn("")
    setCoverImageUrl("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showError(new Error("Name is required"), "Please enter a name")
      return
    }

    setIsLoading(true)

    const { data, error } = await createSource({
      name: name.trim(),
      author: author.trim() || undefined,
      type,
      status,
      url: url.trim() || undefined,
      isbn: isbn.trim() || undefined,
      cover_image_url: coverImageUrl.trim() || undefined,
    })

    setIsLoading(false)

    if (error) {
      showError(new Error(error), "Failed to create source")
      return
    }

    if (data) {
      showSuccess("Source created", `"${data.name}" has been added`)
      onSourceCreated?.(data.id)
      handleClose()
    }
  }

  // ISBN lookup using Open Library API
  const handleISBNLookup = async () => {
    if (!isbn.trim()) return

    setIsLookingUp(true)

    try {
      const cleanIsbn = isbn.replace(/[-\s]/g, "")
      const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&jscmd=data&format=json`
      )
      const data = await response.json()

      const bookData = data[`ISBN:${cleanIsbn}`]
      if (bookData) {
        if (bookData.title) setName(bookData.title)
        if (bookData.authors?.[0]?.name) setAuthor(bookData.authors[0].name)
        if (bookData.cover?.medium) setCoverImageUrl(bookData.cover.medium)
        setType("book")
        showSuccess("Book found", "Details filled from Open Library")
      } else {
        showError(new Error("Book not found"), "ISBN not found in Open Library")
      }
    } catch (err) {
      showError(new Error("Lookup failed"), "Could not fetch book details")
    }

    setIsLookingUp(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add Source
          </DialogTitle>
          <DialogDescription>
            Add a book, article, podcast, or other source to track your learning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ISBN lookup for books */}
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN (for books)</Label>
            <div className="flex gap-2">
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g., 978-0-13-110362-7"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleISBNLookup}
                disabled={!isbn.trim() || isLookingUp}
              >
                {isLookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter ISBN to auto-fill book details from Open Library
            </p>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Title / Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Atomic Habits"
                required
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author / Creator</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., James Clear"
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as SourceType)}
                >
                  {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((t) => (
                    <option key={t} value={t}>
                      {SOURCE_TYPE_ICONS[t]} {SOURCE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SourceStatus)}
                >
                  {(Object.keys(SOURCE_STATUS_LABELS) as SourceStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {SOURCE_STATUS_ICONS[s]} {SOURCE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="coverImage"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                {coverImageUrl && (
                  <div className="w-10 h-14 rounded overflow-hidden bg-secondary shrink-0">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Source"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
