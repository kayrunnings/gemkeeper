import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const TF_THINKS_PROMPT = `You are TF (ThoughtFlow), an AI companion that helps users understand their own thinking and behavior patterns. Analyze the user's data and generate insightful, personalized observations.

## Available Data
You will receive a JSON object with the user's data including:
- thoughts: Their captured thoughts with content, context, application counts, and timestamps
- notes: Their notes with titles and creation dates
- checkins: Recent check-in history (applied or skipped)
- calendar_events: Upcoming events (if available)
- stats: Summary statistics

## Output Format
Generate 3-5 insights. Each insight should:
1. Be conversational and warm, not clinical
2. Reference specific data points when possible
3. Be concise (1-2 sentences max)
4. Use markdown-style formatting for emphasis:
   - **text** for strong/numbers
   - \`text\` for context names
   - _text_ for highlights

## Tone
- Observational, not prescriptive ("I noticed..." not "You should...")
- Curious and supportive
- Occasionally playful
- Never judgmental about gaps or inconsistencies

## Example Outputs
- "Tomorrow looks busy — **4 meetings** on your calendar. You tend to apply \`Meetings\` thoughts _2x more_ on days like this."
- "You've been capturing a lot about leadership lately. Your \`Relationships\` context hasn't seen action in _2 weeks_ — missing it?"
- "**3** of your last **5** captures were late-night saves. _Night owl mode activated?_"
- "Your \`Focus\` thoughts graduate faster than any other context. Something about deep work really clicks for you."

Return valid JSON only, no markdown code blocks:
{
  "insights": [
    {
      "id": "unique-id",
      "message": "The insight text with **bold**, \`context\`, and _highlight_ formatting"
    }
  ]
}`

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user data for context
    const [
      thoughtsResult,
      notesResult,
      checkinsResult,
      calendarResult,
      statsResult,
    ] = await Promise.all([
      // Recent thoughts (last 30 days)
      supabase
        .from("gems")
        .select("id, content, context_id, application_count, skip_count, status, created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(50),

      // Recent notes (last 30 days)
      supabase
        .from("notes")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(20),

      // Recent check-ins
      supabase
        .from("gem_checkins")
        .select("id, gem_id, checkin_type, response, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),

      // Upcoming calendar events (if connected)
      supabase
        .from("calendar_events_cache")
        .select("id, title, start_time")
        .eq("user_id", user.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(10),

      // Stats
      Promise.all([
        supabase
          .from("gems")
          .select("id, status, application_count", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("gems")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "graduated"),
        supabase
          .from("contexts")
          .select("id, name")
          .eq("user_id", user.id),
      ]),
    ])

    // Get context names
    const contextMap = new Map<string, string>()
    if (statsResult[2].data) {
      statsResult[2].data.forEach((c) => contextMap.set(c.id, c.name))
    }

    // Add context names to thoughts
    const thoughtsWithContextNames = (thoughtsResult.data || []).map((t) => ({
      ...t,
      context_name: t.context_id ? contextMap.get(t.context_id) : null,
    }))

    // Prepare data for AI
    const userData = {
      thoughts: thoughtsWithContextNames,
      notes: notesResult.data || [],
      checkins: checkinsResult.data || [],
      calendar_events: calendarResult.data || [],
      stats: {
        active_thoughts: statsResult[0].count || 0,
        graduated_thoughts: statsResult[1].count || 0,
        total_applications: (statsResult[0].data || []).reduce(
          (sum, t) => sum + (t.application_count || 0),
          0
        ),
        contexts: statsResult[2].data?.map((c) => c.name) || [],
      },
    }

    // Check if we have enough data for meaningful insights
    if ((thoughtsResult.data || []).length === 0 && (notesResult.data || []).length === 0) {
      // Return bootstrap insights for new users
      return NextResponse.json({
        insights: [
          {
            id: "bootstrap-1",
            message: "Welcome to ThoughtFolio! Start by capturing your first thought or note — I'll learn your patterns and share personalized insights.",
          },
          {
            id: "bootstrap-2",
            message: "Try the **Capture** section to add a quote, URL, or any piece of knowledge you want to remember.",
          },
        ],
      })
    }

    // Call Gemini for insights
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    })

    const result = await model.generateContent([
      { text: TF_THINKS_PROMPT },
      { text: `User data:\n${JSON.stringify(userData, null, 2)}` },
    ])

    const response = result.response
    const text = response.text()

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({
        insights: parsed.insights || [],
      })
    } catch {
      console.error("Failed to parse TF insights response:", text)
      return NextResponse.json({
        insights: [
          {
            id: "fallback-1",
            message: "You have **" + (thoughtsResult.data?.length || 0) + "** thoughts captured. Keep building your knowledge library!",
          },
        ],
      })
    }
  } catch (error) {
    console.error("TF insights error:", error)
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    )
  }
}
