// Search types for full-text search across knowledge base

export type SearchResultType = 'thought' | 'note' | 'source'

export interface SearchResult {
  id: string
  type: SearchResultType
  text: string
  secondaryText: string | null
  contextId: string | null
  createdAt: string
  rank: number
}

export interface SearchFilters {
  type?: SearchResultType
  contextId?: string
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}
