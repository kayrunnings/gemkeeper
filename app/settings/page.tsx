"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Profile, COMMON_TIMEZONES } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gem, Loader2, LogOut, ArrowLeft, RefreshCw, Settings as SettingsIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [timezone, setTimezone] = useState("America/New_York")
  const [dailyPromptTime, setDailyPromptTime] = useState("08:00")
  const [checkinTime, setCheckinTime] = useState("20:00")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUserEmail(user.email ?? null)

      // Fetch profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
      }

      if (data) {
        setProfile(data)
        setName(data.name || "")
        setTimezone(data.timezone || "America/New_York")
        setDailyPromptTime(data.daily_prompt_time || "08:00")
        setCheckinTime(data.checkin_time || "20:00")
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            onboarding_completed: false,
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating profile:", createError)
        } else if (newProfile) {
          setProfile(newProfile)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setSuccessMessage(null)

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name || null,
        timezone,
        daily_prompt_time: dailyPromptTime,
        checkin_time: checkinTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (error) {
      console.error("Error updating profile:", error)
    } else {
      setSuccessMessage("Settings saved successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }

    setIsSaving(false)
  }

  const handleReplayOnboarding = async () => {
    if (!profile) return

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (error) {
      console.error("Error resetting onboarding:", error)
    } else {
      router.push("/onboarding")
    }
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
          <p className="text-muted-foreground">Loading settings...</p>
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
            <Link href="/gems" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Gem className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">GemKeeper</h1>
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
        <div className="flex items-center gap-2 mb-6">
          <Link href="/gems">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">Settings</h2>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-3 rounded-md bg-green-100 text-green-800 text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userEmail || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your GemKeeper experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyPromptTime">Daily Prompt Time</Label>
                <Input
                  id="dailyPromptTime"
                  type="time"
                  value={dailyPromptTime}
                  onChange={(e) => setDailyPromptTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  When you&apos;ll receive your morning gem prompt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkinTime">Evening Check-in Time</Label>
                <Input
                  id="checkinTime"
                  type="time"
                  value={checkinTime}
                  onChange={(e) => setCheckinTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  When you&apos;ll be reminded to check in on your gem
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleReplayOnboarding}
              >
                <RefreshCw className="h-4 w-4" />
                Replay Onboarding
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
