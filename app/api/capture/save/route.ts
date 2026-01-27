import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CaptureItem, CaptureSaveResponse } from "@/lib/types/capture"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body as { items: CaptureItem[] }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      )
    }

    // Get user's "Other" context as default
    const { data: otherContext } = await supabase
      .from("contexts")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", "other")
      .single()

    const defaultContextId = otherContext?.id

    let thoughtsCreated = 0
    let notesCreated = 0
    let sourcesCreated = 0

    // Process sources first to get IDs for linking
    const sourceMap = new Map<string, string>()

    for (const item of items) {
      if (item.type === 'source') {
        const { data: source, error } = await supabase
          .from("sources")
          .insert({
            user_id: user.id,
            name: item.content,
            url: item.sourceUrl,
            type: 'other', // Default type
          })
          .select("id")
          .single()

        if (!error && source) {
          sourcesCreated++
          // Store for linking
          if (item.sourceUrl) {
            sourceMap.set(item.sourceUrl, source.id)
          }
          sourceMap.set(item.content, source.id)
        }
      }
    }

    // Process thoughts
    const thoughtMap = new Map<string, string>()

    for (const item of items) {
      if (item.type === 'thought') {
        // Try to find source ID
        let sourceId: string | undefined
        if (item.sourceUrl && sourceMap.has(item.sourceUrl)) {
          sourceId = sourceMap.get(item.sourceUrl)
        } else if (item.source && sourceMap.has(item.source)) {
          sourceId = sourceMap.get(item.source)
        }

        const { data: thought, error } = await supabase
          .from("gems")
          .insert({
            user_id: user.id,
            content: item.content.slice(0, 200),
            source: item.source,
            source_url: item.sourceUrl,
            context_id: item.contextId || defaultContextId,
            is_on_active_list: item.addToActiveList || false,
            status: 'active',
            source_id: sourceId,
          })
          .select("id")
          .single()

        if (!error && thought) {
          thoughtsCreated++
          // Store for linking notes
          thoughtMap.set(item.id, thought.id)
        }
      }
    }

    // Process notes
    for (const item of items) {
      if (item.type === 'note') {
        const { data: note, error } = await supabase
          .from("notes")
          .insert({
            user_id: user.id,
            title: item.content.slice(0, 100),
            content: item.content,
            tags: [],
          })
          .select("id")
          .single()

        if (!error && note) {
          notesCreated++

          // Link to thought if specified
          if (item.linkToThoughtId && thoughtMap.has(item.linkToThoughtId)) {
            const linkedThoughtId = thoughtMap.get(item.linkToThoughtId)
            if (linkedThoughtId) {
              await supabase
                .from("note_thought_links")
                .insert({
                  note_id: note.id,
                  gem_id: linkedThoughtId,
                  position: 0,
                })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: {
        thoughts: thoughtsCreated,
        notes: notesCreated,
        sources: sourcesCreated,
      },
    } satisfies CaptureSaveResponse)

  } catch (error) {
    console.error("Capture save error:", error)
    return NextResponse.json(
      { error: "Failed to save items" },
      { status: 500 }
    )
  }
}
