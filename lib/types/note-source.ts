// Note-Source relationship types (Epic 13)
// Notes can have multiple sources linked to them

import { Source } from './source'

// Note-source join record
export interface NoteSource {
  id: string
  note_id: string
  source_id: string
  created_at: string
}

// Note type with optional sources array
export interface NoteWithSources {
  id: string
  user_id: string
  title: string | null
  content: string | null
  folder_id: string | null
  is_draft: boolean
  created_at: string
  updated_at: string
  sources?: Source[]
}

// Source with linked notes
export interface SourceWithNotes extends Source {
  notes?: Array<{
    id: string
    title: string | null
    created_at: string
  }>
}
