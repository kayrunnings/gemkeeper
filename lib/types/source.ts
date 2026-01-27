// Source entity types for ThoughtFolio 2.0
// Sources are first-class entities representing books, articles, podcasts, etc.

export type SourceType = 'book' | 'article' | 'podcast' | 'video' | 'course' | 'other'

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
  book: '\uD83D\uDCD6',
  article: '\uD83D\uDCF0',
  podcast: '\uD83C\uDFA7',
  video: '\uD83C\uDFAC',
  course: '\uD83C\uDF93',
  other: '\uD83D\uDCCC',
}
