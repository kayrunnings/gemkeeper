// Source-Context linking service (Epic 13)
// Manages many-to-many relationships between sources and contexts

import { createClient } from "@/lib/supabase/client"
import { Context } from "@/lib/types/context"

interface SourceContext {
  id: string
  source_id: string
  context_id: string
  is_primary: boolean
  created_at: string
}

/**
 * Link a context to a source
 */
export async function linkContextToSource(
  sourceId: string,
  contextId: string,
  isPrimary: boolean = false
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // If setting as primary, unset any existing primary
  if (isPrimary) {
    await supabase
      .from("source_contexts")
      .update({ is_primary: false })
      .eq("source_id", sourceId)
      .eq("is_primary", true)
  }

  const { error } = await supabase
    .from("source_contexts")
    .upsert({
      source_id: sourceId,
      context_id: contextId,
      is_primary: isPrimary,
    }, {
      onConflict: "source_id,context_id",
    })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Unlink a context from a source
 */
export async function unlinkContextFromSource(
  sourceId: string,
  contextId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("source_contexts")
    .delete()
    .eq("source_id", sourceId)
    .eq("context_id", contextId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Get all contexts linked to a source
 */
export async function getSourceContexts(
  sourceId: string
): Promise<{ data: Array<Context & { is_primary: boolean }>; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get context links
  const { data: links, error: linksError } = await supabase
    .from("source_contexts")
    .select("context_id, is_primary")
    .eq("source_id", sourceId)

  if (linksError) {
    return { data: [], error: linksError.message }
  }

  if (!links || links.length === 0) {
    return { data: [], error: null }
  }

  // Get the actual contexts
  const contextIds = links.map((l) => l.context_id)
  const { data: contexts, error: contextsError } = await supabase
    .from("contexts")
    .select("*")
    .in("id", contextIds)
    .eq("user_id", user.id)

  if (contextsError) {
    return { data: [], error: contextsError.message }
  }

  // Merge is_primary into contexts
  const primaryMap = new Map(links.map((l) => [l.context_id, l.is_primary]))
  const result = (contexts || []).map((c) => ({
    ...c,
    is_primary: primaryMap.get(c.id) || false,
  }))

  return { data: result, error: null }
}

/**
 * Get primary context for a source
 */
export async function getSourcePrimaryContext(
  sourceId: string
): Promise<{ data: Context | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  // Get primary context link
  const { data: link, error: linkError } = await supabase
    .from("source_contexts")
    .select("context_id")
    .eq("source_id", sourceId)
    .eq("is_primary", true)
    .maybeSingle()

  if (linkError) {
    return { data: null, error: linkError.message }
  }

  if (!link) {
    return { data: null, error: null }
  }

  // Get the context
  const { data: context, error: contextError } = await supabase
    .from("contexts")
    .select("*")
    .eq("id", link.context_id)
    .eq("user_id", user.id)
    .single()

  if (contextError) {
    return { data: null, error: contextError.message }
  }

  return { data: context, error: null }
}

/**
 * Set all contexts for a source (replaces existing links)
 */
export async function setSourceContexts(
  sourceId: string,
  contextIds: string[],
  primaryContextId?: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Delete existing links
  const { error: deleteError } = await supabase
    .from("source_contexts")
    .delete()
    .eq("source_id", sourceId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Insert new links
  if (contextIds.length > 0) {
    const { error: insertError } = await supabase
      .from("source_contexts")
      .insert(
        contextIds.map((contextId) => ({
          source_id: sourceId,
          context_id: contextId,
          is_primary: contextId === primaryContextId,
        }))
      )

    if (insertError) {
      return { error: insertError.message }
    }
  }

  return { error: null }
}

/**
 * Get all sources linked to a context
 */
export async function getContextSources(
  contextId: string
): Promise<{
  data: Array<{ id: string; name: string; type: string; is_primary: boolean }>
  error: string | null
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get source links
  const { data: links, error: linksError } = await supabase
    .from("source_contexts")
    .select("source_id, is_primary")
    .eq("context_id", contextId)

  if (linksError) {
    return { data: [], error: linksError.message }
  }

  if (!links || links.length === 0) {
    return { data: [], error: null }
  }

  // Get the actual sources
  const sourceIds = links.map((l) => l.source_id)
  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, name, type")
    .in("id", sourceIds)
    .eq("user_id", user.id)

  if (sourcesError) {
    return { data: [], error: sourcesError.message }
  }

  // Merge is_primary into sources
  const primaryMap = new Map(links.map((l) => [l.source_id, l.is_primary]))
  const result = (sources || []).map((s) => ({
    ...s,
    is_primary: primaryMap.get(s.id) || false,
  }))

  return { data: result, error: null }
}

/**
 * Set primary context for a source
 */
export async function setSourcePrimaryContext(
  sourceId: string,
  contextId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // First, unset any existing primary
  const { error: unsetError } = await supabase
    .from("source_contexts")
    .update({ is_primary: false })
    .eq("source_id", sourceId)

  if (unsetError) {
    return { error: unsetError.message }
  }

  // Set the new primary
  const { error: setError } = await supabase
    .from("source_contexts")
    .update({ is_primary: true })
    .eq("source_id", sourceId)
    .eq("context_id", contextId)

  if (setError) {
    return { error: setError.message }
  }

  return { error: null }
}
