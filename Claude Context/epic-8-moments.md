# Epic 8: Individual Gem Scheduling & Moments

## Epic Overview

This epic adds personalized scheduling and on-demand moment matching to ThoughtFolio. Users can set custom check-in times per gem and describe upcoming situations to receive AI-matched relevant gems.

**Status:** COMPLETED (January 2026)
**Linear:** Check "Kay's Personal Playground" workspace for detailed issues

---

## Goals

1. Let users control when each gem surfaces (individual scheduling)
2. Enable on-demand gem matching for upcoming situations (moments)
3. Integrate Google Calendar for context-aware suggestions
4. Create "prep cards" that help users apply knowledge to specific situations

---

## Database Schema

Schema has been deployed to Supabase. Reference tables:

### `gem_schedules`
```sql
CREATE TABLE gem_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gem_id UUID REFERENCES gems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_time TIME,
  check_in_days TEXT[], -- ['monday', 'wednesday', 'friday']
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `moments`
```sql
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  matched_gem_ids UUID[],
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `calendar_connections`
```sql
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'google_calendar',
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `calendar_event_cache`
```sql
CREATE TABLE calendar_event_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE,
  event_id TEXT,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## User Stories

### US-8.1: Individual Gem Scheduling

**As a user, I want to set a custom check-in time for each gem so I receive it when it's most relevant to my day.**

**Acceptance Criteria:**
- [x] User can access scheduling from gem detail view
- [x] Time picker allows selecting check-in time
- [x] Day selector allows choosing specific days (M-Su)
- [x] Toggle to enable/disable scheduling
- [x] Settings persist to database
- [x] Scheduled gems surface at designated times (via daily prompt logic)

**UI Notes:**
- Add "Schedule" option to gem actions menu
- Modal or slide-out panel for scheduling interface
- Show current schedule status on gem card (subtle indicator)

---

### US-8.2: Moments Entry

**As a user, I want to describe an upcoming situation so I can receive relevant gems to prepare for it.**

**Acceptance Criteria:**
- [x] "New Moment" button accessible from main navigation
- [x] Text field for describing the situation
- [x] Optional date/time picker for when moment will occur
- [x] Submit triggers AI matching
- [x] Loading state while matching occurs

**UI Notes:**
- Modal entry preferred for quick capture
- Placeholder text: "Describe what's coming up... (e.g., 'difficult conversation with my manager about workload')"

---

### US-8.3: AI Gem Matching for Moments

**As a user, I want to see which of my gems are relevant to my described moment with explanations for each match.**

**Acceptance Criteria:**
- [x] AI receives: user's active gems, moment description
- [x] AI returns: ranked list of relevant gems with relevance explanation
- [x] Handle case where no gems match
- [x] Matching completes within 5 seconds

**Technical Notes:**
- Use Google Gemini API
- Prompt should emphasize practical application, not just semantic similarity
- Return top 3-5 matches with confidence/reasoning

---

### US-8.4: Prep Card Display

**As a user, I want to see my matched gems in a "prep card" format that helps me prepare for my moment.**

**Acceptance Criteria:**
- [x] Display matched gems with relevance explanations
- [x] Show moment description at top for context
- [x] Show scheduled time if set
- [x] Allow user to dismiss or save for later
- [x] Link to view full gem details

**UI Notes:**
- Card-based layout
- Each gem shows: content excerpt, source, match reason
- Consider expandable sections for full content

---

### US-8.5: Moment Completion & Reflection

**As a user, I want to mark a moment as complete and optionally log a reflection.**

**Acceptance Criteria:**
- [x] After scheduled time passes, prompt to mark complete
- [x] Optional text field for reflection
- [x] Reflection saved to moment record
- [x] Completed moments move to history view

---

### US-8.6: Google Calendar Connection

**As a user, I want to connect my Google Calendar so ThoughtFolio can suggest relevant gems based on upcoming events.**

**Acceptance Criteria:**
- [x] OAuth flow for Google Calendar
- [x] User can select which calendar to sync
- [x] Events synced to cache table
- [x] User can disconnect calendar
- [x] Clear privacy explanation before connecting

**Technical Notes:**
- OAuth credentials in Vercel env vars
- Token refresh handling required
- Respect user's calendar selection (don't sync all calendars without permission)

---

### US-8.7: Calendar-Aware Gem Suggestions

**As a user, I want ThoughtFolio to automatically suggest creating moments based on my upcoming calendar events.**

**Acceptance Criteria:**
- [x] System scans cached events for upcoming "significant" events
- [x] Suggests moments for events like: meetings, presentations, reviews
- [x] User can accept/dismiss suggestions
- [x] Suggestions appear in appropriate UI location (dashboard?)

**Technical Notes:**
- Define "significant" events (title keywords, duration, etc.)
- Don't over-suggest — quality over quantity
- Consider time-of-day for suggestions (morning for day's events)

---

## Implementation Order

Recommended sequence:

1. **US-8.1** - Individual Gem Scheduling (foundational)
2. **US-8.2** - Moments Entry (core feature)
3. **US-8.3** - AI Gem Matching (core feature)
4. **US-8.4** - Prep Card Display (depends on 8.2, 8.3)
5. **US-8.5** - Moment Completion (depends on 8.4)
6. **US-8.6** - Google Calendar Connection (can be parallel)
7. **US-8.7** - Calendar-Aware Suggestions (depends on 8.6)

---

## Open Questions (Resolved)

- [x] Where should "New Moment" button live? → FAB (floating action button) on mobile, sidebar on desktop
- [x] How many moments can a user have active at once? → No hard limit
- [x] Should calendar suggestions be opt-in or default? → Opt-in via Settings
- [x] Notification strategy for scheduled gems → Web-only for now (push notifications deferred to mobile app)

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Code follows STANDARDS.md
- [x] Changes tested in live app
- [x] Linear issues updated
- [x] Any new decisions logged in DECISIONS.md

---

## Completion Notes

Epic 8 was completed in January 2026. Key implementations:
- Individual scheduling with cron expressions and NLP parsing
- Moments feature with AI matching using Gemini API
- Google Calendar OAuth integration with token refresh
- Auto-moment creation from calendar events
- Prep card display with relevance explanations
- Moment history and completion tracking

---

## Bug Fixes

### January 2026: Calendar Sync Not Creating Moments

**Issue:** Calendar events were synced to `calendar_events_cache` but no moments were being created, causing "No calendar moments found" in the UI.

**Root Cause:** The `checkForUpcomingEvents()` function in `lib/calendar-sync.ts` was never called after `syncCalendarEvents()`. This function is responsible for converting cached calendar events into actual moments.

**Fix:** Updated `components/settings/CalendarSettings.tsx` to call `checkForUpcomingEvents()` after every calendar sync (both initial OAuth connection and manual sync).

**Key Lesson:** Calendar sync is a two-step process:
1. `syncCalendarEvents()` — Caches events from Google Calendar
2. `checkForUpcomingEvents()` — Creates moments from cached events

Both steps must execute for calendar moments to appear.

---

### January 2026: Calendar Moments Missing AI Matching

**Issue:** Calendar-imported moments showed up on the dashboard but:
1. Users couldn't get relevant thoughts to apply (showed "No thoughts matched this moment")
2. The `gems_matched_count` was always 0

**Root Cause:** The `/api/calendar/check-moments/route.ts` endpoint created moments but completely skipped AI matching. It only inserted the moment with `gems_matched_count: 0` and never:
1. Fetched user's thoughts (active and passive)
2. Called the AI matching service (`matchGemsToMoment`)
3. Inserted matched thoughts into `moment_gems` table

Compare this to `/api/moments/route.ts` (for manual moments) which did all these steps.

**Fix:** Updated `/api/calendar/check-moments/route.ts` to:
1. Fetch all thoughts with `status IN ('active', 'passive')` before processing events
2. For each calendar event, call `matchGemsToMoment()` with the event title
3. Insert matched thoughts into `moment_gems` table
4. Update moment with `gems_matched_count` and `ai_processing_time_ms`

**Additional Improvements:**
- Enhanced PrepCard to display linked notes with matched thoughts
- Added icons (BookOpen, FileText) for source and notes visual indicators
- Prepare page now fetches linked notes via `note_thought_links` table

**Key Lesson:** When implementing a feature through multiple code paths (manual moments via `/api/moments` vs calendar moments via `/api/calendar/check-moments`), ensure all paths include the same critical functionality. AI matching is essential for moments to provide value.
