import { redirect } from "next/navigation"

/**
 * Daily Prompt page - now redirects to the unified Daily Check-in
 *
 * Previously, this was a separate "morning prompt" that asked "Will you apply this today?"
 * This has been merged with the evening check-in into a single "Daily Check-in" at /checkin
 *
 * See DECISIONS.md for rationale on this simplification.
 */
export default function DailyPage() {
  redirect("/checkin")
}
