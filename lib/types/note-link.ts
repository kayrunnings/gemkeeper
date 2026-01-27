// Note-thought link types for bi-directional linking
// Links notes to thoughts (gems) with position ordering

export interface NoteThoughtLink {
  id: string
  note_id: string
  gem_id: string
  position: number
  created_at: string
}

export interface CreateNoteLinkInput {
  note_id: string
  gem_id: string
  position?: number
}

export interface ReorderLinkInput {
  gem_id: string
  position: number
}
