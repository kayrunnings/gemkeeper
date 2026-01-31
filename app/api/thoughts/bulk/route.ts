import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ContextTag } from "@/lib/types/thought"

interface BulkThoughtInput {
  content: string
  context_tag: ContextTag
  source?: string
  source_url?: string
  source_id?: string
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

  // Note: No limit on total thoughts. New thoughts are created as Passive by default.
  // The Active List limit (10) is enforced when adding to Active List via toggleActiveList().

  // Prepare thoughts for insertion
  const thoughtsToInsert = thoughts.map((thought) => ({
    user_id: user.id,
    content: thought.content.slice(0, 200), // Enforce max length
    context_tag: thought.context_tag,
    source: thought.source || null,
    source_url: thought.source_url || null,
    source_id: thought.source_id || null,
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
