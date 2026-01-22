import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  )
}

// GET: Start OAuth flow or handle callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // Handle OAuth callback
  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const oauth2Client = getGoogleOAuth2Client()
      const { tokens } = await oauth2Client.getToken(code)

      if (!tokens.access_token || !tokens.refresh_token) {
        return NextResponse.redirect(
          new URL("/settings?calendar_error=no_tokens", request.url)
        )
      }

      // Get user email from Google
      oauth2Client.setCredentials(tokens)
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
      const userInfo = await oauth2.userinfo.get()
      const email = userInfo.data.email

      if (!email) {
        return NextResponse.redirect(
          new URL("/settings?calendar_error=no_email", request.url)
        )
      }

      // Store connection in database
      const { error: dbError } = await supabase
        .from("calendar_connections")
        .upsert(
          {
            user_id: user.id,
            provider: "google",
            email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(
              tokens.expiry_date || Date.now() + 3600000
            ).toISOString(),
            is_active: true,
            auto_moment_enabled: true,
            lead_time_minutes: 30,
            event_filter: "all",
            custom_keywords: [],
          },
          {
            onConflict: "user_id,provider",
          }
        )

      if (dbError) {
        console.error("Database error:", dbError)
        return NextResponse.redirect(
          new URL("/settings?calendar_error=db_error", request.url)
        )
      }

      return NextResponse.redirect(
        new URL("/settings?calendar_connected=true", request.url)
      )
    } catch (err) {
      console.error("OAuth callback error:", err)
      return NextResponse.redirect(
        new URL("/settings?calendar_error=oauth_failed", request.url)
      )
    }
  }

  // Handle OAuth error
  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${error}`, request.url)
    )
  }

  // Start OAuth flow
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const oauth2Client = getGoogleOAuth2Client()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })

  return NextResponse.redirect(authUrl)
}
