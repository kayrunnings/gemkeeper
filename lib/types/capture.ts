/**
 * Capture types for ThoughtFolio 2.0 AI Quick Capture
 */

export type ContentType = 'url' | 'short_text' | 'long_text' | 'mixed' | 'list'

export interface CaptureItem {
  id: string // temporary client-side ID
  type: 'thought' | 'note' | 'source'
  content: string
  source?: string
  sourceUrl?: string
  contextId?: string
  addToActiveList?: boolean
  linkToThoughtId?: string // for notes linking to thoughts
  selected: boolean
}

export interface CaptureAnalysisResult {
  contentType: ContentType
  suggestions: CaptureItem[]
}

export interface CaptureAnalyzeRequest {
  content: string
}

export interface CaptureAnalyzeResponse {
  success: boolean
  contentType: ContentType
  suggestions: CaptureItem[]
  error?: string
}

export interface CaptureSaveRequest {
  items: CaptureItem[]
}

export interface CaptureSaveResponse {
  success: boolean
  created: {
    thoughts: number
    notes: number
    sources: number
  }
  error?: string
}

// Source detection result
export interface SourceAttribution {
  quote: string
  source?: string
  author?: string
}

// Content splitting result
export interface SplitContentResult {
  quotes: string[]
  reflections: string[]
}
