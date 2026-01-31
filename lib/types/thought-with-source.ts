// Extended thought type with joined source data (Epic 13)
import { Thought } from './thought'
import { SourceType } from './source'

// Source data that can be joined with a thought
export interface ThoughtSourceData {
  id: string
  name: string
  author: string | null
  type: SourceType
  cover_image_url: string | null
}

// Thought with optional joined source data
export interface ThoughtWithSource extends Thought {
  source_data?: ThoughtSourceData | null
}
