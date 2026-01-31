import { GoogleGenerativeAI } from "@google/generative-ai"
import type {
  GemMatch,
  GemForMatching,
  MatchingResponse
} from "@/types/matching"
import {
  MAX_GEMS_TO_MATCH,
  MIN_RELEVANCE_SCORE,
  MATCHING_TIMEOUT_MS
} from "@/types/matching"
import { MOMENT_MATCHING_PROMPT, buildLearnedThoughtsSection } from "@/lib/ai/prompts"
import type { LearnedThought } from "@/lib/types/learning"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

/**
 * Format gems for the prompt
 */
function formatGemsForPrompt(gems: GemForMatching[]): string {
  return gems
    .map((gem, index) => {
      const source = gem.source ? ` (Source: ${gem.source})` : ''
      return `[${index + 1}] ID: ${gem.id}
Content: "${gem.content}"
Context: ${gem.context_tag}${source}`
    })
    .join('\n\n')
}

/**
 * Validate and sanitize match results
 */
function validateMatches(
  parsed: unknown,
  validGemIds: Set<string>
): GemMatch[] {
  if (!Array.isArray(parsed)) {
    return []
  }

  const matches: GemMatch[] = []

  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) continue

    const obj = item as Record<string, unknown>

    const gemId = String(obj.gem_id || '')
    const score = Number(obj.relevance_score || 0)
    const reason = String(obj.relevance_reason || '')

    // Validate gem ID exists
    if (!validGemIds.has(gemId)) continue

    // Validate score is in range and above threshold
    if (score < MIN_RELEVANCE_SCORE || score > 1) continue

    // Validate reason exists
    if (!reason.trim()) continue

    matches.push({
      gem_id: gemId,
      relevance_score: Math.round(score * 100) / 100, // Round to 2 decimals
      relevance_reason: reason.slice(0, 500), // Limit reason length
    })
  }

  // Sort by score descending and limit to max
  return matches
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, MAX_GEMS_TO_MATCH)
}

/**
 * Match gems to a moment using AI
 *
 * @param momentDescription - Description of the upcoming moment
 * @param gems - User's saved thoughts to match against
 * @param learnedThoughts - Optional: Previously helpful thoughts for similar moments (Epic 14)
 */
export async function matchGemsToMoment(
  momentDescription: string,
  gems: GemForMatching[],
  learnedThoughts?: LearnedThought[]
): Promise<MatchingResponse> {
  const startTime = Date.now()

  // Early return if no gems
  if (!gems || gems.length === 0) {
    return {
      matches: [],
      processing_time_ms: Date.now() - startTime,
    }
  }

  // Create a set of valid gem IDs for validation
  const validGemIds = new Set(gems.map(g => g.id))

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
      },
    })

    // Epic 14: Build learned thoughts section if available
    const learnedSection = learnedThoughts && learnedThoughts.length > 0
      ? buildLearnedThoughtsSection(learnedThoughts)
      : ''

    const prompt = MOMENT_MATCHING_PROMPT
      .replace('{moment_description}', momentDescription)
      .replace('{learned_thoughts_section}', learnedSection)
      .replace('{gems_list}', formatGemsForPrompt(gems))

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Matching timeout')), MATCHING_TIMEOUT_MS)
    })

    // Race the API call against the timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ])

    const response = result.response
    const text = response.text()

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('Failed to parse matching response:', text)
      return {
        matches: [],
        processing_time_ms: Date.now() - startTime,
      }
    }

    const matches = validateMatches(parsed, validGemIds)

    return {
      matches,
      processing_time_ms: Date.now() - startTime,
    }
  } catch (error) {
    console.error('Matching error:', error)
    return {
      matches: [],
      processing_time_ms: Date.now() - startTime,
    }
  }
}
