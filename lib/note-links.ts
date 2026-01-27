import { createClient } from "@/lib/supabase/client"
import { NoteThoughtLink, ReorderLinkInput } from "@/lib/types/note-link"
import { Thought } from "@/lib/types/thought"
import { Note } from "@/lib/types"

/**
 * Link a thought to a note
 */
export async function linkThoughtToNote(
  noteId: string,
  gemId: string,
  position?: number
): Promise<{ data: NoteThoughtLink | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  // If no position specified, get the max position and add 1
  let finalPosition = position
  if (finalPosition === undefined) {
    const { data: existingLinks } = await supabase
      .from("note_thought_links")
      .select("position")
      .eq("note_id", noteId)
      .order("position", { ascending: false })
      .limit(1)

    finalPosition = existingLinks && existingLinks.length > 0
      ? existingLinks[0].position + 1
      : 0
  }

  const { data, error } = await supabase
    .from("note_thought_links")
    .insert({
      note_id: noteId,
      gem_id: gemId,
      position: finalPosition,
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      return { data: null, error: "Thought is already linked to this note" }
    }
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Unlink a thought from a note
 */
export async function unlinkThoughtFromNote(
  noteId: string,
  gemId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("note_thought_links")
    .delete()
    .eq("note_id", noteId)
    .eq("gem_id", gemId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Get all thoughts linked to a note
 */
export async function getLinkedThoughts(
  noteId: string
): Promise<{ data: Thought[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get the links with the associated thoughts
  const { data: links, error } = await supabase
    .from("note_thought_links")
    .select(`
      position,
      gems:gem_id (*)
    `)
    .eq("note_id", noteId)
    .order("position", { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  // Extract thoughts from the links and filter out any nulls
  const thoughts = links
    ?.map(link => link.gems as unknown as Thought)
    .filter((thought): thought is Thought => thought !== null) || []

  return { data: thoughts, error: null }
}

/**
 * Get all notes linked to a thought
 */
export async function getLinkedNotes(
  gemId: string
): Promise<{ data: Note[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get the links with the associated notes
  const { data: links, error } = await supabase
    .from("note_thought_links")
    .select(`
      notes:note_id (*)
    `)
    .eq("gem_id", gemId)

  if (error) {
    return { data: [], error: error.message }
  }

  // Extract notes from the links and filter out any nulls
  const notes = links
    ?.map(link => link.notes as unknown as Note)
    .filter((note): note is Note => note !== null) || []

  return { data: notes, error: null }
}

/**
 * Reorder links for a note
 */
export async function reorderLinks(
  noteId: string,
  links: ReorderLinkInput[]
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Update each link's position
  for (const link of links) {
    const { error } = await supabase
      .from("note_thought_links")
      .update({ position: link.position })
      .eq("note_id", noteId)
      .eq("gem_id", link.gem_id)

    if (error) {
      return { error: error.message }
    }
  }

  return { error: null }
}
