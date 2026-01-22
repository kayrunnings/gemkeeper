import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ContextTag, MAX_ACTIVE_GEMS } from "@/lib/types/gem"

interface BulkGemInput {
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
  const { gems } = body as { gems: BulkGemInput[] }

  if (!gems || !Array.isArray(gems) || gems.length === 0) {
    return NextResponse.json(
      { error: "At least one gem is required" },
      { status: 400 }
    )
  }

  // Validate each gem
  for (const gem of gems) {
    if (!gem.content || typeof gem.content !== "string") {
      return NextResponse.json(
        { error: "Each gem must have content" },
        { status: 400 }
      )
    }
    if (!gem.context_tag) {
      return NextResponse.json(
        { error: "Each gem must have a context_tag" },
        { status: 400 }
      )
    }
  }

  // Check current active gem count
  const { count, error: countError } = await supabase
    .from("gems")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  const currentCount = count || 0
  const availableSlots = MAX_ACTIVE_GEMS - currentCount

  if (availableSlots <= 0) {
    return NextResponse.json(
      {
        error: `You have ${MAX_ACTIVE_GEMS} active gems. Retire some before adding more.`,
        currentCount,
        availableSlots: 0,
      },
      { status: 400 }
    )
  }

  if (gems.length > availableSlots) {
    return NextResponse.json(
      {
        error: `You can only add ${availableSlots} more gem${availableSlots === 1 ? "" : "s"}. You selected ${gems.length}.`,
        currentCount,
        availableSlots,
      },
      { status: 400 }
    )
  }

  // Prepare gems for insertion
  const gemsToInsert = gems.map((gem) => ({
    user_id: user.id,
    content: gem.content.slice(0, 200), // Enforce max length
    context_tag: gem.context_tag,
    source: gem.source || null,
    source_url: gem.source_url || null,
    status: "active" as const,
    application_count: 0,
    skip_count: 0,
  }))

  const { data, error } = await supabase
    .from("gems")
    .insert(gemsToInsert)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    gems: data,
    count: data?.length || 0,
  })
}
