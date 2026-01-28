import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check AI consent
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_consent_given")
    .eq("id", user.id)
    .single()

  if (!profile?.ai_consent_given) {
    return NextResponse.json(
      { error: "AI consent required" },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { prompt, text } = body as { prompt: string; text: string }

  if (!prompt || !text) {
    return NextResponse.json(
      { error: "Prompt and text are required" },
      { status: 400 }
    )
  }

  if (text.length > 10000) {
    return NextResponse.json(
      { error: "Text too long (max 10,000 characters)" },
      { status: 400 }
    )
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = `You are a helpful writing assistant for a personal knowledge management app called ThoughtFolio.
Your task is to help users improve their notes and writing.

Guidelines:
- Maintain the user's voice and style as much as possible
- Keep the same general structure unless asked to change it
- Be concise and clear
- Return only the improved/modified text, without any explanations or preamble
- Match the tone of the original text (formal, casual, etc.)
- Preserve any markdown formatting if present

User's request: ${prompt}

Text to process:
${text}`

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const resultText = response.text()

    return NextResponse.json({ result: resultText })
  } catch (error) {
    console.error("AI write assist error:", error)
    return NextResponse.json(
      { error: "Failed to process text with AI" },
      { status: 500 }
    )
  }
}
