import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PrepCard } from "@/components/moments/PrepCard"
import type { MomentWithGems } from "@/types/moments"

interface PreparePageProps {
  params: Promise<{ id: string }>
}

export default async function PreparePage({ params }: PreparePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch moment with gems
  const { data: moment, error: momentError } = await supabase
    .from("moments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (momentError || !moment) {
    notFound()
  }

  // Fetch matched gems with gem data
  const { data: momentGems } = await supabase
    .from("moment_gems")
    .select(`
      *,
      gem:gems(*)
    `)
    .eq("moment_id", id)
    .eq("user_id", user.id)
    .order("relevance_score", { ascending: false })

  const momentWithGems: MomentWithGems = {
    ...moment,
    matched_thoughts: momentGems || [],
  }

  return (
    <div className="container py-8 px-4">
      <PrepCard moment={momentWithGems} />
    </div>
  )
}
