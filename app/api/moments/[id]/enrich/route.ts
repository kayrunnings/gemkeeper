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

    // Delete existing matches
    await supabase
      .from("moment_gems")
      .delete()
      .eq("moment_id", momentId)

    let matchedCount = 0
    let processingTimeMs = 0

    // Run AI matching if we have thoughts
    if (gemsForMatching.length > 0) {
      try {
        // Epic 14: Get learned thoughts for similar patterns
        const analysis = analyzeEventTitle(originalDescription)
        const patterns: MomentPatterns = {
          eventType: analysis.detectedEventType,
          keywords: extractKeywords(enrichedDescription),
          recurringEventId: moment.calendar_event_id || undefined,
        }
        const { thoughts: learnedThoughts } = await getLearnedThoughts(user.id, patterns)

        // Format learned thoughts for the prompt
        const learnedThoughtsForPrompt: LearnedThought[] = (learnedThoughts || []).map(lt => ({
          gem_id: lt.gem_id,
          content: gemsForMatching.find(g => g.id === lt.gem_id)?.content || '',
          confidence: lt.confidence,
          pattern_sources: lt.pattern_sources || [],
        }))

        const matchResult = await matchGemsToMoment(
          enrichedDescription,
          gemsForMatching,
          learnedThoughtsForPrompt
        )
        processingTimeMs = matchResult.processing_time_ms

        if (matchResult.matches.length > 0) {
          // Insert matched thoughts
          const momentGemsData = matchResult.matches.map((match) => ({
            moment_id: momentId,
            gem_id: match.gem_id,
            user_id: user.id,
            relevance_score: match.relevance_score,
            relevance_reason: match.relevance_reason,
            was_helpful: null,
            was_reviewed: false,
            match_source: match.match_source || 'ai',
          }))

          await supabase.from("moment_gems").insert(momentGemsData)
          matchedCount = matchResult.matches.length

          // Update moment with match count
          await supabase
            .from("moments")
            .update({
              gems_matched_count: matchedCount,
              ai_processing_time_ms: processingTimeMs,
            })
            .eq("id", momentId)
        }
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
      matched_count: matchedCount,
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
