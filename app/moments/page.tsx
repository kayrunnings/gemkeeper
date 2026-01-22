import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MomentsHistoryClient } from "./MomentsHistoryClient"

export default async function MomentsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all moments
  const { data: moments } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <MomentsHistoryClient initialMoments={moments || []} />
}
