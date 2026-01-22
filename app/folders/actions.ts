"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getFolders() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", folders: [] }
  }

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    return { error: error.message, folders: [] }
  }

  return { folders: data, error: null }
}

export async function createFolder(name: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", folder: null }
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      name: name,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, folder: null }
  }

  revalidatePath("/dashboard")
  return { folder: data, error: null }
}

export async function updateFolder(folderId: string, name: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", folder: null }
  }

  const { data, error } = await supabase
    .from("folders")
    .update({ name: name })
    .eq("id", folderId)
    .eq("user_id", user.id) // Extra safety check
    .select()
    .single()

  if (error) {
    return { error: error.message, folder: null }
  }

  revalidatePath("/dashboard")
  return { folder: data, error: null }
}

export async function deleteFolder(folderId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // First, set folder_id to null for all notes in this folder
  const { error: notesError } = await supabase
    .from("notes")
    .update({ folder_id: null })
    .eq("folder_id", folderId)
    .eq("user_id", user.id)

  if (notesError) {
    return { error: notesError.message }
  }

  // Then delete the folder
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId)
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

  // If folderId is provided, verify the folder belongs to the user
  if (folderId) {
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single()

    if (folderError || !folder) {
      return { error: "Folder not found" }
    }
  }

  const { error } = await supabase
    .from("notes")
    .update({ folder_id: folderId })
    .eq("id", noteId)
    .eq("user_id", user.id) // Extra safety check

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null }
}

export async function getNotesByFolder(folderId: string | null) {
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

  // Filter by folder_id (null means unfiled notes)
  if (folderId === null) {
    query = query.is("folder_id", null)
  } else {
    query = query.eq("folder_id", folderId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, notes: [] }
  }

  return { notes: data, error: null }
}
