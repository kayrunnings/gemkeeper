import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import type { NLPScheduleResult, ScheduleType } from "@/types/schedules"
import { SCHEDULE_PARSE_PROMPT } from "@/lib/ai/prompts"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

function isValidScheduleType(type: unknown): type is ScheduleType {
  return typeof type === "string" && ["daily", "weekly", "monthly", "custom"].includes(type)
}

function validateResult(parsed: Record<string, unknown>): NLPScheduleResult {
  // Ensure all required fields with defaults
  const result: NLPScheduleResult = {
    cron_expression: typeof parsed.cron_expression === "string" ? parsed.cron_expression : "0 9 * * *",
    human_readable: typeof parsed.human_readable === "string" ? parsed.human_readable : "Every day at 9:00 AM",
    schedule_type: isValidScheduleType(parsed.schedule_type) ? parsed.schedule_type : "daily",
    days_of_week: Array.isArray(parsed.days_of_week) ? parsed.days_of_week : null,
    time_of_day: typeof parsed.time_of_day === "string" ? parsed.time_of_day : "09:00",
    day_of_month: typeof parsed.day_of_month === "number" ? parsed.day_of_month : null,
    confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
  }

  // Validate days_of_week values
  if (result.days_of_week) {
    result.days_of_week = result.days_of_week.filter(
      (d): d is number => typeof d === "number" && d >= 0 && d <= 6
    )
    if (result.days_of_week.length === 0) {
      result.days_of_week = null
    }
  }

  // Validate day_of_month
  if (result.day_of_month !== null && result.day_of_month !== -1) {
    if (result.day_of_month < 1 || result.day_of_month > 31) {
      result.day_of_month = null
    }
  }

  // Validate time format (HH:MM)
  if (!/^\d{1,2}:\d{2}$/.test(result.time_of_day)) {
    result.time_of_day = "09:00"
  }

  return result
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const text = body.text

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      )
    }

    if (text.length > 200) {
      return NextResponse.json(
        { error: "Text input must be 200 characters or less" },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 256,
      },
    })

    const prompt = SCHEDULE_PARSE_PROMPT.replace("{user_input}", text)

    const result = await model.generateContent(prompt)
    const response = result.response
    const responseText = response.text()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(responseText)
    } catch {
      // If parsing fails, return low confidence default
      return NextResponse.json({
        result: {
          cron_expression: "0 9 * * *",
          human_readable: "Every day at 9:00 AM",
          schedule_type: "daily",
          days_of_week: null,
          time_of_day: "09:00",
          day_of_month: null,
          confidence: 0.1,
        } as NLPScheduleResult,
      })
    }

    const validatedResult = validateResult(parsed)

    return NextResponse.json({ result: validatedResult })
  } catch (error) {
    console.error("Schedule parse error:", error)
    return NextResponse.json(
      { error: "Failed to parse schedule" },
      { status: 500 }
    )
  }
}
