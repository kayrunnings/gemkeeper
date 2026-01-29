"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { NoteInput } from "@/lib/types"

export async function getNotes(includeDrafts: boolean = false) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", notes: [] }
  }

  let query = supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  // By default, exclude drafts from the main notes list
  if (!includeDrafts) {
    query = query.or("is_draft.is.null,is_draft.eq.false")
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, notes: [] }
  }

  return { notes: data, error: null }
}

export async function getDrafts() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", drafts: [] }
  }

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_draft", true)
    .order("updated_at", { ascending: false })

  if (error) {
    return { error: error.message, drafts: [] }
  }

  return { drafts: data, error: null }
}

export async function createNote(input: NoteInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", note: null }
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: input.title || null,
      content: input.content || null,
      folder_id: input.folder_id || null,
      is_draft: input.is_draft ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating note:", error)
    return { error: error.message, note: null }
  }

  revalidatePath("/dashboard")
  return { note: data, error: null }
}

export async function updateNote(noteId: string, input: NoteInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", note: null }
  }

  const updateData: Record<string, unknown> = {
    title: input.title || null,
    content: input.content || null,
  }

  // Only update folder_id if explicitly provided
  if (input.folder_id !== undefined) {
    updateData.folder_id = input.folder_id
  }

  // Only update is_draft if explicitly provided
  if (input.is_draft !== undefined) {
    updateData.is_draft = input.is_draft
  }

  const { data, error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId)
    .eq("user_id", user.id) // Extra safety check
    .select()
    .single()

  if (error) {
    console.error("Error updating note:", error)
    return { error: error.message, note: null }
  }

  revalidatePath("/dashboard")
  return { note: data, error: null }
}

// Save or update a draft - creates new draft if no draftId provided
export async function saveDraft(input: NoteInput, draftId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", draft: null }
  }

  if (draftId) {
    // Update existing draft
    const { data, error } = await supabase
      .from("notes")
      .update({
        title: input.title || null,
        content: input.content || null,
        is_draft: true,
      })
      .eq("id", draftId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating draft:", error)
      return { error: error.message, draft: null }
    }

    return { draft: data, error: null }
  } else {
    // Create new draft
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: input.title || null,
        content: input.content || null,
        is_draft: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating draft:", error)
      return { error: error.message, draft: null }
    }

    return { draft: data, error: null }
  }
}

// Publish a draft (convert it to a regular note)
export async function publishDraft(draftId: string, input?: NoteInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", note: null }
  }

  const updateData: Record<string, unknown> = {
    is_draft: false,
  }

  if (input?.title !== undefined) {
    updateData.title = input.title || null
  }
  if (input?.content !== undefined) {
    updateData.content = input.content || null
  }
  if (input?.folder_id !== undefined) {
    updateData.folder_id = input.folder_id
  }

  const { data, error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", draftId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error publishing draft:", error)
    return { error: error.message, note: null }
  }

  revalidatePath("/dashboard")
  return { note: data, error: null }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id) // Extra safety check

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null }
}

export async function moveNoteToFolder(noteId: string, folderId: string | null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notes")
    .update({ folder_id: folderId })
    .eq("id", noteId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error moving note to folder:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null }
}
