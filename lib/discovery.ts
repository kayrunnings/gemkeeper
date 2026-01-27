import { createClient } from "@/lib/supabase/server"
import { createHash } from "crypto"
import type {
  Discovery,
  DiscoveryUsage,
  ContextWeight,
  DiscoverySessionType,
  DiscoveryStatus,
  GeneratedDiscovery,
} from "@/lib/types/discovery"
import {
  DAILY_CURATED_LIMIT,
  DAILY_DIRECTED_LIMIT,
} from "@/lib/types/discovery"
import type { Context } from "@/lib/types/context"

/**
 * Hash a URL for deduplication tracking
 */
export function hashUrl(url: string): string {
  return createHash("sha256").update(url.toLowerCase().trim()).digest("hex")
}

/**
 * Get the start of today (UTC)
 */
function getStartOfDay(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split("T")[0]
}

/**
 * Get the discovery usage for today
 */
export async function getDiscoveryUsage(userId: string): Promise<{
  usage: DiscoveryUsage
  error: string | null
}> {
  const supabase = await createClient()
  const today = getStartOfDay()

  const { data, error } = await supabase
    .from("discovery_usage")
    .select("curated_count, directed_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .single()

  if (error && error.code !== "PGRST116") {
    return {
      usage: {
        curated_used: false,
        directed_used: false,
        curated_remaining: DAILY_CURATED_LIMIT,
        directed_remaining: DAILY_DIRECTED_LIMIT,
      },
      error: error.message,
    }
  }

  const curatedCount = data?.curated_count || 0
  const directedCount = data?.directed_count || 0

  return {
    usage: {
      curated_used: curatedCount >= DAILY_CURATED_LIMIT,
      directed_used: directedCount >= DAILY_DIRECTED_LIMIT,
      curated_remaining: Math.max(0, DAILY_CURATED_LIMIT - curatedCount),
      directed_remaining: Math.max(0, DAILY_DIRECTED_LIMIT - directedCount),
    },
    error: null,
  }
}

/**
 * Get context weights for curated discovery
 * Weights are based on thought count - contexts with more thoughts get higher weight
 */
export async function getContextWeights(userId: string): Promise<{
  weights: ContextWeight[]
  error: string | null
}> {
  const supabase = await createClient()

  // Get all contexts with their thought counts
  const { data: contexts, error: contextError } = await supabase
    .from("contexts")
    .select("id, name, slug")
    .eq("user_id", userId)

  if (contextError) {
    return { weights: [], error: contextError.message }
  }

  if (!contexts || contexts.length === 0) {
    return { weights: [], error: null }
  }

  // Get thought counts per context
  const { data: thoughts, error: thoughtError } = await supabase
    .from("gems")
    .select("context_id")
    .eq("user_id", userId)
    .in("status", ["active", "passive"])

  if (thoughtError) {
    return { weights: [], error: thoughtError.message }
  }

  // Count thoughts per context
  const countMap = new Map<string, number>()
  for (const thought of thoughts || []) {
    if (thought.context_id) {
      countMap.set(thought.context_id, (countMap.get(thought.context_id) || 0) + 1)
    }
  }

  // Calculate total for weighting
  const totalThoughts = Array.from(countMap.values()).reduce((a, b) => a + b, 0)

  // Build weighted list (only include contexts with thoughts)
  const weights: ContextWeight[] = contexts
    .filter((ctx) => (countMap.get(ctx.id) || 0) > 0)
    .map((ctx) => {
      const thoughtCount = countMap.get(ctx.id) || 0
      return {
        context_id: ctx.id,
        context_name: ctx.name,
        thought_count: thoughtCount,
        weight: totalThoughts > 0 ? thoughtCount / totalThoughts : 0,
      }
    })
    .sort((a, b) => b.weight - a.weight)

  return { weights, error: null }
}

/**
 * Check if content (by URL) was previously skipped
 */
export async function checkContentSkipped(
  userId: string,
  url: string
): Promise<{ skipped: boolean; error: string | null }> {
  const supabase = await createClient()
  const urlHash = hashUrl(url)

  const { data, error } = await supabase
    .from("discovery_skips")
    .select("id")
    .eq("user_id", userId)
    .eq("content_hash", urlHash)
    .single()

  if (error && error.code !== "PGRST116") {
    return { skipped: false, error: error.message }
  }

  return { skipped: !!data, error: null }
}

/**
 * Create discoveries in the database
 */
export async function createDiscoveries(
  userId: string,
  sessionType: DiscoverySessionType,
  query: string | null,
  contextId: string | null,
  discoveries: GeneratedDiscovery[],
  contexts: Context[]
): Promise<{ discoveries: Discovery[]; error: string | null }> {
  const supabase = await createClient()

  // Build a slug-to-context map for matching suggested context
  const slugToContext = new Map<string, Context>()
  for (const ctx of contexts) {
    slugToContext.set(ctx.slug, ctx)
  }

  // Prepare discoveries for insertion
  const discoveriesToInsert = discoveries.map((d) => {
    // Find the suggested context by slug
    const suggestedContext = slugToContext.get(d.suggested_context_slug)

    return {
      user_id: userId,
      session_type: sessionType,
      query: query,
      context_id: contextId,
      thought_content: d.thought_content,
      source_title: d.source_title,
      source_url: d.source_url,
      source_type: d.source_type,
      article_summary: d.article_summary,
      relevance_reason: d.relevance_reason,
      content_type: d.content_type,
      suggested_context_id: suggestedContext?.id || null,
      status: "pending" as DiscoveryStatus,
      saved_gem_id: null,
    }
  })

  const { data, error } = await supabase
    .from("discoveries")
    .insert(discoveriesToInsert)
    .select()

  if (error) {
    return { discoveries: [], error: error.message }
  }

  // Add suggested context names to the results
  const discoveriesWithNames: Discovery[] = (data || []).map((d) => {
    const suggestedContext = contexts.find((c) => c.id === d.suggested_context_id)
    return {
      ...d,
      suggested_context_name: suggestedContext?.name,
    }
  })

  return { discoveries: discoveriesWithNames, error: null }
}

/**
 * Update the status of a discovery
 */
export async function updateDiscoveryStatus(
  discoveryId: string,
  userId: string,
  status: DiscoveryStatus,
  savedGemId?: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (savedGemId) {
    updateData.saved_gem_id = savedGemId
  }

  const { error } = await supabase
    .from("discoveries")
    .update(updateData)
    .eq("id", discoveryId)
    .eq("user_id", userId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Add a URL to the skip list
 */
export async function addSkippedContent(
  userId: string,
  url: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const urlHash = hashUrl(url)

  const { error } = await supabase.from("discovery_skips").insert({
    user_id: userId,
    content_hash: urlHash,
    source_url: url,
    skipped_at: new Date().toISOString(),
  })

  if (error) {
    // Ignore duplicate key errors (already skipped)
    if (error.code === "23505") {
      return { error: null }
    }
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Increment usage counter for the session type
 */
export async function incrementUsage(
  userId: string,
  sessionType: DiscoverySessionType
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const today = getStartOfDay()

  // Try to get existing record
  const { data: existing } = await supabase
    .from("discovery_usage")
    .select("id, curated_count, directed_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .single()

  if (existing) {
    // Update existing record
    const updateData: Record<string, unknown> = {}
    if (sessionType === "curated") {
      updateData.curated_count = existing.curated_count + 1
    } else {
      updateData.directed_count = existing.directed_count + 1
    }

    const { error } = await supabase
      .from("discovery_usage")
      .update(updateData)
      .eq("id", existing.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Insert new record
    const { error } = await supabase.from("discovery_usage").insert({
      user_id: userId,
      usage_date: today,
      curated_count: sessionType === "curated" ? 1 : 0,
      directed_count: sessionType === "directed" ? 1 : 0,
    })

    if (error) {
      return { error: error.message }
    }
  }

  return { error: null }
}

/**
 * Get a discovery by ID
 */
export async function getDiscoveryById(
  discoveryId: string,
  userId: string
): Promise<{ discovery: Discovery | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("discoveries")
    .select("*")
    .eq("id", discoveryId)
    .eq("user_id", userId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { discovery: null, error: "Discovery not found" }
    }
    return { discovery: null, error: error.message }
  }

  return { discovery: data, error: null }
}

/**
 * Get user's thoughts for a specific context (for AI context)
 */
export async function getThoughtsForContext(
  userId: string,
  contextId: string,
  limit: number = 10
): Promise<{ thoughts: string[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("gems")
    .select("content")
    .eq("user_id", userId)
    .eq("context_id", contextId)
    .in("status", ["active", "passive"])
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { thoughts: [], error: error.message }
  }

  return {
    thoughts: (data || []).map((t) => t.content),
    error: null,
  }
}

/**
 * Get sample thoughts across contexts for AI context
 */
export async function getSampleThoughts(
  userId: string,
  limit: number = 20
): Promise<{ thoughts: Array<{ content: string; context_name?: string }>; error: string | null }> {
  const supabase = await createClient()

  // Get thoughts with their contexts
  const { data, error } = await supabase
    .from("gems")
    .select(`
      content,
      contexts:context_id (name)
    `)
    .eq("user_id", userId)
    .in("status", ["active", "passive"])
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { thoughts: [], error: error.message }
  }

  return {
    thoughts: (data || []).map((t) => {
      // Handle the join result - could be object, array, or null
      const contextData = t.contexts as { name: string } | { name: string }[] | null
      let contextName: string | undefined
      if (contextData) {
        if (Array.isArray(contextData)) {
          contextName = contextData[0]?.name
        } else {
          contextName = contextData.name
        }
      }
      return {
        content: t.content,
        context_name: contextName,
      }
    }),
    error: null,
  }
}

/**
 * Get user's total thought and context counts for bootstrap check
 */
export async function getBootstrapStatus(userId: string): Promise<{
  contextCount: number
  thoughtCount: number
  error: string | null
}> {
  const supabase = await createClient()

  // Get context count
  const { count: contextCount, error: contextError } = await supabase
    .from("contexts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (contextError) {
    return { contextCount: 0, thoughtCount: 0, error: contextError.message }
  }

  // Get thought count (only active/passive)
  const { count: thoughtCount, error: thoughtError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["active", "passive"])

  if (thoughtError) {
    return { contextCount: 0, thoughtCount: 0, error: thoughtError.message }
  }

  return {
    contextCount: contextCount || 0,
    thoughtCount: thoughtCount || 0,
    error: null,
  }
}

/**
 * Save a discovery for later (adds to reading list)
 */
export async function saveDiscoveryForLater(
  discoveryId: string,
  userId: string
): Promise<{ discovery: Discovery | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("discoveries")
    .update({
      saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", discoveryId)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    return { discovery: null, error: error.message }
  }

  return { discovery: data, error: null }
}

/**
 * Unsave a discovery (removes from reading list)
 */
export async function unsaveDiscovery(
  discoveryId: string,
  userId: string
): Promise<{ discovery: Discovery | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("discoveries")
    .update({
      saved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", discoveryId)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    return { discovery: null, error: error.message }
  }

  return { discovery: data, error: null }
}

/**
 * Get all saved discoveries for user (reading list)
 */
export async function getSavedDiscoveries(userId: string): Promise<{
  discoveries: Discovery[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("discoveries")
    .select(`
      *,
      contexts:suggested_context_id (name)
    `)
    .eq("user_id", userId)
    .not("saved_at", "is", null)
    .order("saved_at", { ascending: false })

  if (error) {
    return { discoveries: [], error: error.message }
  }

  // Add context names to discoveries
  const discoveriesWithNames = (data || []).map((d) => {
    const contextData = d.contexts as { name: string } | null
    return {
      ...d,
      suggested_context_name: contextData?.name,
      contexts: undefined,
    } as Discovery
  })

  return { discoveries: discoveriesWithNames, error: null }
}

/**
 * Get count of saved discoveries
 */
export async function getSavedDiscoveriesCount(userId: string): Promise<{
  count: number
  error: string | null
}> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("discoveries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("saved_at", "is", null)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}
