// Source entity types for ThoughtFolio 2.0
// Sources are first-class entities representing books, articles, podcasts, etc.

export type SourceType = 'book' | 'article' | 'podcast' | 'video' | 'course' | 'other'

// Source status for tracking reading progress (Epic 13)
export type SourceStatus = 'want_to_read' | 'reading' | 'completed' | 'archived'

export interface Source {
  id: string
  user_id: string
  name: string
  author: string | null
  type: SourceType
  url: string | null
  isbn: string | null
  cover_image_url: string | null
  metadata: Record<string, unknown>
  status: SourceStatus
  created_at: string
  updated_at: string
}

export interface CreateSourceInput {
  name: string
  author?: string
  type?: SourceType
  url?: string
  isbn?: string
  cover_image_url?: string
  metadata?: Record<string, unknown>
  status?: SourceStatus
}

export interface UpdateSourceInput extends Partial<CreateSourceInput> {}

// Source type display labels
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  book: 'Book',
  article: 'Article',
  podcast: 'Podcast',
  video: 'Video',
  course: 'Course',
  other: 'Other',
}

// Source type icons (emoji)
export const SOURCE_TYPE_ICONS: Record<SourceType, string> = {
  book: '📖',
  article: '📰',
  podcast: '🎧',
  video: '🎬',
  course: '🎓',
  other: '📌',
}

// Source status labels (Epic 13)
export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  completed: 'Completed',
  archived: 'Archived',
}

// Source status icons (Epic 13)
export const SOURCE_STATUS_ICONS: Record<SourceStatus, string> = {
  want_to_read: '📚',
  reading: '📖',
  completed: '✅',
  archived: '📦',
}
