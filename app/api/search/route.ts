import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SearchResult, SearchResultType } from "@/lib/types/search"

/**
 * GET /api/search
 * Full-text search across thoughts, notes, and sources
 *
 * Query params:
 * - q: search query (required)
 * - type: filter by type (thought, note, source)
 * - limit: max results (default 20, max 100)
 * - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const type = searchParams.get("type") as SearchResultType | null
    const limitParam = searchParams.get("limit")
    const offsetParam = searchParams.get("offset")

    // Validate query
    if (!query || query.trim() === "") {
      return NextResponse.json({
        results: [],
        total: 0,
        query: "",
      })
    }

    // Parse and validate limit
    let limit = 20
    if (limitParam) {
      const parsed = parseInt(limitParam, 10)
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        limit = parsed
      }
    }

    // Parse offset
    let offset = 0
    if (offsetParam) {
      const parsed = parseInt(offsetParam, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        offset = parsed
      }
    }

    // Validate type
    const validTypes: SearchResultType[] = ['thought', 'note', 'source']
    const filterType = type && validTypes.includes(type) ? type : null

    // Try to use the search_knowledge database function
    const { data: rpcResults, error: rpcError } = await supabase.rpc("search_knowledge", {
      search_query: query.trim(),
      filter_type: filterType,
      filter_context_id: null,
      result_limit: limit,
      result_offset: offset,
    })

    if (!rpcError && rpcResults) {
      // Transform database results to SearchResult format
      const results: SearchResult[] = rpcResults.map((row: {
        id: string
        type: string
        text: string
        secondary_text: string | null
        context_id: string | null
        created_at: string
        rank: number
      }) => ({
        id: row.id,
        type: row.type as SearchResultType,
        text: row.text,
        secondaryText: row.secondary_text,
        contextId: row.context_id,
        createdAt: row.created_at,
        rank: row.rank,
      }))

      return NextResponse.json({
        results,
        total: results.length,
        query: query.trim(),
      })
    }

    // Fallback to basic ILIKE search if RPC function doesn't exist
    const searchPattern = `%${query.trim()}%`
    const results: SearchResult[] = []

    // Search thoughts
    if (!filterType || filterType === 'thought') {
      const { data: thoughts } = await supabase
        .from("gems")
        .select("id, content, source, context_id, created_at")
        .eq("user_id", user.id)
        .neq("status", "retired")
        .or(`content.ilike.${searchPattern},source.ilike.${searchPattern}`)
        .limit(limit)

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

    // Search notes
    if (!filterType || filterType === 'note') {
      const { data: notes } = await supabase
        .from("notes")
        .select("id, title, content, created_at")
        .eq("user_id", user.id)
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

    // Search sources
    if (!filterType || filterType === 'source') {
      const { data: sources } = await supabase
        .from("sources")
        .select("id, name, author, created_at")
        .eq("user_id", user.id)
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

    // Sort and limit results
    const sortedResults = results
      .sort((a, b) => a.rank - b.rank)
      .slice(offset, offset + limit)

    return NextResponse.json({
      results: sortedResults,
      total: sortedResults.length,
      query: query.trim(),
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
