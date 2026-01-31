// Note-Source linking service (Epic 13)
// Manages many-to-many relationships between notes and sources

import { createClient } from "@/lib/supabase/client"
import { Source } from "@/lib/types/source"

interface NoteSource {
  id: string
  note_id: string
  source_id: string
  created_at: string
}

/**
 * Link a source to a note
 */
export async function linkSourceToNote(
  noteId: string,
  sourceId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("note_sources")
    .insert({
      note_id: noteId,
      source_id: sourceId,
    })

  if (error) {
    // Ignore duplicate key errors
    if (error.code === "23505") {
      return { error: null }
    }
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Unlink a source from a note
 */
export async function unlinkSourceFromNote(
  noteId: string,
  sourceId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("note_sources")
    .delete()
    .eq("note_id", noteId)
    .eq("source_id", sourceId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Get all sources linked to a note
 */
export async function getNoteSources(
  noteId: string
): Promise<{ data: Source[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get source IDs linked to this note
  const { data: links, error: linksError } = await supabase
    .from("note_sources")
    .select("source_id")
    .eq("note_id", noteId)

  if (linksError) {
    return { data: [], error: linksError.message }
  }

  if (!links || links.length === 0) {
    return { data: [], error: null }
  }

  // Get the actual sources
  const sourceIds = links.map((l) => l.source_id)
  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("*")
    .in("id", sourceIds)
    .eq("user_id", user.id)

  if (sourcesError) {
    return { data: [], error: sourcesError.message }
  }

  return { data: sources || [], error: null }
}

/**
 * Get all notes linked to a source
 */
export async function getSourceNotes(
  sourceId: string
): Promise<{
  data: Array<{ id: string; title: string | null; created_at: string }>
  error: string | null
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get note IDs linked to this source
  const { data: links, error: linksError } = await supabase
    .from("note_sources")
    .select("note_id")
    .eq("source_id", sourceId)

  if (linksError) {
    return { data: [], error: linksError.message }
  }

  if (!links || links.length === 0) {
    return { data: [], error: null }
  }

  // Get the actual notes
  const noteIds = links.map((l) => l.note_id)
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id, title, created_at")
    .in("id", noteIds)
    .eq("user_id", user.id)

  if (notesError) {
    return { data: [], error: notesError.message }
  }

  return { data: notes || [], error: null }
}

/**
 * Set all sources for a note (replaces existing links)
 */
export async function setNoteSources(
  noteId: string,
  sourceIds: string[]
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Delete existing links
  const { error: deleteError } = await supabase
    .from("note_sources")
    .delete()
    .eq("note_id", noteId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Insert new links
  if (sourceIds.length > 0) {
    const { error: insertError } = await supabase
      .from("note_sources")
      .insert(
        sourceIds.map((sourceId) => ({
          note_id: noteId,
          source_id: sourceId,
        }))
      )

    if (insertError) {
      return { error: insertError.message }
    }
  }

  return { error: null }
}

/**
 * Get source IDs for a note
 */
export async function getNoteSourceIds(
  noteId: string
): Promise<{ data: string[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("note_sources")
    .select("source_id")
    .eq("note_id", noteId)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data || []).map((l) => l.source_id), error: null }
}
