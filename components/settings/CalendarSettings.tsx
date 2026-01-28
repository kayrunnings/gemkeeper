"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Loader2,
  Clock,
} from "lucide-react"
import type { CalendarConnection } from "@/types/calendar"
import { LEAD_TIME_OPTIONS, EVENT_FILTER_OPTIONS } from "@/types/calendar"
import {
  getCalendarConnections,
  disconnectCalendar,
  updateCalendarSettings,
  syncCalendarEvents,
} from "@/lib/calendar-client"
import { useToast } from "@/components/error-toast"

interface CalendarSettingsProps {
  className?: string
}

export function CalendarSettings({ className }: CalendarSettingsProps) {
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null)
  const [customKeyword, setCustomKeyword] = useState("")
  const { showInfo, showSuccess, showError } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  const loadConnections = useCallback(async () => {
    setIsLoading(true)
    const { connections: conns } = await getCalendarConnections()
    setConnections(conns)
    setIsLoading(false)
    return conns
  }, [])

  // Handle OAuth redirect results
  useEffect(() => {
    const connected = searchParams.get("calendar_connected")
    const error = searchParams.get("calendar_error")

    if (connected === "true") {
      showSuccess("Google Calendar connected!", "Your calendar is now linked. Syncing events...")
      // Remove the query param from URL without page reload
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("calendar_connected")
      window.history.replaceState({}, "", newUrl.toString())

      // Reload connections and trigger initial sync
      loadConnections().then((conns) => {
        const googleConn = conns.find((c) => c.provider === "google")
        if (googleConn) {
          setIsSyncing(googleConn.id)
          syncCalendarEvents(googleConn.id).then(() => {
            loadConnections()
            setIsSyncing(null)
            showSuccess("Calendar synced!", "Your upcoming events are now available.")
          })
        }
      })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_tokens: "Failed to get authorization tokens from Google.",
        no_email: "Could not retrieve email from your Google account.",
        db_error: "Failed to save calendar connection.",
        oauth_failed: "OAuth authorization failed.",
        access_denied: "You denied access to your calendar.",
      }
      showError(errorMessages[error] || `Calendar connection failed: ${error}`)
      // Remove the query param from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("calendar_error")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams, loadConnections, showSuccess, showError])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = "/api/auth/google-calendar"
  }

  const handleDisconnect = async (connectionId: string) => {
    setIsDisconnecting(connectionId)
    const { error } = await disconnectCalendar(connectionId)
    if (!error) {
      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
    }
    setIsDisconnecting(null)
  }

  const handleSync = async (connectionId: string) => {
    setIsSyncing(connectionId)
    await syncCalendarEvents(connectionId)
    await loadConnections()
    setIsSyncing(null)
  }

  const handleSettingChange = async (
    connectionId: string,
    setting: keyof Parameters<typeof updateCalendarSettings>[1],
    value: unknown
  ) => {
    await updateCalendarSettings(connectionId, { [setting]: value })
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, [setting]: value } : c
      )
    )
  }

  const handleAddKeyword = async (connectionId: string) => {
    if (!customKeyword.trim()) return
    const conn = connections.find((c) => c.id === connectionId)
    if (!conn) return

    const newKeywords = [...(conn.custom_keywords || []), customKeyword.trim()]
    await handleSettingChange(connectionId, "custom_keywords", newKeywords)
    setCustomKeyword("")
  }

  const handleRemoveKeyword = async (connectionId: string, keyword: string) => {
    const conn = connections.find((c) => c.id === connectionId)
    if (!conn) return

    const newKeywords = conn.custom_keywords.filter((k) => k !== keyword)
    await handleSettingChange(connectionId, "custom_keywords", newKeywords)
  }

  const formatLastSync = (dateString: string | null): string => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const googleConnection = connections.find((c) => c.provider === "google")

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your calendar to automatically prepare for upcoming events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Calendar Connection */}
        {googleConnection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    {googleConnection.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSync(googleConnection.id)}
                  disabled={isSyncing === googleConnection.id}
                  title="Sync now"
                >
                  {isSyncing === googleConnection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDisconnect(googleConnection.id)}
                  disabled={isDisconnecting === googleConnection.id}
                  title="Disconnect"
                >
                  {isDisconnecting === googleConnection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Sync status */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {googleConnection.sync_error ? (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">
                    {typeof googleConnection.sync_error === 'string' 
                      ? googleConnection.sync_error 
                      : 'Sync error occurred. Please try again.'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Last sync: {formatLastSync(googleConnection.last_sync_at)}</span>
                </>
              )}
            </div>

            {/* Auto-moment toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-prepare for events</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically surface gems before calendar events
                </p>
              </div>
              <Button
                variant={googleConnection.auto_moment_enabled ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  handleSettingChange(
                    googleConnection.id,
                    "auto_moment_enabled",
                    !googleConnection.auto_moment_enabled
                  )
                }
              >
                {googleConnection.auto_moment_enabled ? "On" : "Off"}
              </Button>
            </div>

            {googleConnection.auto_moment_enabled && (
              <>
                {/* Lead time */}
                <div className="space-y-2">
                  <Label>Prepare how far in advance?</Label>
                  <div className="flex gap-2 flex-wrap">
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={
                          googleConnection.lead_time_minutes === opt.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleSettingChange(
                            googleConnection.id,
                            "lead_time_minutes",
                            opt.value
                          )
                        }
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Event filter */}
                <div className="space-y-2">
                  <Label>Which events to prepare for?</Label>
                  <div className="flex gap-2 flex-wrap">
                    {EVENT_FILTER_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={
                          googleConnection.event_filter === opt.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleSettingChange(
                            googleConnection.id,
                            "event_filter",
                            opt.value
                          )
                        }
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom keywords */}
                {googleConnection.event_filter === "custom" && (
                  <div className="space-y-2">
                    <Label>Keywords to match</Label>
                    <div className="flex gap-2">
                      <Input
                        value={customKeyword}
                        onChange={(e) => setCustomKeyword(e.target.value)}
                        placeholder="e.g., 1:1, standup"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddKeyword(googleConnection.id)
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleAddKeyword(googleConnection.id)}
                        disabled={!customKeyword.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {googleConnection.custom_keywords?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {googleConnection.custom_keywords.map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-destructive/10"
                            onClick={() =>
                              handleRemoveKeyword(googleConnection.id, kw)
                            }
                          >
                            {kw}
                            <Trash2 className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <Button onClick={handleConnect} className="w-full gap-2">
            <Calendar className="h-4 w-4" />
            Connect Google Calendar
          </Button>
        )}

        {/* Microsoft Calendar Section */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Microsoft Outlook</p>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your Microsoft 365 calendar
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-3 gap-2"
            onClick={() => {
              showInfo(
                "Microsoft Calendar integration coming soon",
                "We're working on adding Microsoft Outlook calendar support. Stay tuned!"
              )
            }}
          >
            <Calendar className="h-4 w-4" />
            Connect Microsoft Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
