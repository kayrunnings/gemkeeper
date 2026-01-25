# Epic 8: Individual Gem Scheduling & Moments

## Epic Overview

This epic adds personalized scheduling and on-demand moment matching to ThoughtFolio. Users can set custom check-in times per gem and describe upcoming situations to receive AI-matched relevant gems.

**Status:** In Progress
**Linear:** Check "Kay's Personal Playground" workspace for detailed issues

---

## Goals

1. Let users control when each gem surfaces (individual scheduling)
2. Enable on-demand gem matching for upcoming situations (moments)
3. Integrate Google Calendar for context-aware suggestions
4. Create "prep cards" that help users apply wisdom to specific situations

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
- [ ] User can access scheduling from gem detail view
- [ ] Time picker allows selecting check-in time
- [ ] Day selector allows choosing specific days (M-Su)
- [ ] Toggle to enable/disable scheduling
- [ ] Settings persist to database
- [ ] Scheduled gems surface at designated times (via daily prompt logic)

**UI Notes:**
- Add "Schedule" option to gem actions menu
- Modal or slide-out panel for scheduling interface
- Show current schedule status on gem card (subtle indicator)

---

### US-8.2: Moments Entry

**As a user, I want to describe an upcoming situation so I can receive relevant gems to prepare for it.**

**Acceptance Criteria:**
- [ ] "New Moment" button accessible from main navigation
- [ ] Text field for describing the situation
- [ ] Optional date/time picker for when moment will occur
- [ ] Submit triggers AI matching
- [ ] Loading state while matching occurs

**UI Notes:**
- Modal entry preferred for quick capture
- Placeholder text: "Describe what's coming up... (e.g., 'difficult conversation with my manager about workload')"

---

### US-8.3: AI Gem Matching for Moments

**As a user, I want to see which of my gems are relevant to my described moment with explanations for each match.**

**Acceptance Criteria:**
- [ ] AI receives: user's active gems, moment description
- [ ] AI returns: ranked list of relevant gems with relevance explanation
- [ ] Handle case where no gems match
- [ ] Matching completes within 5 seconds

**Technical Notes:**
- Use Google Gemini API
- Prompt should emphasize practical application, not just semantic similarity
- Return top 3-5 matches with confidence/reasoning

---

### US-8.4: Prep Card Display

**As a user, I want to see my matched gems in a "prep card" format that helps me prepare for my moment.**

**Acceptance Criteria:**
- [ ] Display matched gems with relevance explanations
- [ ] Show moment description at top for context
- [ ] Show scheduled time if set
- [ ] Allow user to dismiss or save for later
- [ ] Link to view full gem details

**UI Notes:**
- Card-based layout
- Each gem shows: content excerpt, source, match reason
- Consider expandable sections for full content

---

### US-8.5: Moment Completion & Reflection

**As a user, I want to mark a moment as complete and optionally log a reflection.**

**Acceptance Criteria:**
- [ ] After scheduled time passes, prompt to mark complete
- [ ] Optional text field for reflection
- [ ] Reflection saved to moment record
- [ ] Completed moments move to history view

---

### US-8.6: Google Calendar Connection

**As a user, I want to connect my Google Calendar so ThoughtFolio can suggest relevant gems based on upcoming events.**

**Acceptance Criteria:**
- [ ] OAuth flow for Google Calendar
- [ ] User can select which calendar to sync
- [ ] Events synced to cache table
- [ ] User can disconnect calendar
- [ ] Clear privacy explanation before connecting

**Technical Notes:**
- OAuth credentials in Vercel env vars
- Token refresh handling required
- Respect user's calendar selection (don't sync all calendars without permission)

---

### US-8.7: Calendar-Aware Gem Suggestions

**As a user, I want ThoughtFolio to automatically suggest creating moments based on my upcoming calendar events.**

**Acceptance Criteria:**
- [ ] System scans cached events for upcoming "significant" events
- [ ] Suggests moments for events like: meetings, presentations, reviews
- [ ] User can accept/dismiss suggestions
- [ ] Suggestions appear in appropriate UI location (dashboard?)

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

## Open Questions

- [ ] Where should "New Moment" button live? (FAB? Nav? Dashboard?)
- [ ] How many moments can a user have active at once?
- [ ] Should calendar suggestions be opt-in or default?
- [ ] Notification strategy for scheduled gems (web-only for now, push later?)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code follows STANDARDS.md
- [ ] Changes tested in live app
- [ ] Linear issues updated
- [ ] Any new decisions logged in DECISIONS.md
