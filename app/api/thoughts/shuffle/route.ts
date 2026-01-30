import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/thoughts/shuffle
 * Get a random thought from the Active List for the daily check-in
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all thoughts on the Active List
    const { data: thoughts, error } = await supabase
      .from("gems")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "passive"])
      .eq("is_on_active_list", true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!thoughts || thoughts.length === 0) {
      return NextResponse.json(
        { thought: null, message: "No thoughts on Active List" },
        { status: 200 }
      )
    }

    // Get a random thought from the Active List
    const randomIndex = Math.floor(Math.random() * thoughts.length)
    const randomThought = thoughts[randomIndex]

    return NextResponse.json({ thought: randomThought })
  } catch (error) {
    console.error("Shuffle error:", error)
    return NextResponse.json(
      { error: "Failed to shuffle thought" },
      { status: 500 }
    )
  }
}
