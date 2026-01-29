import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PrepCard } from "@/components/moments/PrepCard"
import type { MomentWithGems, MomentThought } from "@/types/moments"
import type { Note } from "@/lib/types"

interface PreparePageProps {
  params: Promise<{ id: string }>
}

// Extended type for moment thought with linked notes
export interface MomentThoughtWithNotes extends MomentThought {
  linkedNotes?: Note[]
}

export default async function PreparePage({ params }: PreparePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch moment with gems
  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (momentError || !moment) {
    notFound()
  }

  // Fetch matched gems with thought data
  const { data: momentGems } = await supabase
    .from("moment_gems")
    .select(`
      *,
      thought:gems(*)
    `)
    .eq("moment_id", id)
    .eq("user_id", user.id)
    .order("relevance_score", { ascending: false })

  // Fetch linked notes for each matched thought
  const thoughtIds = momentGems?.map(mg => mg.gem_id).filter(Boolean) || []
  let linkedNotesMap: Record<string, Note[]> = {}

  if (thoughtIds.length > 0) {
    // Get all note links for the matched thoughts
    const { data: noteLinks } = await supabase
      .from("note_thought_links")
      .select(`
        gem_id,
        notes:note_id (id, title, content, created_at, updated_at, user_id, folder_id)
      `)
      .in("gem_id", thoughtIds)

    if (noteLinks) {
      // Group notes by thought id
      for (const link of noteLinks) {
        const gemId = link.gem_id
        const note = link.notes as unknown as Note
        if (note) {
          if (!linkedNotesMap[gemId]) {
            linkedNotesMap[gemId] = []
          }
          linkedNotesMap[gemId].push(note)
        }
      }
    }
  }

  // Enhance moment thoughts with linked notes
  const enhancedMomentGems: MomentThoughtWithNotes[] = (momentGems || []).map(mg => ({
    ...mg,
    linkedNotes: linkedNotesMap[mg.gem_id] || [],
  }))

  const momentWithGems: MomentWithGems & { matched_thoughts: MomentThoughtWithNotes[] } = {
    ...moment,
    matched_thoughts: enhancedMomentGems,
  }

  return (
    <div className="container py-8 px-4">
      <PrepCard moment={momentWithGems} />
    </div>
  )
}
