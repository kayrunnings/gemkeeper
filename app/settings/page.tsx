"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Profile, COMMON_TIMEZONES } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gem, Loader2, LogOut, RefreshCw, Settings as SettingsIcon, Sparkles, AlertCircle, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { grantAIConsent, revokeAIConsent } from "./actions"
import { AIConsentModal } from "@/components/ai-consent-modal"
import Link from "next/link"
import { AppSidebar, MobileNav } from "@/components/app-sidebar"

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAIConsentModal, setShowAIConsentModal] = useState(false)
  const [isRevokingAI, setIsRevokingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const handleGrantAIConsent = async (): Promise<{ error: string | null }> => {
    const result = await grantAIConsent()
    if (result.error) {
      return { error: result.error }
    }
    if (result.data) {
      setProfile(result.data)
    }
    setSuccessMessage("AI features enabled!")
    setTimeout(() => setSuccessMessage(null), 3000)
    return { error: null }
  }

  const handleRevokeAIConsent = async () => {
    setIsRevokingAI(true)
    setAiError(null)
    const result = await revokeAIConsent()
    if (result.error) {
      setAiError(result.error)
    } else if (result.data) {
      setProfile(result.data)
      setSuccessMessage("AI features disabled")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setIsRevokingAI(false)
  }

  const formatConsentDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
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

      {/* Mobile navigation */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Settings area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
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

          {/* AI Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                AI Features
              </CardTitle>
              <CardDescription>
                Use AI to extract gems from articles, books, and transcripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiError && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{aiError}</p>
                </div>
              )}

              {profile?.ai_consent_given ? (
                <>
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-violet-900">AI Features Enabled</span>
                      <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">Active</span>
                    </div>
                    {profile.ai_consent_date && (
                      <p className="text-xs text-violet-700">
                        Enabled on {formatConsentDate(profile.ai_consent_date)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={handleRevokeAIConsent}
                    disabled={isRevokingAI}
                  >
                    {isRevokingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      "Disable AI Features"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered gem extraction to automatically find insights from your content.
                  </p>
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                    onClick={() => setShowAIConsentModal(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Enable AI Features
                  </Button>
                </>
              )}
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
        </div>
      </main>
      </div>

      {/* AI Consent Modal */}
      <AIConsentModal
        isOpen={showAIConsentModal}
        onClose={() => setShowAIConsentModal(false)}
        onConsent={handleGrantAIConsent}
      />
    </div>
  )
}
