import { createClient } from "@/lib/supabase/client"
import { Source, CreateSourceInput, UpdateSourceInput, SourceStatus } from "@/lib/types/source"

/**
 * Create a new source
 */
export async function createSource(
  input: CreateSourceInput
): Promise<{ data: Source | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("sources")
    .insert({
      user_id: user.id,
      name: input.name,
      author: input.author || null,
      type: input.type || 'other',
      url: input.url || null,
      isbn: input.isbn || null,
      cover_image_url: input.cover_image_url || null,
      metadata: input.metadata || {},
      status: input.status || 'reading',
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Get a single source by ID
 */
export async function getSource(
  id: string
): Promise<{ data: Source | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: "Source not found" }
    }
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Get all sources for the current user
 */
export async function getSources(): Promise<{ data: Source[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Get a source by URL (for deduplication)
 */
export async function getSourceByUrl(
  url: string
): Promise<{ data: Source | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .eq("url", url)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Update a source
 */
export async function updateSource(
  id: string,
  input: UpdateSourceInput
): Promise<{ data: Source | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("sources")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: "Source not found" }
    }
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Delete a source
 */
export async function deleteSource(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("sources")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Update source status
 */
export async function updateSourceStatus(
  id: string,
  status: SourceStatus
): Promise<{ data: Source | null; error: string | null }> {
  return updateSource(id, { status })
}

/**
 * Get source with linked thoughts count
 */
export async function getSourceWithStats(
  id: string
): Promise<{ data: (Source & { thoughts_count: number }) | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  // Get source
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (sourceError) {
    if (sourceError.code === "PGRST116") {
      return { data: null, error: "Source not found" }
    }
    return { data: null, error: sourceError.message }
  }

  // Get thoughts count
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("source_id", id)
    .eq("user_id", user.id)

  if (countError) {
    return { data: null, error: countError.message }
  }

  return {
    data: { ...source, thoughts_count: count || 0 },
    error: null,
  }
}

/**
 * Search sources by name
 */
export async function searchSources(
  query: string,
  limit: number = 10
): Promise<{ data: Source[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .or(`name.ilike.%${query}%,author.ilike.%${query}%`)
    .order("name")
    .limit(limit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Get or create a source by name (for quick source creation)
 */
export async function getOrCreateSource(
  name: string,
  type: "book" | "article" | "podcast" | "video" | "course" | "other" = "other"
): Promise<{ data: Source | null; error: string | null; created: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated", created: false }
  }

  // Try to find existing source with exact name match
  const { data: existing, error: findError } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .ilike("name", name)
    .maybeSingle()

  if (findError) {
    return { data: null, error: findError.message, created: false }
  }

  if (existing) {
    return { data: existing, error: null, created: false }
  }

  // Create new source
  const { data: newSource, error: createError } = await supabase
    .from("sources")
    .insert({
      user_id: user.id,
      name,
      type,
      status: 'reading',
    })
    .select()
    .single()

  if (createError) {
    return { data: null, error: createError.message, created: false }
  }

  return { data: newSource, error: null, created: true }
}
