"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Profile, COMMON_TIMEZONES } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogOut, RefreshCw, Settings as SettingsIcon, Sparkles, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { grantAIConsent, revokeAIConsent } from "./actions"
import { AIConsentModal } from "@/components/ai-consent-modal"
import { LayoutShell } from "@/components/layout-shell"
import { CalendarSettings } from "@/components/settings/CalendarSettings"
import { useToast } from "@/components/error-toast"

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showAIConsentModal, setShowAIConsentModal] = useState(false)
  const [isRevokingAI, setIsRevokingAI] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [timezone, setTimezone] = useState("America/New_York")
  const [dailyPromptTime, setDailyPromptTime] = useState("08:00")
  const [checkinTime, setCheckinTime] = useState("20:00")

  const router = useRouter()
  const supabase = createClient()
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
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
          showError(error, "Failed to load profile")
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
            showError(createError, "Failed to create profile")
          } else if (newProfile) {
            setProfile(newProfile)
          }
        }
      } catch (err) {
        showError(err, "Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase, showError])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)

    try {
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
        showError(error, "Failed to save settings")
      } else {
        showSuccess("Settings saved!", "Your preferences have been updated.")
      }
    } catch (err) {
      showError(err, "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReplayOnboarding = async () => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) {
        showError(error, "Failed to reset onboarding")
      } else {
        router.push("/onboarding")
      }
    } catch (err) {
      showError(err, "Failed to reset onboarding")
    }
  }

  const handleGrantAIConsent = async (): Promise<{ error: string | null }> => {
    const result = await grantAIConsent()
    if (result.error) {
      return { error: result.error }
    }
    if (result.data) {
      setProfile(result.data)
    }
    showSuccess("AI features enabled!", "You can now extract gems with AI.")
    return { error: null }
  }

  const handleRevokeAIConsent = async () => {
    setIsRevokingAI(true)
    try {
      const result = await revokeAIConsent()
      if (result.error) {
        showError(result.error)
      } else if (result.data) {
        setProfile(result.data)
        showSuccess("AI features disabled")
      }
    } catch (err) {
      showError(err, "Failed to disable AI features")
    } finally {
      setIsRevokingAI(false)
    }
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
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <SettingsIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutShell userEmail={userEmail}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your preferences</p>
          </div>
        </div>

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
                  className="bg-secondary"
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

          {/* Calendar Integration */}
          <CalendarSettings />

          {/* AI Features Card */}
          <Card className="overflow-hidden">
            <div className="h-1 ai-gradient" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary ai-sparkle" />
                AI Features
              </CardTitle>
              <CardDescription>
                Use AI to extract gems from articles, books, and transcripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.ai_consent_given ? (
                <>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">AI Features Enabled</span>
                      <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                        Active
                      </span>
                    </div>
                    {profile.ai_consent_date && (
                      <p className="text-xs text-muted-foreground">
                        Enabled on {formatConsentDate(profile.ai_consent_date)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
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
                    variant="ai"
                    className="w-full gap-2"
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
            <CardContent className="space-y-3">
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
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/login")
                  router.refresh()
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full h-12">
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

      {/* AI Consent Modal */}
      <AIConsentModal
        isOpen={showAIConsentModal}
        onClose={() => setShowAIConsentModal(false)}
        onConsent={handleGrantAIConsent}
      />
    </LayoutShell>
  )
}
