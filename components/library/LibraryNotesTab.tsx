"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Note } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StickyNote, Loader2, Gem, FolderIcon, Plus } from "lucide-react"

interface LibraryNotesTabProps {
  searchQuery?: string
}

export function LibraryNotesTab({ searchQuery }: LibraryNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [linkedThoughtsCounts, setLinkedThoughtsCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const router = useRouter()
  const limit = 20

  useEffect(() => {
    setOffset(0)
    loadNotes(true)
  }, [searchQuery])

  async function loadNotes(reset = false) {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const currentOffset = reset ? 0 : offset

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(currentOffset, currentOffset + limit - 1)

    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading notes:", error)
      setIsLoading(false)
      return
    }

    // Get linked thoughts counts from note_thought_links table
    if (data && data.length > 0) {
      const noteIds = data.map((n) => n.id)
      const { data: links } = await supabase
        .from("note_thought_links")
        .select("note_id")
        .in("note_id", noteIds)

      if (links) {
        const counts: Record<string, number> = {}
        for (const link of links) {
          counts[link.note_id] = (counts[link.note_id] || 0) + 1
        }
        setLinkedThoughtsCounts((prev) => ({ ...prev, ...counts }))
      }
    }

    if (reset) {
      setNotes(data || [])
    } else {
      setNotes((prev) => [...prev, ...(data || [])])
    }

    setHasMore((data || []).length >= limit)
    setOffset(currentOffset + limit)
    setIsLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    })
  }

  const getPreview = (content: string | null, maxLength: number = 120) => {
    if (!content) return ""
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^[-*]\s/gm, "")
      .replace(/^\d+\.\s/gm, "")
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText
  }

  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard?note=${noteId}`)
  }

  if (isLoading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {searchQuery
            ? "No notes found"
            : "No notes yet. Start writing your thoughts!"}
        </p>
        <Button asChild className="mt-4">
          <a href="/dashboard">Create Note</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const linkedCount = linkedThoughtsCounts[note.id] || 0

        return (
          <Card
            key={note.id}
            className="group hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => handleNoteClick(note.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <StickyNote className="h-5 w-5 text-blue-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
                    {note.title || "Untitled Note"}
                  </h3>

                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {getPreview(note.content)}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(note.updated_at)}</span>
                    {linkedCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Gem className="h-3 w-3" />
                          {linkedCount} thought{linkedCount !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => loadNotes(false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
