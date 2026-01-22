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
      title: input.title,
      content: input.content,
      tags: input.tags,
      is_favorite: input.is_favorite ?? false,
    })
    .select()
    .single()

  if (error) {
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
      title: input.title,
      content: input.content,
      tags: input.tags,
      is_favorite: input.is_favorite,
    })
    .eq("id", noteId)
    .eq("user_id", user.id) // Extra safety check
    .select()
    .single()

  if (error) {
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

export async function toggleFavorite(noteId: string, isFavorite: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notes")
    .update({ is_favorite: isFavorite })
    .eq("id", noteId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null }
}
