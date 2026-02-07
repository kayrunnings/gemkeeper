# Epic 17: Smarter Apply Quadrant

## Overview

Make the Apply quadrant the most valuable card on the homepage by improving how moments surface alongside the daily thought. Show calendar events that don't have moments yet, add urgency indicators, match quality badges, and inline previews.

**Core Principle:** The Apply quadrant tells the user "here's what to focus on right now." It should surface the most actionable information at a glance.

**Depends on:** Epic 15 (dead code removal, status filtering)

---

## Current State

- Apply quadrant shows: daily thought (check-in) + up to 2 upcoming moments
- Only shows moments that already exist — calendar events without moments are invisible
- No distinction between imminent and distant events
- No indication of match quality (0 matches vs 5 matches look the same)
- Must navigate to full prep card to see any matched thoughts
- The dead `UpcomingMomentsCard` had useful features (event cache lookup, on-demand creation) that aren't in `ApplyQuadrant`

---

## Stories

### 17.1 — Show un-momentified calendar events in Apply quadrant

**Problem:** The Apply quadrant only shows moments that already exist. Calendar events without moments are invisible until the auto-sync creates them (which may be late or never if sync is broken).

**Acceptance Criteria:**
- [x] ApplyQuadrant fetches upcoming events from `calendar_events_cache` (next 24 hours)
- [x] Events where `moment_created = false` are shown with a "Tap to prepare" affordance
- [x] Tapping creates a moment on-demand via `/api/moments/from-event` and navigates to prep card
- [x] Events with existing moments still navigate directly to the prep card
- [x] Combined list (moments + un-momentified events) sorted by event start time
- [x] Total display capped at 3 items (shared space with daily thought)
- [x] Loading state while creating moment on-demand

**Migration note:** Port the best logic from `UpcomingMomentsCard` (the `handleEventClick` and event fetching) into `ApplyQuadrant` before deleting the dead component in Epic 15.4. Alternatively, complete 15.4 first and reimplement cleanly.

**Files to modify:**
- `components/home/ApplyQuadrant.tsx` (add event cache fetching, on-demand creation)
- `app/home/page.tsx` (pass `calendarConnected` prop if not already, pass additional data)

**Effort:** M (2-4 hours)

---

### 17.2 — Urgency-aware moment display

**Problem:** All moments look the same regardless of how soon the event is. A meeting in 10 minutes should feel different from one tomorrow.

**Acceptance Criteria:**
- [x] Events < 30 min away: amber highlight with pulsing dot and left-border accent
- [x] Events 30 min – 2 hours away: normal display with time distance badge
- [x] Events 2+ hours away: compact single-line row with formatted date
- [x] Visual hierarchy makes the most urgent item immediately obvious

**Design Notes:**
- Use the existing amber-500 color palette from the Apply quadrant
- Imminent events could use a subtle glow or left-border accent
- Don't make it noisy — urgency should be calm but clear

**Files to modify:**
- `components/home/ApplyQuadrant.tsx` (conditional styling based on time-to-event)

**Effort:** S (1-2 hours)

---

### 17.3 — Match quality indicators at a glance

**Problem:** A moment with 0 matches (needs context) looks identical to one with 4 high-relevance matches (well-prepared). Users have no motivation to enrich moments.

**Acceptance Criteria:**
- [x] 0 matches: "Needs context" badge (muted)
- [x] 1-2 matches: Show match count
- [x] 3+ matches: "Ready" badge with green accent
- [x] Un-momentified events: "Tap to prepare" badge in blue
- [x] Badge is visible on the moment row in the Apply quadrant

**Files to modify:**
- `components/home/ApplyQuadrant.tsx` (add quality badges to moment rows)

**Effort:** S (1-2 hours)

---

### 17.4 — Inline thought preview on tap/expand

**Problem:** To see any matched thoughts, users must navigate to the full prep card. For a quick glance before a meeting, this is too much friction.

**Acceptance Criteria:**
- [ ] First tap on a moment in the Apply quadrant expands it in-place
- [ ] Expanded view shows the top 1-2 matched thoughts (content only, truncated)
- [ ] Shows relevance indicator (colored dot)
- [ ] "View all" link navigates to full prep card
- [ ] Second tap or tap elsewhere collapses back
- [ ] Animation: smooth expand/collapse (200ms)
- [ ] If 0 matches, expanded view shows "Add context to find thoughts" with action button

**Technical Notes:**
- Moments in the Apply quadrant currently don't have `matched_thoughts` data — just `gems_matched_count`
- Need to either:
  - (a) Fetch full moment data including thoughts when expanding (lazy load)
  - (b) Pre-fetch top 2 thoughts for each moment on homepage load
- Option (a) is better for performance, option (b) is better for responsiveness
- Consider: fetch on homepage load but only the top 2 thoughts per moment

**Files to modify:**
- `components/home/ApplyQuadrant.tsx` (expandable rows, thought preview)
- `lib/moments.ts` or new function (fetch top N thoughts for a moment)
- `app/home/page.tsx` (pre-fetch thought previews, or provide fetch function as prop)

**Effort:** M (2-4 hours)

---

## Definition of Done

- [ ] Stories 17.1-17.3 complete (core improvements)
- [ ] Story 17.4 complete (polish)
- [ ] Apply quadrant shows both moments and un-momentified calendar events
- [ ] Urgency is visually clear at a glance
- [ ] Match quality encourages engagement with enrichment
- [ ] Four-quadrant homepage layout preserved (Capture → Grow → Apply → Track)
- [ ] Mobile responsive

---

## Relevant Existing Files

```
Components:
├── components/home/ApplyQuadrant.tsx         (main target)
├── components/home/HomeQuadrant.tsx           (shared quadrant wrapper)
├── components/home/UpcomingMomentsCard.tsx    (dead — has useful patterns to port)

Pages:
├── app/home/page.tsx                         (data fetching, props)

Lib:
├── lib/moments.ts                            (getRecentMoments, getMoment)
├── types/moments.ts                          (Moment, MomentWithThoughts)
```
