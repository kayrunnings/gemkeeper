import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ContextTag, MAX_ACTIVE_THOUGHTS } from "@/lib/types/thought"

interface BulkThoughtInput {
  content: string
  context_tag: ContextTag
  source?: string
  source_url?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { thoughts } = body as { thoughts: BulkThoughtInput[] }

  if (!thoughts || !Array.isArray(thoughts) || thoughts.length === 0) {
    return NextResponse.json(
      { error: "At least one thought is required" },
      { status: 400 }
    )
  }

  // Validate each thought
  for (const thought of thoughts) {
    if (!thought.content || typeof thought.content !== "string") {
      return NextResponse.json(
        { error: "Each thought must have content" },
        { status: 400 }
      )
    }
    if (!thought.context_tag) {
      return NextResponse.json(
        { error: "Each thought must have a context_tag" },
        { status: 400 }
      )
    }
  }

  // Check current active thought count
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  const currentCount = count || 0
  const availableSlots = MAX_ACTIVE_THOUGHTS - currentCount

  if (availableSlots <= 0) {
    return NextResponse.json(
      {
        error: `You have ${MAX_ACTIVE_THOUGHTS} active thoughts. Retire some before adding more.`,
        currentCount,
        availableSlots: 0,
      },
      { status: 400 }
    )
  }

  if (thoughts.length > availableSlots) {
    return NextResponse.json(
      {
        error: `You can only add ${availableSlots} more thought${availableSlots === 1 ? "" : "s"}. You selected ${thoughts.length}.`,
        currentCount,
        availableSlots,
      },
      { status: 400 }
    )
  }

  // Prepare thoughts for insertion
  const thoughtsToInsert = thoughts.map((thought) => ({
    user_id: user.id,
    content: thought.content.slice(0, 200), // Enforce max length
    context_tag: thought.context_tag,
    source: thought.source || null,
    source_url: thought.source_url || null,
    status: "active" as const,
    application_count: 0,
    skip_count: 0,
  }))

  const { data, error } = await supabase
    .from("gems")
    .insert(thoughtsToInsert)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    thoughts: data,
    count: data?.length || 0,
  })
}
