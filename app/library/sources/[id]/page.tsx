"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getSource, updateSource, deleteSource, updateSourceStatus } from "@/lib/sources"
import { getSourceNotes, linkSourceToNote } from "@/lib/note-sources"
import { getSourceContexts, setSourceContexts } from "@/lib/source-contexts"
import { getContexts } from "@/lib/contexts"
import { createNote } from "@/app/notes/actions"
import { Source, SOURCE_TYPE_LABELS, SOURCE_TYPE_ICONS, SourceType, SourceStatus, SOURCE_STATUS_LABELS, SOURCE_STATUS_ICONS } from "@/lib/types/source"
import { Thought } from "@/lib/types/thought"
import type { Context, ContextWithCount } from "@/lib/types/context"
import { LayoutShell } from "@/components/layout-shell"
import { ThoughtForm } from "@/components/thought-form"
import { NoteEditor } from "@/components/note-editor"
import { NoteInput } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  ExternalLink,
  Gem,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  Quote,
  CheckCircle,
  Zap,
  ChevronDown,
  StickyNote,
  BarChart3,
  Tag,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/error-toast"

interface SourceDetailPageProps {
  params: Promise<{ id: string }>
}

export default function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [source, setSource] = useState<Source | null>(null)
  const [linkedThoughts, setLinkedThoughts] = useState<Thought[]>([])
  const [linkedNotes, setLinkedNotes] = useState<Array<{ id: string; title: string | null; created_at: string }>>([])
  const [linkedContexts, setLinkedContexts] = useState<Array<Context & { is_primary: boolean }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { showError, showSuccess } = useToast()

  // Tab state
  type Tab = "thoughts" | "notes" | "stats"
  const [activeTab, setActiveTab] = useState<Tab>("thoughts")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editAuthor, setEditAuthor] = useState("")
  const [editType, setEditType] = useState<SourceType>("other")
  const [editUrl, setEditUrl] = useState("")

  // Filter state
  type ThoughtFilter = "all" | "active" | "passive"
  const [thoughtFilter, setThoughtFilter] = useState<ThoughtFilter>("all")

  // Modal state
  const [showThoughtForm, setShowThoughtForm] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)

  // Context editing state
  const [allContexts, setAllContexts] = useState<ContextWithCount[]>([])
  const [isEditingContexts, setIsEditingContexts] = useState(false)
  const [editContextIds, setEditContextIds] = useState<string[]>([])
  const [editPrimaryContextId, setEditPrimaryContextId] = useState<string | null>(null)
  const [isSavingContexts, setIsSavingContexts] = useState(false)

  useEffect(() => {
    async function loadSource() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserEmail(user.email ?? null)

      const { data, error } = await getSource(id)

      if (error || !data) {
        showError(new Error(error || "Source not found"), "Failed to load source")
        router.push("/library?tab=sources")
        return
      }

      setSource(data)
      setEditName(data.name)
      setEditAuthor(data.author || "")
      setEditType(data.type)
      setEditUrl(data.url || "")

      // Load linked thoughts
      const { data: thoughts } = await supabase
        .from("gems")
        .select("*")
        .eq("user_id", user.id)
        .eq("source_id", id)
        .order("created_at", { ascending: false })

      setLinkedThoughts(thoughts || [])

      // Load linked notes
      const { data: notes } = await getSourceNotes(id)
      setLinkedNotes(notes || [])

      // Load linked contexts
      const { data: contexts } = await getSourceContexts(id)
      setLinkedContexts(contexts || [])

      // Initialize edit context state
      const contextIds = (contexts || []).map(c => c.id)
      setEditContextIds(contextIds)
      const primaryContext = (contexts || []).find(c => c.is_primary)
      setEditPrimaryContextId(primaryContext?.id || null)

      // Load all contexts for editing
      const { contexts: allCtx } = await getContexts()
      setAllContexts(allCtx)

      setIsLoading(false)
    }

    loadSource()
  }, [id, router, showError])

  const handleSave = async () => {
    if (!source) return

    setIsSaving(true)
    const { data, error } = await updateSource(source.id, {
      name: editName,
      author: editAuthor || undefined,
      type: editType,
      url: editUrl || undefined,
    })

    if (error) {
      showError(new Error(error), "Failed to update source")
    } else if (data) {
      setSource(data)
      showSuccess("Source updated")
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!source) return

    setIsDeleting(true)
    const { error } = await deleteSource(source.id)

    if (error) {
      showError(new Error(error), "Failed to delete source")
      setIsDeleting(false)
    } else {
      showSuccess("Source deleted")
      router.push("/library?tab=sources")
    }
  }

  const handleStatusChange = async (newStatus: SourceStatus) => {
    if (!source) return

    const { data, error } = await updateSourceStatus(source.id, newStatus)

    if (error) {
      showError(new Error(error), "Failed to update status")
    } else if (data) {
      setSource(data)
      showSuccess(`Status updated to "${SOURCE_STATUS_LABELS[newStatus]}"`)
    }
  }

  // Handle thought created from modal
  const handleThoughtCreated = (thought: Thought) => {
    setLinkedThoughts(prev => [thought, ...prev])
    setShowThoughtForm(false)
  }

  // Handle note save from modal
  const handleNoteSave = async (noteInput: NoteInput, existingId?: string, sourceIds?: string[]) => {
    const { note, error } = await createNote(noteInput)
    if (note && !error) {
      // Link the source to the note
      await linkSourceToNote(note.id, id)
      // Reload notes
      const { data: notes } = await getSourceNotes(id)
      setLinkedNotes(notes || [])
    }
    setShowNoteEditor(false)
  }

  // Handle context editing
  const toggleContextSelection = (contextId: string) => {
    setEditContextIds(prev => {
      if (prev.includes(contextId)) {
        // If removing primary, clear it
        if (editPrimaryContextId === contextId) {
          setEditPrimaryContextId(null)
        }
        return prev.filter(id => id !== contextId)
      } else {
        // First selected becomes primary
        if (prev.length === 0) {
          setEditPrimaryContextId(contextId)
        }
        return [...prev, contextId]
      }
    })
  }

  const handleSaveContexts = async () => {
    if (!source) return
    setIsSavingContexts(true)

    const { error } = await setSourceContexts(
      source.id,
      editContextIds,
      editPrimaryContextId || undefined
    )

    if (error) {
      showError(new Error(error), "Failed to update contexts")
    } else {
      // Reload contexts
      const { data: contexts } = await getSourceContexts(id)
      setLinkedContexts(contexts || [])
      showSuccess("Contexts updated")
      setIsEditingContexts(false)
    }
    setIsSavingContexts(false)
  }

  const cancelContextEditing = () => {
    // Reset to current values
    setEditContextIds(linkedContexts.map(c => c.id))
    setEditPrimaryContextId(linkedContexts.find(c => c.is_primary)?.id || null)
    setIsEditingContexts(false)
  }

  // Filter thoughts based on selection
  const filteredThoughts = linkedThoughts.filter((t) => {
    if (thoughtFilter === "active") return t.is_on_active_list
    if (thoughtFilter === "passive") return !t.is_on_active_list
    return true
  })

  // Calculate stats
  const activeCount = linkedThoughts.filter((t) => t.is_on_active_list).length
  const passiveCount = linkedThoughts.filter((t) => !t.is_on_active_list).length
  const totalApplications = linkedThoughts.reduce((sum, t) => sum + t.application_count, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!source) {
    return null
  }

  const typeIcon = SOURCE_TYPE_ICONS[source.type]
  const typeLabel = SOURCE_TYPE_LABELS[source.type]

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Source info */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Cover image or placeholder */}
                  <div className="w-20 h-28 rounded-lg overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                    {source.cover_image_url ? (
                      <img
                        src={source.cover_image_url}
                        alt={source.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{typeIcon}</span>
                    )}
                  </div>

                  <div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="name">Title</Label>
                          <Input
                            id="name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="author">Author</Label>
                          <Input
                            id="author"
                            value={editAuthor}
                            onChange={(e) => setEditAuthor(e.target.value)}
                            placeholder="Optional"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select
                            id="type"
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as SourceType)}
                            className="mt-1"
                          >
                            {Object.entries(SOURCE_TYPE_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {SOURCE_TYPE_ICONS[value as SourceType]} {label}
                                </option>
                              )
                            )}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="url">URL</Label>
                          <Input
                            id="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="Optional"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-xl mb-2">
                          {source.name}
                        </CardTitle>
                        {source.author && (
                          <p className="text-muted-foreground mb-2">
                            by {source.author}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            <span className="mr-1">{typeIcon}</span>
                            {typeLabel}
                          </Badge>

                          {/* Status dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 gap-1">
                                <span>{SOURCE_STATUS_ICONS[source.status]}</span>
                                {SOURCE_STATUS_LABELS[source.status]}
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {(Object.keys(SOURCE_STATUS_LABELS) as SourceStatus[]).map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => handleStatusChange(status)}
                                  className={source.status === status ? "bg-accent" : ""}
                                >
                                  <span className="mr-2">{SOURCE_STATUS_ICONS[status]}</span>
                                  {SOURCE_STATUS_LABELS[status]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {source.url && !isEditing && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View source
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Gem className="h-4 w-4" />
                    Total Thoughts
                  </span>
                  <span className="font-medium">{linkedThoughts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    On Active List
                  </span>
                  <span className="font-medium">{activeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </span>
                  <span className="font-medium">{linkedNotes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Applications
                  </span>
                  <span className="font-medium">{totalApplications}</span>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Added {new Date(source.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Linked Contexts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Contexts
                </CardTitle>
                {!isEditingContexts ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsEditingContexts(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={cancelContextEditing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveContexts}
                      disabled={isSavingContexts}
                    >
                      {isSavingContexts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isEditingContexts ? (
                  <div className="space-y-2">
                    {allContexts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No contexts available</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {allContexts.map((context) => {
                          const isSelected = editContextIds.includes(context.id)
                          const isPrimary = editPrimaryContextId === context.id
                          return (
                            <button
                              key={context.id}
                              type="button"
                              onClick={() => toggleContextSelection(context.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: context.color || "#6B7280" }}
                              />
                              {context.name}
                              {isPrimary && <CheckCircle className="h-3 w-3 ml-1" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {editContextIds.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        First selected context is primary
                      </p>
                    )}
                  </div>
                ) : linkedContexts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {linkedContexts.map((context) => (
                      <Badge
                        key={context.id}
                        variant={context.is_primary ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: context.color || "#6B7280" }}
                        />
                        {context.name}
                        {context.is_primary && <span className="text-xs ml-1">(primary)</span>}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No contexts linked</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-8">
          {/* Tab navigation */}
          <div className="flex items-center gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("thoughts")}
              className={`pb-3 px-1 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "thoughts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gem className="h-4 w-4" />
              Thoughts ({linkedThoughts.length})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-3 px-1 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "notes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <StickyNote className="h-4 w-4" />
              Notes ({linkedNotes.length})
            </button>
          </div>

          {/* Thoughts Tab */}
          {activeTab === "thoughts" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Thoughts from this source</h2>
                <Button size="sm" onClick={() => setShowThoughtForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add thought
                </Button>
              </div>

              {/* Filter tabs */}
              {linkedThoughts.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant={thoughtFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThoughtFilter("all")}
                  >
                    All ({linkedThoughts.length})
                  </Button>
                  <Button
                    variant={thoughtFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThoughtFilter("active")}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Active ({activeCount})
                  </Button>
                  <Button
                    variant={thoughtFilter === "passive" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThoughtFilter("passive")}
                  >
                    Passive ({passiveCount})
                  </Button>
                </div>
              )}

              {linkedThoughts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No thoughts from this source yet.
                  </CardContent>
                </Card>
              ) : filteredThoughts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No {thoughtFilter === "active" ? "active" : "passive"} thoughts from this source.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredThoughts.map((thought) => (
                    <Link key={thought.id} href={`/thoughts/${thought.id}`}>
                      <Card className="group hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                            <Quote className="h-4 w-4 text-violet-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              &ldquo;{thought.content}&rdquo;
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{thought.application_count} applications</span>
                              {thought.is_on_active_list && (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-600"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Notes about this source</h2>
                <Button size="sm" onClick={() => setShowNoteEditor(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add note
                </Button>
              </div>

              {linkedNotes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No notes linked to this source yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {linkedNotes.map((note) => (
                    <Link key={note.id} href={`/library?tab=notes&noteId=${note.id}`}>
                      <Card className="group hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <StickyNote className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {note.title || "Untitled Note"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Source?</DialogTitle>
            <DialogDescription>
              This will permanently delete this source. Thoughts linked to this
              source will not be deleted, but their source reference will be
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

      {/* Thought Form Modal */}
      <ThoughtForm
        isOpen={showThoughtForm}
        onClose={() => setShowThoughtForm(false)}
        onThoughtCreated={handleThoughtCreated}
        defaultSource={source}
      />

      {/* Note Editor Modal */}
      <NoteEditor
        note={null}
        isOpen={showNoteEditor}
        onClose={() => setShowNoteEditor(false)}
        onSave={handleNoteSave}
        defaultSourceId={source.id}
      />
    </LayoutShell>
  )
}
