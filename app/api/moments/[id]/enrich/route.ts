import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { matchGemsToMoment } from "@/lib/matching"
import { getLearnedThoughts, extractKeywords } from "@/lib/moments/learning"
import { analyzeEventTitle, combineContextForMatching } from "@/lib/moments/title-analysis"
import type { GemForMatching } from "@/types/matching"
import type { LearnedThought, MomentPatterns } from "@/lib/types/learning"

/**
 * Add context to an existing moment and re-run AI matching
 * This is used when a calendar event moment was created without enrichment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: momentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { user_context, detected_event_type } = body as {
      user_context: string
      detected_event_type?: string
    }

    // Fetch the moment
    const { data: moment, error: momentError } = await supabase
      .from("moments")
      .select("*")
      .eq("id", momentId)
      .eq("user_id", user.id)
      .single()

    if (momentError || !moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 })
    }

    // Update moment with context
    const { error: updateError } = await supabase
      .from("moments")
      .update({
        user_context,
        detected_event_type: detected_event_type || moment.detected_event_type,
      })
      .eq("id", momentId)

    if (updateError) {
      console.error("Failed to update moment context:", updateError)
      return NextResponse.json({ error: "Failed to update moment" }, { status: 500 })
    }

    // Get all active and passive thoughts for AI matching
    const { data: gems, error: gemsError } = await supabase
      .from("gems")
      .select("id, content, context_tag, source")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])

    if (gemsError) {
      console.error("Gems fetch error:", gemsError)
    }

    const gemsForMatching: GemForMatching[] = gems?.map(g => ({
      id: g.id,
      content: g.content,
      context_tag: g.context_tag,
      source: g.source,
    })) || []

    // Build enriched description for matching
    const originalDescription = moment.calendar_event_title || moment.description
    const enrichedDescription = combineContextForMatching(originalDescription, user_context)

    // Story 18.5: Fetch existing matches to merge with (instead of deleting)
    const { data: existingMatches } = await supabase
      .from("moment_gems")
      .select("id, gem_id, relevance_score, relevance_reason, was_helpful, was_reviewed")
      .eq("moment_id", momentId)

    const existingByGemId = new Map(
      (existingMatches || []).map((m) => [m.gem_id, m])
    )

    let processingTimeMs = 0

    // Run AI matching if we have thoughts
    if (gemsForMatching.length > 0) {
      try {
        // Epic 14: Get learned thoughts for similar patterns
        const analysis = analyzeEventTitle(originalDescription)
        const patterns: MomentPatterns = {
          eventType: analysis.detectedEventType,
          keywords: extractKeywords(enrichedDescription),
          externalEventId: moment.calendar_event_id || undefined,
        }
        const { thoughts: learnedThoughts } = await getLearnedThoughts(user.id, patterns)

        // Format learned thoughts for the prompt
        const learnedThoughtsForPrompt: LearnedThought[] = (learnedThoughts || []).map(lt => ({
          gem_id: lt.gem_id,
          gem_content: lt.gem_content || gemsForMatching.find(g => g.id === lt.gem_id)?.content || '',
          confidence_score: lt.confidence_score,
          pattern_sources: lt.pattern_sources || [],
          helpful_count: lt.helpful_count,
        }))

        const matchResult = await matchGemsToMoment(
          enrichedDescription,
          gemsForMatching,
          learnedThoughtsForPrompt
        )
        processingTimeMs = matchResult.processing_time_ms

        // Story 18.5: Merge new matches with existing ones
        for (const newMatch of matchResult.matches) {
          const existing = existingByGemId.get(newMatch.gem_id)

          if (existing) {
            // Gem already matched — keep the higher relevance score
            if (newMatch.relevance_score > existing.relevance_score) {
              await supabase
                .from("moment_gems")
                .update({
                  relevance_score: newMatch.relevance_score,
                  relevance_reason: newMatch.relevance_reason,
                })
                .eq("id", existing.id)
            }
            // Either way, mark it as still present
            existingByGemId.delete(newMatch.gem_id)
          } else {
            // New gem — insert
            await supabase.from("moment_gems").insert({
              moment_id: momentId,
              gem_id: newMatch.gem_id,
              user_id: user.id,
              relevance_score: newMatch.relevance_score,
              relevance_reason: newMatch.relevance_reason,
              was_helpful: null,
              was_reviewed: false,
            })
          }
        }

        // Update moment with merged match count
        const { count: totalMatches } = await supabase
          .from("moment_gems")
          .select("*", { count: "exact", head: true })
          .eq("moment_id", momentId)

        await supabase
          .from("moments")
          .update({
            gems_matched_count: totalMatches || 0,
            ai_processing_time_ms: processingTimeMs,
          })
          .eq("id", momentId)
      } catch (matchError) {
        console.error("AI matching error:", matchError)
      }
    }

    // Fetch the updated moment with matched thoughts
    const { data: updatedMoment } = await supabase
      .from("moments")
      .select("*")
      .eq("id", momentId)
      .single()

    const { data: momentGems } = await supabase
      .from("moment_gems")
      .select(`*, thought:gems(*)`)
      .eq("moment_id", momentId)
      .order("relevance_score", { ascending: false })

    return NextResponse.json({
      moment: updatedMoment,
      matched_thoughts: momentGems || [],
      matched_count: momentGems?.length || 0,
      processing_time_ms: processingTimeMs,
    })
  } catch (error) {
    console.error("Enrich moment error:", error)
    return NextResponse.json(
      { error: "Failed to enrich moment" },
      { status: 500 }
    )
  }
}
