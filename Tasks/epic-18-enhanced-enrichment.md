# Epic 18: Enhanced Enrichment

## Overview

Make the enrichment system smarter, more personal, and available everywhere — not just for generic calendar event titles. Add always-available context input, enrichment for manual moments, personalized chip ordering, attendee-based learning, and non-destructive re-matching.

**Core Principle:** More context = better matches. Make it effortless to provide context, and the system will reward you with better thought surfacing.

**Depends on:** Epic 15 (foundation), builds on Epic 14 (existing enrichment)

---

## Current State

- Enrichment only triggers for generic titles or 0-match moments
- Manual moments skip enrichment entirely
- Context chips are in a fixed order (same for all users)
- Attendee pattern type exists in schema but is unused
- Re-matching after enrichment deletes all previous matches and starts fresh

---

## Stories

### 18.1 — Always-available "add context" on prep card

**Problem:** Enrichment currently only shows for generic titles or 0-match moments. A specific title like "Q4 Planning with Sarah" won't trigger enrichment, but adding "I want to discuss budget concerns" would dramatically improve matching.

**Acceptance Criteria:**
- [ ] Every prep card shows a persistent but subtle "Add context for better matches" link/button
- [ ] Shown below the moment title, always visible (not conditional on genericity)
- [ ] Tapping opens the `ContextEnrichmentPrompt` with chips and text input
- [ ] If context already exists, show "Update context" instead, pre-filled with existing context
- [ ] After submitting, re-runs matching with the enriched context (using merge logic from 18.5)
- [ ] The full-screen enrichment that auto-shows for generic titles/0 matches still works as before

**Files to modify:**
- `components/moments/PrepCard.tsx` (add always-visible context link)

**Effort:** S (1-2 hours)

---

### 18.2 — Enrichment for manual moments

**Problem:** When a user types a manual moment description like "preparing for a tough conversation," no event type detection or chip suggestions happen. Manual moments get worse matching than calendar moments.

**Acceptance Criteria:**
- [ ] In `MomentEntryModal.tsx`, run `analyzeEventTitle()` on the manual description text as the user types (debounced, 500ms)
- [ ] If an event type is detected, show relevant context chips below the text input
- [ ] User can select chips to enrich the description before creating the moment
- [ ] Combined description (text + chips) is sent to the API
- [ ] `detected_event_type` is set on the moment even for manual source
- [ ] The enrichment UI is optional — user can ignore chips and just submit their text

**Files to modify:**
- `components/moments/MomentEntryModal.tsx` (add inline enrichment for manual entry)
- May reuse parts of `ContextEnrichmentPrompt.tsx` or extract shared chip components

**Effort:** M (2-4 hours)

---

### 18.3 — Personalized chip ordering

**Problem:** Context chips are shown in a hardcoded order. A user who always selects "Career" and "Feedback" for 1:1s still sees them in the default position every time.

**Acceptance Criteria:**
- [ ] Track chip selections per user (new table `user_chip_preferences` or lightweight analytics in `moment_learnings`)
- [ ] Schema: `user_id, chip_label, selection_count, last_selected_at`
- [ ] When showing chips for an event type, sort by: user's selection count (desc) → then default order
- [ ] Users who've never selected chips see the default order (no cold-start issue)
- [ ] Chip selection tracking happens client-side on moment creation (fire-and-forget POST)
- [ ] No UI for managing chip preferences — this is automatic and invisible

**Database migration (Kay runs in Supabase):**
```sql
CREATE TABLE user_chip_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chip_label TEXT NOT NULL,
  event_type TEXT,  -- NULL means applies to all event types
  selection_count INTEGER DEFAULT 1,
  last_selected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chip_label, event_type)
);

ALTER TABLE user_chip_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chip preferences"
ON user_chip_preferences FOR ALL
USING (auth.uid() = user_id);
```

**Files to create:**
- `app/api/moments/chip-preferences/route.ts` (POST to record, GET to fetch)

**Files to modify:**
- `components/moments/ContextEnrichmentPrompt.tsx` (fetch and apply chip ordering)
- `lib/moments/title-analysis.ts` (accept custom ordering in chip functions)

**Effort:** M (2-4 hours)

---

### 18.4 — Attendee-based pattern learning

**Problem:** The `attendee` pattern type is defined in the learning schema but never populated. Users who consistently need "feedback" thoughts before meetings with their manager don't get that association learned.

**Acceptance Criteria:**
- [ ] Calendar event sync captures attendee emails from Google Calendar API response
- [ ] Store attendee emails in `calendar_events_cache` (new column: `attendees JSONB`)
- [ ] Privacy: store hashed emails (`SHA256(email)`) — not plaintext
- [ ] When recording helpful/not-helpful feedback, extract attendee patterns:
  - Pattern key: `attendee:SHA256(email)`
  - One learning record per attendee per gem
- [ ] `getLearnedThoughts()` includes attendee patterns when matching
- [ ] Attendee patterns have lower default weight than event_type patterns (they're noisier)

**Database migration:**
```sql
ALTER TABLE calendar_events_cache
ADD COLUMN attendees JSONB DEFAULT '[]';

-- attendees format: [{"email_hash": "abc123", "display_name": "John"}]
```

**Files to modify:**
- `lib/calendar.ts` (capture attendees during sync)
- `lib/moments/learning.ts` (add attendee pattern extraction in `recordHelpfulThought`)
- `types/calendar.ts` (add attendees to CalendarEvent type)

**Effort:** L (4-8 hours)

---

### 18.5 — Merge enrichment matches instead of replacing

**Problem:** The `/api/moments/{id}/enrich` endpoint deletes all previous `moment_gems` rows, then re-runs matching from scratch. Valid matches from the initial run can be lost.

**Acceptance Criteria:**
- [ ] On enrichment, keep existing `moment_gems` rows
- [ ] Run AI matching with the enriched context
- [ ] For each new match:
  - If `gem_id` already exists in `moment_gems` for this moment: keep the higher `relevance_score`, update `relevance_reason` if new score is higher
  - If `gem_id` is new: insert as normal
- [ ] Update `gems_matched_count` on the moment to reflect the merged total
- [ ] No duplicate `moment_gems` rows for the same moment + gem combination

**Files to modify:**
- `app/api/moments/[id]/enrich/route.ts` (merge logic instead of delete-and-reinsert)

**Effort:** S (1-2 hours)

---

## Definition of Done

- [ ] Stories 18.1, 18.2, and 18.5 complete (core enrichment improvements)
- [ ] Stories 18.3 and 18.4 complete (personalization)
- [ ] Enrichment is available on every prep card, not just generic titles
- [ ] Manual moments get the same enrichment quality as calendar moments
- [ ] Chip ordering improves over time based on user behavior
- [ ] Attendee patterns are learned and surfaced
- [ ] Re-matching preserves existing valid matches

---

## Relevant Existing Files

```
Components:
├── components/moments/ContextEnrichmentPrompt.tsx  (chip UI, enrichment form)
├── components/moments/PrepCard.tsx                  (shows enrichment conditionally)
├── components/moments/MomentEntryModal.tsx          (moment creation — no manual enrichment)

API Routes:
├── app/api/moments/[id]/enrich/route.ts             (enrichment endpoint — delete+reinsert)

Lib:
├── lib/moments/title-analysis.ts                    (event detection, chips, questions)
├── lib/moments/learning.ts                          (learning service — no attendee impl)
├── lib/types/learning.ts                            (PatternType includes 'attendee')
├── lib/calendar.ts                                  (sync — no attendee capture)

Types:
├── types/calendar.ts                                (CalendarEvent — no attendees field)
```
