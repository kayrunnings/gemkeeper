"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { createSource } from "@/lib/sources"
import { setSourceContexts } from "@/lib/source-contexts"
import { getContexts } from "@/lib/contexts"
import type { ContextWithCount } from "@/lib/types/context"
import {
  SourceType,
  SourceStatus,
  Source,
  SOURCE_TYPE_LABELS,
  SOURCE_TYPE_ICONS,
  SOURCE_STATUS_LABELS,
  SOURCE_STATUS_ICONS,
} from "@/lib/types/source"
import {
  Loader2,
  BookOpen,
  Search,
  FileText,
  Headphones,
  Video,
  GraduationCap,
  HelpCircle,
  ArrowLeft,
  ExternalLink,
  Plus,
  StickyNote,
  Lightbulb,
  X,
  Check,
} from "lucide-react"
import { useToast } from "@/components/error-toast"
import { cn } from "@/lib/utils"

// Open Library search result type
interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  isbn?: string[]
  first_publish_year?: number
}

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSourceCreated?: (sourceId: string, source?: Source) => void
  onAddThought?: (sourceId: string) => void
  onAddNote?: (sourceId: string) => void
  defaultType?: SourceType
}

type Step = "type" | "details" | "success"

const TYPE_CARDS: Array<{ type: SourceType; icon: React.ReactNode; description: string }> = [
  { type: "book", icon: <BookOpen className="h-6 w-6" />, description: "Books, ebooks, audiobooks" },
  { type: "article", icon: <FileText className="h-6 w-6" />, description: "Articles, blog posts, papers" },
  { type: "podcast", icon: <Headphones className="h-6 w-6" />, description: "Podcasts, audio content" },
  { type: "video", icon: <Video className="h-6 w-6" />, description: "Videos, courses, talks" },
  { type: "course", icon: <GraduationCap className="h-6 w-6" />, description: "Online courses, workshops" },
  { type: "other", icon: <HelpCircle className="h-6 w-6" />, description: "Conversations, experiences" },
]

export function AddSourceModal({
  isOpen,
  onClose,
  onSourceCreated,
  onAddThought,
  onAddNote,
  defaultType,
}: AddSourceModalProps) {
  // Step state
  const [step, setStep] = useState<Step>(defaultType ? "details" : "type")

  // Form state
  const [type, setType] = useState<SourceType>(defaultType || "book")
  const [name, setName] = useState("")
  const [author, setAuthor] = useState("")
  const [status, setStatus] = useState<SourceStatus>("want_to_read")
  const [url, setUrl] = useState("")
  const [isbn, setIsbn] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")

  // Context linking state
  const [contexts, setContexts] = useState<ContextWithCount[]>([])
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([])
  const [primaryContextId, setPrimaryContextId] = useState<string | null>(null)
  const [contextsLoading, setContextsLoading] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [createdSource, setCreatedSource] = useState<Source | null>(null)
  const { showError, showSuccess } = useToast()

  // Load contexts on mount
  useEffect(() => {
    if (isOpen) {
      loadContexts()
    }
  }, [isOpen])

  const loadContexts = async () => {
    setContextsLoading(true)
    const { contexts: data } = await getContexts()
    setContexts(data)
    setContextsLoading(false)
  }

  const resetForm = () => {
    setStep(defaultType ? "details" : "type")
    setType(defaultType || "book")
    setName("")
    setAuthor("")
    setStatus("want_to_read")
    setUrl("")
    setIsbn("")
    setCoverImageUrl("")
    setSearchQuery("")
    setSearchResults([])
    setSelectedContextIds([])
    setPrimaryContextId(null)
    setCreatedSource(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleTypeSelect = (selectedType: SourceType) => {
    setType(selectedType)
    setStep("details")
  }

  const handleBack = () => {
    if (step === "details") {
      setStep("type")
    }
  }

  // Search Open Library by title
  const handleTitleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=5`
      )
      const data = await response.json()
      setSearchResults(data.docs || [])
    } catch (err) {
      showError(new Error("Search failed"), "Could not search Open Library")
    }

    setIsSearching(false)
  }

  // Select a book from search results
  const handleSelectBook = (book: OpenLibraryBook) => {
    setName(book.title)
    if (book.author_name?.[0]) setAuthor(book.author_name[0])
    if (book.cover_i) {
      setCoverImageUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`)
    }
    if (book.isbn?.[0]) setIsbn(book.isbn[0])
    setSearchResults([])
    setSearchQuery("")
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
        showSuccess("Book found", "Details filled from Open Library")
      } else {
        showError(new Error("Book not found"), "ISBN not found in Open Library")
      }
    } catch (err) {
      showError(new Error("Lookup failed"), "Could not fetch book details")
    }

    setIsLookingUp(false)
  }

  // Toggle context selection
  const toggleContext = (contextId: string) => {
    setSelectedContextIds((prev) => {
      if (prev.includes(contextId)) {
        // If removing the primary context, clear primary
        if (primaryContextId === contextId) {
          setPrimaryContextId(null)
        }
        return prev.filter((id) => id !== contextId)
      } else {
        // If first context, make it primary
        if (prev.length === 0) {
          setPrimaryContextId(contextId)
        }
        return [...prev, contextId]
      }
    })
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

    if (error) {
      showError(new Error(error), "Failed to create source")
      setIsLoading(false)
      return
    }

    if (data) {
      // Link contexts if any selected
      if (selectedContextIds.length > 0) {
        await setSourceContexts(data.id, selectedContextIds, primaryContextId || undefined)
      }

      setCreatedSource(data)
      setStep("success")
      onSourceCreated?.(data.id, data)
    }

    setIsLoading(false)
  }

  const handleAddThought = () => {
    if (createdSource && onAddThought) {
      onAddThought(createdSource.id)
      handleClose()
    }
  }

  const handleAddNote = () => {
    if (createdSource && onAddNote) {
      onAddNote(createdSource.id)
      handleClose()
    }
  }

  // Render type selection step
  const renderTypeStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          What kind of source?
        </DialogTitle>
        <DialogDescription>
          Choose the type of source you want to add
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 py-4">
        {TYPE_CARDS.map(({ type: t, icon, description }) => (
          <button
            key={t}
            onClick={() => handleTypeSelect(t)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              "hover:border-primary hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <div className="p-3 rounded-full bg-muted">
              {icon}
            </div>
            <div className="text-center">
              <p className="font-medium">{SOURCE_TYPE_LABELS[t]}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  )

  // Render details form step
  const renderDetailsStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="text-xl">{SOURCE_TYPE_ICONS[type]}</span>
          Add {SOURCE_TYPE_LABELS[type]}
        </DialogTitle>
        <DialogDescription>
          {!defaultType && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Change type
            </button>
          )}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Book-specific: Title search and ISBN lookup */}
        {type === "book" && (
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Search Open Library</p>

            {/* Title search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search by Title</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleTitleSearch())}
                  placeholder="e.g., Atomic Habits"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTitleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((book) => (
                  <button
                    key={book.key}
                    type="button"
                    onClick={() => handleSelectBook(book)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background text-left"
                  >
                    {book.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                        alt=""
                        className="w-8 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-secondary rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      {book.author_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {book.author_name[0]}
                          {book.first_publish_year && ` (${book.first_publish_year})`}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ISBN lookup */}
            <div className="space-y-2">
              <Label htmlFor="isbn">Or enter ISBN</Label>
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
                    "Lookup"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Title / Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Title / Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "book" ? "e.g., Atomic Habits" : type === "podcast" ? "e.g., The Tim Ferriss Show" : "Enter title..."}
            required
          />
        </div>

        {/* Author / Creator */}
        <div className="space-y-2">
          <Label htmlFor="author">
            {type === "podcast" ? "Host" : type === "video" ? "Creator" : type === "course" ? "Instructor" : "Author"}
          </Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={type === "podcast" ? "e.g., Tim Ferriss" : type === "course" ? "e.g., Andrew Ng" : "e.g., James Clear"}
          />
        </div>

        {/* Cover preview */}
        {coverImageUrl && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="w-12 h-16 object-cover rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{name || "Cover image"}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setCoverImageUrl("")}
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Status */}
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

        {/* URL - show for non-book types or optionally for books */}
        {(type !== "book" || url) && (
          <div className="space-y-2">
            <Label htmlFor="url">
              URL {type === "article" || type === "video" ? "" : "(optional)"}
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        {/* Context linking */}
        <div className="space-y-2">
          <Label>Related Contexts (optional)</Label>
          {contextsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading contexts...
            </div>
          ) : contexts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contexts yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contexts.map((context) => {
                const isSelected = selectedContextIds.includes(context.id)
                const isPrimary = primaryContextId === context.id
                return (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => toggleContext(context.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: context.color || "#6B7280" }}
                    />
                    {context.name}
                    {isPrimary && <Check className="h-3 w-3 ml-1" />}
                  </button>
                )
              })}
            </div>
          )}
          {selectedContextIds.length > 1 && (
            <p className="text-xs text-muted-foreground">
              First selected context is marked as primary
            </p>
          )}
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
    </>
  )

  // Render success step with options to add thought or note
  const renderSuccessStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          Source Added
        </DialogTitle>
      </DialogHeader>

      <div className="py-6 space-y-4">
        {createdSource && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {createdSource.cover_image_url ? (
              <img
                src={createdSource.cover_image_url}
                alt=""
                className="w-12 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-16 bg-secondary rounded flex items-center justify-center">
                <span className="text-2xl">{SOURCE_TYPE_ICONS[createdSource.type]}</span>
              </div>
            )}
            <div>
              <p className="font-medium">{createdSource.name}</p>
              {createdSource.author && (
                <p className="text-sm text-muted-foreground">by {createdSource.author}</p>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-muted-foreground">
          What would you like to do next?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleAddThought}
            disabled={!onAddThought}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Lightbulb className="h-6 w-6" />
            <span>Add a Thought</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleAddNote}
            disabled={!onAddNote}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <StickyNote className="h-6 w-6" />
            <span>Add a Note</span>
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Done
        </Button>
      </DialogFooter>
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "type" && renderTypeStep()}
        {step === "details" && renderDetailsStep()}
        {step === "success" && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  )
}
