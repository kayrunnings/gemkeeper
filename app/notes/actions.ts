"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { NoteInput } from "@/lib/types"

export async function getNotes() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", notes: [] }
  }

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    return { error: error.message, notes: [] }
  }

  return { notes: data, error: null }
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

  const { data, error } = await supabase
    .from("notes")
    .update({
      title: input.title || null,
      content: input.content || null,
      folder_id: input.folder_id,
    })
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
