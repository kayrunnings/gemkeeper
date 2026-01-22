// Folder type definition
export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

// Note type definition
export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  is_favorite: boolean
  folder_id: string | null
  created_at: string
  updated_at: string
  user_id: string
}

// For creating/updating notes (without server-generated fields)
export interface NoteInput {
  title: string
  content: string
  tags: string[]
  is_favorite?: boolean
}

// User type (from Supabase Auth)
export interface User {
  id: string
  email: string
  created_at: string
}
