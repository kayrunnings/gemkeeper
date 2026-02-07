# Epic 16: Reliable Calendar Sync

## Overview

Move calendar sync from a client-side polling loop to a server-side scheduled job, so moments are created reliably regardless of whether the user has the app open. Add catch-up logic and sync health visibility.

**Core Principle:** The system should work for you even when you're not looking at it. Moments should be ready before your meeting, every time.

**Depends on:** Epic 15 (consolidated moment creation service)

---

## Current State

- Calendar sync runs via `useCalendarAutoSync` hook — client-side `setInterval(60s)`
- If the user closes the app, no syncing happens and lead-time windows are missed
- No visibility into sync health (last sync time, errors)
- No catch-up mechanism when user returns after being away
- Google Calendar webhook support not implemented (polling only)

---

## Stories

### 16.1 — Server-side calendar sync via cron

**Problem:** `useCalendarAutoSync` runs in the browser. If the user closes the tab before a meeting, the moment for that meeting never gets created.

**Acceptance Criteria:**
- [ ] New API route: `app/api/cron/calendar-sync/route.ts`
- [ ] Iterates all active `calendar_connections` where `now >= last_sync_at + sync_frequency_minutes`
- [ ] For each: syncs events from Google Calendar API, upserts to `calendar_events_cache`
- [ ] After sync: checks for events within each user's `lead_time_minutes` and creates moments
- [ ] Uses the consolidated `createMomentWithMatching()` from Epic 15.5
- [ ] Protected by a cron secret/auth token (not publicly callable)
- [ ] Configured to run every 10 minutes via Vercel Cron (`vercel.json`) or Supabase Edge Function
- [ ] `useCalendarAutoSync` demoted to a "best-effort supplement" — still runs but cron is the primary driver
- [ ] Handles token refresh for expired OAuth tokens

**Technical Notes:**
- Vercel Cron: add to `vercel.json` under `crons` array
- Alternative: Supabase `pg_cron` extension calling an edge function
- Must handle: token refresh, rate limits, partial failures (one user's sync failing shouldn't block others)
- Consider batching: process N users per invocation if user count grows

**Files to create:**
- `app/api/cron/calendar-sync/route.ts`

**Files to modify:**
- `vercel.json` (add cron schedule)
- `lib/hooks/useCalendarAutoSync.ts` (reduce to supplement role)
- `lib/calendar.ts` or new server-side calendar sync module

**Effort:** L (4-8 hours)

---

### 16.2 — Catch-up check on app load

**Problem:** When the user opens the app after being away, events that entered and possibly passed through the lead-time window are missed. No backfill happens.

**Acceptance Criteria:**
- [ ] On app load (in `useCalendarAutoSync` or a new hook), check for events that should have had moments created since `last_sync_at`
- [ ] For events still in the future: create moments immediately
- [ ] For events that already started but are still ongoing (within 1 hour of start): create moments with a "late prep" indicator
- [ ] For events already completed: skip (don't create stale moments)
- [ ] Show a brief toast if catch-up created moments: "Created N moment(s) for upcoming events"

**Files to modify:**
- `lib/hooks/useCalendarAutoSync.ts` (add catch-up logic on mount)
- Potentially `lib/calendar-sync.ts` (expand `checkForUpcomingEvents` to handle catch-up window)

**Effort:** M (2-4 hours)

---

### 16.3 — Sync health indicator on Apply quadrant

**Problem:** Users have no visibility into whether their calendar is syncing correctly. Sync errors are silent.

**Acceptance Criteria:**
- [ ] Apply quadrant shows subtle sync status below the upcoming moments section
- [ ] States:
  - "Synced N min ago" — normal, muted text
  - "Syncing..." — during active sync, with spinner
  - "Sync error — tap to retry" — if `sync_error` is set on the connection
  - "Calendar not connected" — if no active connection (already handled by empty state)
- [ ] Tapping the sync status triggers a manual sync
- [ ] After manual sync, status updates to show new sync time

**Files to modify:**
- `components/home/ApplyQuadrant.tsx` (add sync status display)
- May need to pass `lastSyncAt` / `syncError` as props from homepage

**Effort:** S (1-2 hours)

---

### 16.4 — Google Calendar push notifications (webhook)

**Problem:** Polling every 10 minutes means up to 10 minutes of delay before new/changed events are reflected. Google Calendar supports push notifications for real-time updates.

**Prerequisites:** Requires a publicly accessible webhook endpoint and a Google Cloud project configured for push notifications.

**Acceptance Criteria:**
- [ ] New API route: `app/api/webhooks/google-calendar/route.ts`
- [ ] On calendar connection, register a webhook channel with Google Calendar API
- [ ] Webhook receives event create/update/delete notifications
- [ ] On notification: trigger targeted sync for just the affected calendar
- [ ] Handle channel expiration and renewal (channels expire after ~7 days)
- [ ] Verify webhook authenticity (Google sends a token)
- [ ] Graceful fallback: if webhook registration fails, polling continues as normal

**Technical Notes:**
- Google Calendar API: `watch` method on `events` resource
- Requires HTTPS endpoint accessible from Google
- Notification payload is minimal — just tells you "something changed", not what
- Still need to call `events.list` to get actual changes (use `syncToken` for incremental sync)

**Files to create:**
- `app/api/webhooks/google-calendar/route.ts`

**Files to modify:**
- `lib/calendar.ts` (add channel registration, sync token support)
- Calendar connection flow (register webhook on connect)

**Effort:** XL (1-2 days) — defer to Phase 3

---

## Definition of Done

- [ ] Stories 16.1 and 16.2 complete (minimum for reliability)
- [ ] Story 16.3 complete (user visibility)
- [ ] Moments are created for upcoming events even when the app is closed
- [ ] Calendar sync errors are visible to the user
- [ ] No regression in existing calendar functionality
- [ ] Story 16.4 tracked for future implementation

---

## Relevant Existing Files

```
Core:
├── lib/calendar.ts                          (Google Calendar API integration)
├── lib/calendar-sync.ts                     (moment creation from events)
├── lib/calendar-client.ts                   (client-side sync wrapper)
├── lib/hooks/useCalendarAutoSync.ts         (browser-based polling)

API Routes:
├── app/api/calendar/sync/route.ts           (manual sync trigger)
├── app/api/calendar/check-moments/route.ts  (check for events needing moments)

Settings:
├── components/settings/CalendarSettings.tsx  (connection UI)

Types:
├── types/calendar.ts                        (calendar type definitions)
```
