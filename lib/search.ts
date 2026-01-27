import { createClient } from "@/lib/supabase/client"
import { SearchResult, SearchFilters, SearchResponse } from "@/lib/types/search"

/**
 * Search across thoughts, notes, and sources using full-text search
 */
export async function search(
  query: string,
  filters?: SearchFilters
): Promise<{ data: SearchResponse; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      data: { results: [], total: 0, query },
      error: "Not authenticated"
    }
  }

  // Handle empty query gracefully
  if (!query || query.trim() === "") {
    return {
      data: { results: [], total: 0, query },
      error: null
    }
  }

  const limit = filters?.limit || 20
  const offset = filters?.offset || 0

  // Use the search_knowledge database function
  const { data, error } = await supabase.rpc("search_knowledge", {
    search_query: query.trim(),
    filter_type: filters?.type || null,
    filter_context_id: filters?.contextId || null,
    result_limit: limit,
    result_offset: offset,
  })

  if (error) {
    // If the function doesn't exist, fall back to basic search
    if (error.code === "42883") {
      return fallbackSearch(query, filters, user.id)
    }
    return {
      data: { results: [], total: 0, query },
      error: error.message
    }
  }

  // Transform database results to SearchResult format
  const results: SearchResult[] = (data || []).map((row: {
    id: string
    type: string
    text: string
    secondary_text: string | null
    context_id: string | null
    created_at: string
    rank: number
  }) => ({
    id: row.id,
    type: row.type as SearchResult['type'],
    text: row.text,
    secondaryText: row.secondary_text,
    contextId: row.context_id,
    createdAt: row.created_at,
    rank: row.rank,
  }))

  return {
    data: {
      results,
      total: results.length,
      query
    },
    error: null
  }
}

/**
 * Fallback search using basic ILIKE queries when search_knowledge function is unavailable
 */
async function fallbackSearch(
  query: string,
  filters: SearchFilters | undefined,
  userId: string
): Promise<{ data: SearchResponse; error: string | null }> {
  const supabase = createClient()
  const searchPattern = `%${query}%`
  const results: SearchResult[] = []
  const limit = filters?.limit || 20

  // Search thoughts if no type filter or type is 'thought'
  if (!filters?.type || filters.type === 'thought') {
    let thoughtsQuery = supabase
      .from("gems")
      .select("id, content, source, context_id, created_at")
      .eq("user_id", userId)
      .neq("status", "retired")
      .or(`content.ilike.${searchPattern},source.ilike.${searchPattern}`)
      .limit(limit)

    if (filters?.contextId) {
      thoughtsQuery = thoughtsQuery.eq("context_id", filters.contextId)
    }

    const { data: thoughts } = await thoughtsQuery

    if (thoughts) {
      results.push(...thoughts.map((t, index) => ({
        id: t.id,
        type: 'thought' as const,
        text: t.content,
        secondaryText: t.source,
        contextId: t.context_id,
        createdAt: t.created_at,
        rank: index + 1,
      })))
    }
  }

  // Search notes if no type filter or type is 'note'
  if (!filters?.type || filters.type === 'note') {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, content, created_at")
      .eq("user_id", userId)
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .limit(limit)

    if (notes) {
      results.push(...notes.map((n, index) => ({
        id: n.id,
        type: 'note' as const,
        text: n.title || 'Untitled Note',
        secondaryText: n.content?.substring(0, 100) || null,
        contextId: null,
        createdAt: n.created_at,
        rank: results.length + index + 1,
      })))
    }
  }

  // Search sources if no type filter or type is 'source'
  if (!filters?.type || filters.type === 'source') {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, name, author, created_at")
      .eq("user_id", userId)
      .or(`name.ilike.${searchPattern},author.ilike.${searchPattern}`)
      .limit(limit)

    if (sources) {
      results.push(...sources.map((s, index) => ({
        id: s.id,
        type: 'source' as const,
        text: s.name,
        secondaryText: s.author,
        contextId: null,
        createdAt: s.created_at,
        rank: results.length + index + 1,
      })))
    }
  }

  // Sort by rank and apply limit
  const sortedResults = results
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)

  return {
    data: {
      results: sortedResults,
      total: sortedResults.length,
      query,
    },
    error: null,
  }
}
