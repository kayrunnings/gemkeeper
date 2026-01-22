"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Onboarding } from "@/components/onboarding"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update profile to mark onboarding as completed
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })

    router.push("/gems")
  }

  const handleSkip = async () => {
    // Same as complete - mark onboarding done
    await handleComplete()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Onboarding
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}
