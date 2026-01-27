import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleMicrosoftCallback, isMicrosoftConfigured } from "@/lib/calendar-microsoft"

/**
 * GET /api/calendar/microsoft/callback
 * Handle Microsoft OAuth callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Check for OAuth errors
  if (error) {
    console.error("Microsoft OAuth error:", error, errorDescription)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(errorDescription || "OAuth authorization failed")}`, appUrl)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=No+authorization+code+received", appUrl)
    )
  }

  // Check if Microsoft is configured
  if (!isMicrosoftConfigured()) {
    return NextResponse.redirect(
      new URL("/settings?error=Microsoft+Calendar+integration+coming+soon", appUrl)
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl))
  }

  // Exchange code for tokens
  const redirectUri = `${appUrl}/api/calendar/microsoft/callback`
  const result = await handleMicrosoftCallback(code, redirectUri)

  if (result.error || !result.accessToken) {
    console.error("Microsoft token exchange error:", result.error)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(result.error || "Failed to connect Microsoft Calendar")}`, appUrl)
    )
  }

  // Store the connection in the database
  // Note: This is a placeholder - actual implementation would store the tokens
  const { error: dbError } = await supabase
    .from("calendar_connections")
    .insert({
      user_id: user.id,
      provider: "microsoft",
      email: result.email,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      token_expires_at: result.expiresAt?.toISOString(),
      is_active: true,
      auto_moment_enabled: true,
      lead_time_minutes: 30,
      event_filter: "all",
      custom_keywords: [],
    })

  if (dbError) {
    console.error("Database error storing Microsoft connection:", dbError)
    return NextResponse.redirect(
      new URL("/settings?error=Failed+to+save+calendar+connection", appUrl)
    )
  }

  return NextResponse.redirect(
    new URL("/settings?success=Microsoft+Calendar+connected+successfully", appUrl)
  )
}
