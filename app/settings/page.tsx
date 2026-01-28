"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Profile, COMMON_TIMEZONES } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogOut, RefreshCw, Settings as SettingsIcon, Sparkles, Palette, Focus, Sun } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { getActiveListCount } from "@/lib/thoughts"
import { createClient } from "@/lib/supabase/client"
import { grantAIConsent, revokeAIConsent, updateFocusMode, updateActiveListLimit, updateCheckinEnabled } from "./actions"
import { AIConsentModal } from "@/components/ai-consent-modal"
import { LayoutShell } from "@/components/layout-shell"
import { CalendarSettings } from "@/components/settings/CalendarSettings"
import { ContextSettings } from "@/components/settings/ContextSettings"
import { useToast } from "@/components/error-toast"
import { useUITheme, UI_THEMES, UI_THEME_INFO } from "@/lib/ui-theme-context"
import { useTheme, THEMES, THEME_INFO, Theme } from "@/components/theme-provider"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { PanelLeftClose, PanelLeft } from "lucide-react"

// Appearance Settings Component
function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { uiTheme, setUITheme } = useUITheme()
  const { isCollapsedByDefault, setCollapsedByDefault } = useSidebar()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize the look and feel of ThoughtFolio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* UI Style Toggle */}
        <div className="space-y-3">
          <Label>UI Style</Label>
          <p className="text-xs text-muted-foreground">
            Choose between modern glass effects or traditional solid backgrounds
          </p>
          <div className="grid grid-cols-2 gap-3">
            {UI_THEMES.map((style) => (
              <button
                key={style}
                onClick={() => setUITheme(style)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  uiTheme === style
                    ? "border-primary bg-primary/10"
                    : "border-[var(--glass-card-border)] hover:border-[var(--glass-hover-border)] hover:bg-[var(--glass-hover-bg)]"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-8 rounded-lg",
                    style === "glass"
                      ? "bg-gradient-to-br from-white/20 to-white/5 backdrop-blur border border-white/20"
                      : "bg-card border border-border"
                  )}
                />
                <span className="text-sm font-medium">{UI_THEME_INFO[style].name}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {UI_THEME_INFO[style].description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-3">
          <Label>Color Theme</Label>
          <p className="text-xs text-muted-foreground">
            Choose your preferred color palette
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  theme === t
                    ? "border-primary bg-primary/10"
                    : "border-[var(--glass-card-border)] hover:border-[var(--glass-hover-border)] hover:bg-[var(--glass-hover-bg)]"
                )}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/20"
                  style={{
                    background: getThemeColor(t),
                  }}
                />
                <span className="text-xs font-medium">{THEME_INFO[t].name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Default State */}
        <div className="space-y-3">
          <Label>Sidebar</Label>
          <p className="text-xs text-muted-foreground">
            Choose the default state of the left navigation panel
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCollapsedByDefault(false)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                !isCollapsedByDefault
                  ? "border-primary bg-primary/10"
                  : "border-[var(--glass-card-border)] hover:border-[var(--glass-hover-border)] hover:bg-[var(--glass-hover-bg)]"
              )}
            >
              <PanelLeft className="h-6 w-6" />
              <span className="text-sm font-medium">Expanded</span>
              <span className="text-xs text-muted-foreground text-center">
                Sidebar always visible with labels
              </span>
            </button>
            <button
              onClick={() => setCollapsedByDefault(true)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                isCollapsedByDefault
                  ? "border-primary bg-primary/10"
                  : "border-[var(--glass-card-border)] hover:border-[var(--glass-hover-border)] hover:bg-[var(--glass-hover-bg)]"
              )}
            >
              <PanelLeftClose className="h-6 w-6" />
              <span className="text-sm font-medium">Collapsed</span>
              <span className="text-xs text-muted-foreground text-center">
                Icons only, more content space
              </span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to get theme accent color for preview
function getThemeColor(theme: Theme): string {
  const colors: Record<Theme, string> = {
    midnight: "#f97316",
    obsidian: "#10b981",
    amethyst: "#a78bfa",
    ocean: "#3b82f6",
    ruby: "#f43f5e",
    forest: "#eab308",
    rose: "#f472b6",
    nord: "#88c0d0",
    sunrise: "#f59e0b",
  }
  return colors[theme]
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showAIConsentModal, setShowAIConsentModal] = useState(false)
  const [isRevokingAI, setIsRevokingAI] = useState(false)
  const [activeListCount, setActiveListCount] = useState(0)
  const [focusModeEnabled, setFocusModeEnabled] = useState(true)
  const [activeListLimit, setActiveListLimit] = useState(10)
  const [checkinEnabled, setCheckinEnabled] = useState(true)
  const [isSavingFocusMode, setIsSavingFocusMode] = useState(false)
  const [isSavingLimit, setIsSavingLimit] = useState(false)
  const [isSavingCheckin, setIsSavingCheckin] = useState(false)

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
          setFocusModeEnabled(data.focus_mode_enabled ?? true)
          setActiveListLimit(data.active_list_limit ?? 10)
          setCheckinEnabled(data.checkin_enabled ?? true)

          // Fetch active list count
          const { count: currentActiveCount } = await getActiveListCount()
          setActiveListCount(currentActiveCount)
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

  const handleFocusModeToggle = async (enabled: boolean) => {
    setIsSavingFocusMode(true)
    try {
      const result = await updateFocusMode(enabled)
      if (result.error) {
        showError(result.error)
      } else if (result.data) {
        setProfile(result.data)
        setFocusModeEnabled(result.data.focus_mode_enabled)
        setActiveListLimit(result.data.active_list_limit)
        showSuccess(
          enabled ? "Focus Mode enabled" : "Focus Mode disabled",
          enabled
            ? "Active List limited to 10 thoughts"
            : `Active List limit set to ${result.data.active_list_limit} thoughts`
        )
      }
    } catch (err) {
      showError(err, "Failed to update Focus Mode")
    } finally {
      setIsSavingFocusMode(false)
    }
  }

  const handleLimitChange = async (newLimit: number) => {
    setActiveListLimit(newLimit)
  }

  const handleLimitCommit = async () => {
    if (focusModeEnabled) return // Don't save if focus mode is on
    setIsSavingLimit(true)
    try {
      const result = await updateActiveListLimit(activeListLimit)
      if (result.error) {
        showError(result.error)
      } else if (result.data) {
        setProfile(result.data)
        showSuccess("Limit updated", `Active List now limited to ${activeListLimit} thoughts`)
      }
    } catch (err) {
      showError(err, "Failed to update limit")
    } finally {
      setIsSavingLimit(false)
    }
  }

  const handleCheckinToggle = async (enabled: boolean) => {
    setIsSavingCheckin(true)
    try {
      const result = await updateCheckinEnabled(enabled)
      if (result.error) {
        showError(result.error)
      } else if (result.data) {
        setProfile(result.data)
        setCheckinEnabled(result.data.checkin_enabled)
        showSuccess(
          enabled ? "Daily Check-in enabled" : "Daily Check-in disabled",
          enabled
            ? "Today's Focus card will appear on your dashboard"
            : "Today's Focus card will be hidden"
        )
      }
    } catch (err) {
      showError(err, "Failed to update check-in setting")
    } finally {
      setIsSavingCheckin(false)
    }
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
              <CardDescription>Customize your ThoughtFolio experience</CardDescription>
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

          {/* Focus Mode Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Focus className="h-5 w-5" />
                Focus Mode
              </CardTitle>
              <CardDescription>
                Control how many thoughts can be on your Active List
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Focus Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Focus Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, Active List is limited to 10 thoughts
                  </p>
                </div>
                <Button
                  variant={focusModeEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFocusModeToggle(!focusModeEnabled)}
                  disabled={isSavingFocusMode}
                >
                  {isSavingFocusMode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : focusModeEnabled ? (
                    "On"
                  ) : (
                    "Off"
                  )}
                </Button>
              </div>

              {/* Active List Limit Slider (only shown when Focus Mode is OFF) */}
              {!focusModeEnabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Active List Limit</Label>
                    <span className="text-sm font-medium">{activeListLimit} thoughts</span>
                  </div>
                  <Slider
                    value={[activeListLimit]}
                    min={10}
                    max={25}
                    step={1}
                    onValueChange={(value) => handleLimitChange(value[0])}
                    onValueCommit={handleLimitCommit}
                    disabled={isSavingLimit}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust how many thoughts can be on your Active List (10-25)
                  </p>
                </div>
              )}

              {/* Current Active List Count */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Active List</span>
                  <span className="font-medium">
                    {activeListCount} / {focusModeEnabled ? 10 : activeListLimit} thoughts
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Check-in Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Daily Check-in
              </CardTitle>
              <CardDescription>
                Manage your daily thought prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Today&apos;s Focus</Label>
                  <p className="text-sm text-muted-foreground">
                    When disabled, the Today&apos;s Focus card is hidden from your dashboard
                  </p>
                </div>
                <Button
                  variant={checkinEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCheckinToggle(!checkinEnabled)}
                  disabled={isSavingCheckin}
                >
                  {isSavingCheckin ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : checkinEnabled ? (
                    "On"
                  ) : (
                    "Off"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Card */}
          <AppearanceSettings />

          {/* Context Management */}
          <ContextSettings />

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
