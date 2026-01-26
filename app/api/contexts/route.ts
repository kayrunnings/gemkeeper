import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  CONTEXT_NAME_MAX_LENGTH,
  CONTEXT_THOUGHT_LIMIT_MIN,
  CONTEXT_THOUGHT_LIMIT_MAX,
  CONTEXT_THOUGHT_LIMIT_DEFAULT,
} from "@/lib/types/context"

/**
 * GET /api/contexts
 * Get all contexts for the current user with thought counts
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get contexts
    const { data: contexts, error: contextsError } = await supabase
      .from("contexts")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })

    if (contextsError) {
      console.error("Contexts fetch error:", contextsError)
      return NextResponse.json(
        { error: "Failed to fetch contexts" },
        { status: 500 }
      )
    }

    // Get thought counts per context
    // Only count active and passive thoughts (not retired/graduated)
    const { data: counts, error: countsError } = await supabase
      .from("gems")
      .select("context_id")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])
      .not("context_id", "is", null)

    if (countsError) {
      console.error("Thought counts error:", countsError)
      // Return contexts without counts
      return NextResponse.json({
        contexts: (contexts || []).map((ctx) => ({
          ...ctx,
          thought_count: 0,
        })),
      })
    }

    // Count thoughts per context
    const countMap = new Map<string, number>()
    for (const row of counts || []) {
      const contextId = row.context_id as string
      countMap.set(contextId, (countMap.get(contextId) || 0) + 1)
    }

    // Merge counts with contexts
    const contextsWithCounts = (contexts || []).map((context) => ({
      ...context,
      thought_count: countMap.get(context.id) || 0,
    }))

    return NextResponse.json({ contexts: contextsWithCounts })
  } catch (error) {
    console.error("Contexts API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contexts
 * Create a new custom context
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, color, icon, thought_limit } = body as {
      name?: string
      color?: string
      icon?: string
      thought_limit?: number
    }

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Context name is required" },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    if (trimmedName.length > CONTEXT_NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          error: `Context name must be ${CONTEXT_NAME_MAX_LENGTH} characters or less`,
        },
        { status: 400 }
      )
    }

    // Validate thought limit
    const limit = thought_limit ?? CONTEXT_THOUGHT_LIMIT_DEFAULT
    if (limit < CONTEXT_THOUGHT_LIMIT_MIN || limit > CONTEXT_THOUGHT_LIMIT_MAX) {
      return NextResponse.json(
        {
          error: `Thought limit must be between ${CONTEXT_THOUGHT_LIMIT_MIN} and ${CONTEXT_THOUGHT_LIMIT_MAX}`,
        },
        { status: 400 }
      )
    }

    // Check for unique name
    const { data: existing, error: checkError } = await supabase
      .from("contexts")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", trimmedName)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Name check error:", checkError)
      return NextResponse.json(
        { error: "Failed to check name uniqueness" },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { error: "A context with this name already exists" },
        { status: 409 }
      )
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from("contexts")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    const newSortOrder = (maxOrder?.sort_order || 0) + 1

    // Generate slug
    let slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

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
    const { data: context, error: createError } = await supabase
      .from("contexts")
      .insert({
        user_id: user.id,
        name: trimmedName,
        slug: uniqueSlug,
        color: color || null,
        icon: icon || null,
        is_default: false,
        thought_limit: limit,
        sort_order: newSortOrder,
      })
      .select()
      .single()

    if (createError) {
      console.error("Context creation error:", createError)
      return NextResponse.json(
        { error: "Failed to create context" },
        { status: 500 }
      )
    }

    return NextResponse.json({ context }, { status: 201 })
  } catch (error) {
    console.error("Contexts API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
