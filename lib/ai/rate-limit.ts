import { createClient } from "@/lib/supabase/server"
import { createHash } from "crypto"
import { ExtractionResult } from "./gemini"

const DAILY_EXTRACTION_LIMIT = 10
const DAILY_TOKEN_LIMIT = 50000

export interface UsageStatus {
  extractionsToday: number
  extractionsRemaining: number
  tokensToday: number
  canExtract: boolean
  resetTime: Date
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

function getStartOfDay(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getEndOfDay(): Date {
  const startOfDay = getStartOfDay()
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
}

export async function checkUsageLimit(userId: string): Promise<UsageStatus> {
  const supabase = await createClient()
  const today = getStartOfDay().toISOString().split("T")[0]

  const { data } = await supabase
    .from("ai_usage")
    .select("extraction_count, tokens_used")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .single()

  const extractionsToday = data?.extraction_count || 0
  const tokensToday = data?.tokens_used || 0
  const extractionsRemaining = Math.max(0, DAILY_EXTRACTION_LIMIT - extractionsToday)
  const canExtract = extractionsToday < DAILY_EXTRACTION_LIMIT && tokensToday < DAILY_TOKEN_LIMIT

  return {
    extractionsToday,
    extractionsRemaining,
    tokensToday,
    canExtract,
    resetTime: getEndOfDay(),
  }
}

export async function recordUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  const supabase = await createClient()
  const today = getStartOfDay().toISOString().split("T")[0]

  // Try to update existing record
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("id, extraction_count, tokens_used")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .single()

  if (existing) {
    await supabase
      .from("ai_usage")
      .update({
        extraction_count: existing.extraction_count + 1,
        tokens_used: existing.tokens_used + tokensUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
  } else {
    await supabase.from("ai_usage").insert({
      user_id: userId,
      usage_date: today,
      extraction_count: 1,
      tokens_used: tokensUsed,
    })
  }
}

export async function getCachedExtraction(
  userId: string,
  contentHash: string
): Promise<ExtractionResult | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("ai_extractions")
    .select("extracted_gems, tokens_used")
    .eq("user_id", userId)
    .eq("input_hash", contentHash)
    .single()

  if (!data || !data.extracted_gems) {
    return null
  }

  return {
    thoughts: data.extracted_gems as ExtractionResult["thoughts"],
    tokens_used: data.tokens_used,
  }
}

export async function cacheExtraction(
  userId: string,
  contentHash: string,
  content: string,
  source: string | null,
  result: ExtractionResult
): Promise<void> {
  const supabase = await createClient()

  await supabase.from("ai_extractions").insert({
    user_id: userId,
    input_content: content.slice(0, 10000), // Limit stored content
    input_hash: contentHash,
    source: source,
    extracted_gems: result.thoughts,
    tokens_used: result.tokens_used,
  })
}
