"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Thought } from "@/lib/types/thought"
import { ThoughtDetail } from "@/components/thought-detail"
import { Button } from "@/components/ui/button"
import { Lightbulb, Loader2, LogOut, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ThoughtDetailPage() {
  const [thought, setThought] = useState<Thought | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const thoughtId = params.id as string

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUserEmail(user.email ?? null)

      const { data, error } = await supabase
        .from("gems")
        .select("*")
        .eq("id", thoughtId)
        .single()

      if (error) {
        console.error("Error fetching thought:", error)
        router.push("/thoughts")
        return
      }

      setThought(data)
      setIsLoading(false)
    }

    loadData()
  }, [router, supabase, thoughtId])

  const handleThoughtUpdated = (updatedThought: Thought) => {
    setThought(updatedThought)
  }

  const handleThoughtRetired = () => {
    router.push("/thoughts")
  }

  const handleThoughtGraduated = () => {
    router.push("/thought-bank")
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading thought...</p>
        </div>
      </div>
    )
  }

  if (!thought) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">Thought not found</p>
          <Link href="/thoughts">
            <Button>Back to Thoughts</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/thoughts" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">ThoughtFolio</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l">
            <div
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium"
              title={userEmail ?? undefined}
            >
              {userEmail?.[0]?.toUpperCase() ?? "U"}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Sign out"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/thoughts">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Thoughts
            </Button>
          </Link>
        </div>

        <ThoughtDetail
          thought={thought}
          onThoughtUpdated={handleThoughtUpdated}
          onThoughtRetired={handleThoughtRetired}
          onThoughtGraduated={handleThoughtGraduated}
        />
      </main>
    </div>
  )
}
