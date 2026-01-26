import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  CONTEXT_NAME_MAX_LENGTH,
  CONTEXT_THOUGHT_LIMIT_MIN,
  CONTEXT_THOUGHT_LIMIT_MAX,
} from "@/lib/types/context"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contexts/[id]
 * Get a single context by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get context
    const { data: context, error } = await supabase
      .from("contexts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Context not found" }, { status: 404 })
      }
      console.error("Context fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch context" },
        { status: 500 }
      )
    }

    // Get thought count for this context
    // Only count active and passive thoughts (not retired/graduated)
    const { count } = await supabase
      .from("gems")
      .select("*", { count: "exact", head: true })
      .eq("context_id", id)
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])

    return NextResponse.json({
      context: {
        ...context,
        thought_count: count || 0,
      },
    })
  } catch (error) {
    console.error("Context API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contexts/[id]
 * Update a context
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, color, icon, thought_limit, sort_order } = body as {
      name?: string
      color?: string
      icon?: string
      thought_limit?: number
      sort_order?: number
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
        return NextResponse.json({ error: "Context not found" }, { status: 404 })
      }
      console.error("Context fetch error:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch context" },
        { status: 500 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Validate and set name if provided
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
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

      // Check for unique name (excluding current context)
      const { data: duplicate, error: checkError } = await supabase
        .from("contexts")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", trimmedName)
        .neq("id", id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Name check error:", checkError)
        return NextResponse.json(
          { error: "Failed to check name uniqueness" },
          { status: 500 }
        )
      }

      if (duplicate) {
        return NextResponse.json(
          { error: "A context with this name already exists" },
          { status: 409 }
        )
      }

      updateData.name = trimmedName

      // Update slug if not a default context
      if (!existing.is_default) {
        let slug = trimmedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

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
    if (color !== undefined) {
      updateData.color = color
    }

    // Set icon if provided
    if (icon !== undefined) {
      updateData.icon = icon
    }

    // Validate and set thought limit if provided
    if (thought_limit !== undefined) {
      if (
        thought_limit < CONTEXT_THOUGHT_LIMIT_MIN ||
        thought_limit > CONTEXT_THOUGHT_LIMIT_MAX
      ) {
        return NextResponse.json(
          {
            error: `Thought limit must be between ${CONTEXT_THOUGHT_LIMIT_MIN} and ${CONTEXT_THOUGHT_LIMIT_MAX}`,
          },
          { status: 400 }
        )
      }
      updateData.thought_limit = thought_limit
    }

    // Set sort order if provided
    if (sort_order !== undefined) {
      updateData.sort_order = sort_order
    }

    // Update context
    const { data: context, error: updateError } = await supabase
      .from("contexts")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Context update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update context" },
        { status: 500 }
      )
    }

    return NextResponse.json({ context })
  } catch (error) {
    console.error("Context API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contexts/[id]
 * Delete a custom context (moves thoughts to "Other")
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get the context to check if it's a default
    const { data: context, error: fetchError } = await supabase
      .from("contexts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Context not found" }, { status: 404 })
      }
      console.error("Context fetch error:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch context" },
        { status: 500 }
      )
    }

    // Check if it's a default context
    if (context.is_default) {
      return NextResponse.json(
        { error: "Cannot delete default contexts" },
        { status: 403 }
      )
    }

    // Find the "Other" context
    const { data: otherContext, error: otherError } = await supabase
      .from("contexts")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", "other")
      .single()

    if (otherError) {
      console.error("Other context fetch error:", otherError)
      return NextResponse.json(
        { error: "Could not find 'Other' context for reassignment" },
        { status: 500 }
      )
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
      console.error("Thought move error:", moveError)
      return NextResponse.json(
        { error: "Failed to reassign thoughts" },
        { status: 500 }
      )
    }

    // Delete the context
    const { error: deleteError } = await supabase
      .from("contexts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Context delete error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete context" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Context API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
