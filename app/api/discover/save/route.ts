import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDiscoveryById, updateDiscoveryStatus } from "@/lib/discovery"
import type { SaveDiscoveryInput } from "@/lib/types/discovery"

/**
 * POST /api/discover/save
 * Save a discovery as a thought
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
    const {
      discovery_id,
      thought_content,
      context_id,
      is_on_active_list,
    } = body as SaveDiscoveryInput

    // Validate required fields
    if (!discovery_id) {
      return NextResponse.json(
        { error: "Discovery ID is required" },
        { status: 400 }
      )
    }

    if (!thought_content || thought_content.trim().length === 0) {
      return NextResponse.json(
        { error: "Thought content is required" },
        { status: 400 }
      )
    }

    if (thought_content.length > 200) {
      return NextResponse.json(
        { error: "Thought content must be 200 characters or less" },
        { status: 400 }
      )
    }

    if (!context_id) {
      return NextResponse.json(
        { error: "Context ID is required" },
        { status: 400 }
      )
    }

    // Verify discovery exists and belongs to user
    const { discovery, error: fetchError } = await getDiscoveryById(
      discovery_id,
      user.id
    )

    if (fetchError || !discovery) {
      return NextResponse.json(
        { error: "Discovery not found" },
        { status: 404 }
      )
    }

    if (discovery.status === "saved") {
      return NextResponse.json(
        { error: "This discovery has already been saved" },
        { status: 409 }
      )
    }

    // Verify context exists and belongs to user
    const { data: context, error: contextError } = await supabase
      .from("contexts")
      .select("id, name, thought_limit")
      .eq("id", context_id)
      .eq("user_id", user.id)
      .single()

    if (contextError || !context) {
      return NextResponse.json(
        { error: "Context not found" },
        { status: 404 }
      )
    }

    // Check if context is at thought limit
    const { count: thoughtCount, error: countError } = await supabase
      .from("gems")
      .select("*", { count: "exact", head: true })
      .eq("context_id", context_id)
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])

    if (countError) {
      console.error("Thought count error:", countError)
      return NextResponse.json(
        { error: "Failed to check context limit" },
        { status: 500 }
      )
    }

    if ((thoughtCount || 0) >= context.thought_limit) {
      return NextResponse.json(
        { error: `This context is at its limit of ${context.thought_limit} thoughts` },
        { status: 400 }
      )
    }

    // If adding to active list, check the active list limit
    if (is_on_active_list) {
      const { count: activeCount } = await supabase
        .from("gems")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_on_active_list", true)

      if ((activeCount || 0) >= 10) {
        return NextResponse.json(
          { error: "Active List is limited to 10 thoughts. Remove one before adding another." },
          { status: 400 }
        )
      }
    }

    // Create the thought
    const { data: thought, error: createError } = await supabase
      .from("gems")
      .insert({
        user_id: user.id,
        content: thought_content.trim(),
        context_id: context_id,
        context_tag: "other", // Legacy field
        source: discovery.source_title,
        source_url: discovery.source_url,
        is_on_active_list: is_on_active_list ?? false,
        status: "active",
        application_count: 0,
        skip_count: 0,
      })
      .select()
      .single()

    if (createError) {
      console.error("Thought creation error:", createError)
      return NextResponse.json(
        { error: "Failed to create thought" },
        { status: 500 }
      )
    }

    // Update discovery status
    const { error: updateError } = await updateDiscoveryStatus(
      discovery_id,
      user.id,
      "saved",
      thought.id
    )

    if (updateError) {
      console.error("Discovery update error:", updateError)
      // Don't fail - the thought was created
    }

    return NextResponse.json({
      thought,
      message: "Discovery saved as thought successfully",
    })
  } catch (error) {
    console.error("Save discovery API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
