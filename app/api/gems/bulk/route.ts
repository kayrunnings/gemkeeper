/**
 * @deprecated Use /api/thoughts/bulk instead. This endpoint is maintained for backward compatibility.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ContextTag } from "@/lib/types/thought"

interface BulkGemInput {
  content: string
  context_tag: ContextTag
  source?: string
  source_url?: string
}

export async function POST(request: NextRequest) {
  // Log deprecation warning
  console.warn("DEPRECATED: /api/gems/bulk is deprecated. Use /api/thoughts/bulk instead.")
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

  // Note: No limit on total thoughts. New thoughts are created as Passive by default.
  // The Active List limit (10) is enforced when adding to Active List via toggleActiveList().

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

  const response = NextResponse.json({
    gems: data,
    count: data?.length || 0,
  })
  response.headers.set("X-Deprecated", "Use /api/thoughts/bulk instead")
  return response
}
