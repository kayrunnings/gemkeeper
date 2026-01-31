import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordHelpfulThought } from "@/lib/moments/learning"
import type { Moment } from "@/types/moments"

/**
 * POST /api/moments/learn/helpful
 *
 * Record that a thought was helpful for a moment.
 * This triggers the learning system to create pattern associations.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { moment_id, gem_id } = body as {
      moment_id?: string
      gem_id?: string
    }

    // Validate required fields
    if (!moment_id || !gem_id) {
      return NextResponse.json(
        { error: "moment_id and gem_id are required" },
        { status: 400 }
      )
    }

    // Fetch the moment to get its patterns
    const { data: moment, error: momentError } = await supabase
      .from("moments")
      .select("*")
      .eq("id", moment_id)
      .eq("user_id", user.id)
      .single()

    if (momentError || !moment) {
      return NextResponse.json(
        { error: "Moment not found" },
        { status: 404 }
      )
    }

    // Verify the gem belongs to this user
    const { data: gem, error: gemError } = await supabase
      .from("gems")
      .select("id")
      .eq("id", gem_id)
      .eq("user_id", user.id)
      .single()

    if (gemError || !gem) {
      return NextResponse.json(
        { error: "Thought not found" },
        { status: 404 }
      )
    }

    // Record the helpful signal
    const { error: learningError } = await recordHelpfulThought(
      user.id,
      moment_id,
      gem_id,
      moment as Moment
    )

    if (learningError) {
      console.error("Learning error:", learningError)
      return NextResponse.json(
        { error: "Failed to record learning" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Learning recorded",
    })
  } catch (error) {
    console.error("Learn helpful API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
