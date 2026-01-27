import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMicrosoftAuthUrl, isMicrosoftConfigured } from "@/lib/calendar-microsoft"

/**
 * GET /api/calendar/microsoft/auth
 * Initiate Microsoft OAuth flow
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL))
  }

  // Check if Microsoft is configured
  if (!isMicrosoftConfigured()) {
    return NextResponse.json(
      {
        error: "Microsoft Calendar integration coming soon",
        message: "Azure AD credentials are not yet configured. Please check back later.",
      },
      { status: 503 }
    )
  }

  // Get authorization URL
  const authUrl = getMicrosoftAuthUrl()
  return NextResponse.redirect(authUrl)
}
