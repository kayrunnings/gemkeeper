import { createClient } from "@/lib/supabase/client"
import type {
  Context,
  ContextWithCount,
  CreateContextInput,
  UpdateContextInput,
} from "@/lib/types/context"
import {
  CONTEXT_NAME_MAX_LENGTH,
  CONTEXT_THOUGHT_LIMIT_MIN,
  CONTEXT_THOUGHT_LIMIT_MAX,
  CONTEXT_THOUGHT_LIMIT_DEFAULT,
  DEFAULT_CONTEXT_SLUGS,
} from "@/lib/types/context"

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Get all contexts for the current user with thought counts
 */
export async function getContexts(): Promise<{
  contexts: ContextWithCount[]
  error: string | null
}> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { contexts: [], error: "Not authenticated" }
  }

  // Get contexts
  const { data: contexts, error: contextsError } = await supabase
    .from("contexts")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })

  if (contextsError) {
    return { contexts: [], error: contextsError.message }
  }

  // Get thought counts per context
  // Only count active and passive thoughts (not retired/graduated)
  // We need to count both by context_id AND by context_tag (legacy field)
  const { data: counts, error: countsError } = await supabase
    .from("gems")
    .select("context_id, context_tag")
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])

  if (countsError) {
    return { contexts: [], error: countsError.message }
  }

  // Build a slug-to-id map for matching context_tag to context_id
  const slugToIdMap = new Map<string, string>()
  for (const context of contexts || []) {
    slugToIdMap.set(context.slug, context.id)
  }

  // Count thoughts per context
  // Priority: context_id > context_tag (match via slug)
  const countMap = new Map<string, number>()
  for (const row of counts || []) {
    let contextId = row.context_id as string | null

    // If no context_id but has context_tag, try to match via slug
    if (!contextId && row.context_tag) {
      contextId = slugToIdMap.get(row.context_tag) || null
    }

    if (contextId) {
      countMap.set(contextId, (countMap.get(contextId) || 0) + 1)
    }
  }

  // Merge counts with contexts
  const contextsWithCounts: ContextWithCount[] = (contexts || []).map(
    (context) => ({
      ...context,
      thought_count: countMap.get(context.id) || 0,
    })
  )

  return { contexts: contextsWithCounts, error: null }
}

/**
 * Get a single context by slug
 */
export async function getContextBySlug(
  slug: string
): Promise<{ context: Context | null; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { context: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("contexts")
    .select("*")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { context: null, error: "Context not found" }
    }
    return { context: null, error: error.message }
  }

  return { context: data, error: null }
}

/**
 * Get a single context by ID
 */
export async function getContextById(
  id: string
): Promise<{ context: Context | null; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { context: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("contexts")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { context: null, error: "Context not found" }
    }
    return { context: null, error: error.message }
  }

  return { context: data, error: null }
}

/**
 * Create a new custom context
 */
export async function createContext(
  input: CreateContextInput
): Promise<{ context: Context | null; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { context: null, error: "Not authenticated" }
  }

  // Validate name length
  if (!input.name || input.name.trim().length === 0) {
    return { context: null, error: "Context name is required" }
  }

  const trimmedName = input.name.trim()
  if (trimmedName.length > CONTEXT_NAME_MAX_LENGTH) {
    return {
      context: null,
      error: `Context name must be ${CONTEXT_NAME_MAX_LENGTH} characters or less`,
    }
  }

  // Validate thought limit
  const thoughtLimit = input.thought_limit ?? CONTEXT_THOUGHT_LIMIT_DEFAULT
  if (
    thoughtLimit < CONTEXT_THOUGHT_LIMIT_MIN ||
    thoughtLimit > CONTEXT_THOUGHT_LIMIT_MAX
  ) {
    return {
      context: null,
      error: `Thought limit must be between ${CONTEXT_THOUGHT_LIMIT_MIN} and ${CONTEXT_THOUGHT_LIMIT_MAX}`,
    }
  }

  // Check for unique name
  const { data: existing, error: checkError } = await supabase
    .from("contexts")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", trimmedName)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    return { context: null, error: checkError.message }
  }

  if (existing) {
    return { context: null, error: "A context with this name already exists" }
  }

  // Get max sort_order for new context
  const { data: maxOrder } = await supabase
    .from("contexts")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const newSortOrder = (maxOrder?.sort_order || 0) + 1

  // Generate slug
  let slug = generateSlug(trimmedName)

  // Ensure slug is unique
  let slugSuffix = 0
  let uniqueSlug = slug
  while (true) {
    const { data: slugCheck } = await supabase
      .from("contexts")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", uniqueSlug)
      .single()

    if (!slugCheck) break
    slugSuffix++
    uniqueSlug = `${slug}-${slugSuffix}`
  }

  // Create context
  const { data, error } = await supabase
    .from("contexts")
    .insert({
      user_id: user.id,
      name: trimmedName,
      slug: uniqueSlug,
      color: input.color || null,
      icon: input.icon || null,
      is_default: false,
      thought_limit: thoughtLimit,
      sort_order: newSortOrder,
    })
    .select()
    .single()

  if (error) {
    return { context: null, error: error.message }
  }

  return { context: data, error: null }
}

/**
 * Update an existing context
 */
export async function updateContext(
  id: string,
  input: UpdateContextInput
): Promise<{ context: Context | null; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { context: null, error: "Not authenticated" }
  }

  // Get existing context
  const { data: existing, error: fetchError } = await supabase
    .from("contexts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return { context: null, error: "Context not found" }
    }
    return { context: null, error: fetchError.message }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Validate and set name if provided
  if (input.name !== undefined) {
    const trimmedName = input.name.trim()
    if (trimmedName.length === 0) {
      return { context: null, error: "Context name is required" }
    }
    if (trimmedName.length > CONTEXT_NAME_MAX_LENGTH) {
      return {
        context: null,
        error: `Context name must be ${CONTEXT_NAME_MAX_LENGTH} characters or less`,
      }
    }

    // Check for unique name (excluding current context)
    const { data: duplicate, error: checkError } = await supabase
      .from("contexts")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", trimmedName)
      .neq("id", id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return { context: null, error: checkError.message }
    }

    if (duplicate) {
      return { context: null, error: "A context with this name already exists" }
    }

    updateData.name = trimmedName

    // Update slug if not a default context
    if (!existing.is_default) {
      let slug = generateSlug(trimmedName)
      let slugSuffix = 0
      let uniqueSlug = slug

      while (true) {
        const { data: slugCheck } = await supabase
          .from("contexts")
          .select("id")
          .eq("user_id", user.id)
          .eq("slug", uniqueSlug)
          .neq("id", id)
          .single()

        if (!slugCheck) break
        slugSuffix++
        uniqueSlug = `${slug}-${slugSuffix}`
      }

      updateData.slug = uniqueSlug
    }
  }

  // Set color if provided
  if (input.color !== undefined) {
    updateData.color = input.color
  }

  // Set icon if provided
  if (input.icon !== undefined) {
    updateData.icon = input.icon
  }

  // Validate and set thought limit if provided
  if (input.thought_limit !== undefined) {
    if (
      input.thought_limit < CONTEXT_THOUGHT_LIMIT_MIN ||
      input.thought_limit > CONTEXT_THOUGHT_LIMIT_MAX
    ) {
      return {
        context: null,
        error: `Thought limit must be between ${CONTEXT_THOUGHT_LIMIT_MIN} and ${CONTEXT_THOUGHT_LIMIT_MAX}`,
      }
    }
    updateData.thought_limit = input.thought_limit
  }

  // Set sort order if provided
  if (input.sort_order !== undefined) {
    updateData.sort_order = input.sort_order
  }

  const { data, error } = await supabase
    .from("contexts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { context: null, error: error.message }
  }

  return { context: data, error: null }
}

/**
 * Delete a custom context (moves thoughts to "Other")
 */
export async function deleteContext(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get the context to check if it's a default
  const { data: context, error: fetchError } = await supabase
    .from("contexts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return { error: "Context not found" }
    }
    return { error: fetchError.message }
  }

  // Check if it's a default context
  if (context.is_default) {
    return { error: "Cannot delete default contexts" }
  }

  // Find the "Other" context
  const { data: otherContext, error: otherError } = await supabase
    .from("contexts")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", "other")
    .single()

  if (otherError) {
    return { error: "Could not find 'Other' context for reassignment" }
  }

  // Move thoughts to "Other" context
  const { error: moveError } = await supabase
    .from("gems")
    .update({
      context_id: otherContext.id,
      updated_at: new Date().toISOString(),
    })
    .eq("context_id", id)
    .eq("user_id", user.id)

  if (moveError) {
    return { error: moveError.message }
  }

  // Delete the context
  const { error: deleteError } = await supabase
    .from("contexts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  return { error: null }
}

/**
 * Get the thought count for a specific context
 */
export async function getContextThoughtCount(
  contextId: string
): Promise<{ count: number; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0, error: "Not authenticated" }
  }

  // Only count active and passive thoughts (not retired/graduated)
  const { count, error } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("context_id", contextId)
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}

/**
 * Check if a context is at its thought limit
 */
export async function isContextAtLimit(
  contextId: string
): Promise<{ atLimit: boolean; count: number; limit: number; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { atLimit: false, count: 0, limit: 0, error: "Not authenticated" }
  }

  // Get context's thought limit
  const { data: context, error: contextError } = await supabase
    .from("contexts")
    .select("thought_limit")
    .eq("id", contextId)
    .eq("user_id", user.id)
    .single()

  if (contextError) {
    return { atLimit: false, count: 0, limit: 0, error: contextError.message }
  }

  // Get current count - only count active and passive thoughts (not retired/graduated)
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("context_id", contextId)
    .eq("user_id", user.id)
    .in("status", ["active", "passive"])

  if (countError) {
    return { atLimit: false, count: 0, limit: 0, error: countError.message }
  }

  const currentCount = count || 0
  const limit = context.thought_limit

  return {
    atLimit: currentCount >= limit,
    count: currentCount,
    limit,
    error: null,
  }
}

/**
 * Get the "Other" context ID for the current user
 * Useful for fallback/default assignments
 */
export async function getOtherContextId(): Promise<{
  contextId: string | null
  error: string | null
}> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { contextId: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("contexts")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", "other")
    .single()

  if (error) {
    return { contextId: null, error: error.message }
  }

  return { contextId: data.id, error: null }
}
