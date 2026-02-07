# Epic 19: Moments Stickiness & Habit Loop

## Overview

Create retention mechanics that make moments a daily habit users depend on. Close the feedback loop with post-event reflections, connect moments to gem graduation, add practical utilities (export, templates), surface insights, and bring users back with notifications.

**Core Principle:** Moments should be the reason users open the app. The habit loop: prepare → experience → reflect → see the system get smarter → prepare again.

**Depends on:** Epic 15 (foundation), Epic 16 (reliable sync), Epic 17 (better quadrant)

---

## Current State

- No post-event follow-up — once the event starts, the moment is abandoned
- Moments don't affect gem lifecycle (no connection to graduation system)
- No way to export or share prep cards
- No templates for common manual moment types
- No analytics or recap for moments
- No push or email notifications

---

## Stories

### 19.1 — Post-event reflection prompt

**Problem:** Users mark thoughts as "Got it" before the event, but there's no follow-up to check if those thoughts actually helped in practice. Pre-event feedback is aspirational; post-event reflection is ground truth.

**Acceptance Criteria:**
- [ ] After a moment's `calendar_event_start` + estimated duration (or + 1 hour if no end time), show a reflection prompt
- [ ] Reflection prompt appears:
  - As a card in the Apply quadrant: "How did [event title] go?"
  - As a banner notification if user opens app within 2 hours of event end
- [ ] Reflection UI (new component or inline in Apply quadrant):
  - Quick overall rating: thumbs up / thumbs down / neutral
  - "Which thoughts actually helped?" — re-show matched thoughts with confirm/revise option
  - Optional text: "Anything you want to remember for next time?" (captured as a new gem)
- [ ] Reflection data stored on the moment:
  - New columns: `reflection_rating`, `reflection_note`, `reflected_at`
  - New status: `reflected` (after `completed`)
- [ ] Reflection feedback overwrites pre-event "got it" data when the user revises
- [ ] The learning system receives the post-event signal (stronger signal than pre-event "got it")
- [ ] Moments without reflection after 24 hours are auto-dismissed (don't pile up)

**Database migration:**
```sql
ALTER TABLE moments
ADD COLUMN reflection_rating TEXT CHECK (reflection_rating IN ('positive', 'negative', 'neutral')),
ADD COLUMN reflection_note TEXT,
ADD COLUMN reflected_at TIMESTAMPTZ;

-- Update status CHECK constraint to include 'reflected'
-- (or handle in application code if CHECK is too restrictive)
```

**Files to create:**
- `components/moments/ReflectionPrompt.tsx`
- `app/api/moments/[id]/reflect/route.ts`

**Files to modify:**
- `components/home/ApplyQuadrant.tsx` (show reflection cards for past events)
- `types/moments.ts` (add reflection fields, update MomentStatus)
- `lib/moments/learning.ts` (weight post-event signals higher)
- `app/home/page.tsx` (fetch moments needing reflection)

**Effort:** L (4-8 hours)

---

### 19.2 — Connect moments to gem graduation

**Problem:** Gems graduate after 5 "applications" (daily check-ins). Moments surface gems in real-world situations, but marking a gem as helpful in a moment doesn't count toward graduation. The two systems are disconnected.

**Acceptance Criteria:**
- [ ] When a gem is marked "Got it" (helpful) in a moment, increment its `application_count` by 1
- [ ] This counts toward the graduation threshold (currently 5)
- [ ] If `application_count` reaches the threshold, the gem graduates (status → 'graduated')
- [ ] Graduation from moments triggers the same celebration/notification as graduation from check-ins
- [ ] The graduation progress bar on the Apply quadrant's daily thought reflects moment applications
- [ ] A gem can graduate through any combination of check-ins and moment applications
- [ ] Post-event reflection confirmations (Story 19.1) also count as applications (but don't double-count with pre-event "got it")

**Files to modify:**
- `components/moments/PrepCard.tsx` (`handleGotIt` — also increment `application_count`)
- `lib/thoughts.ts` or relevant gem update function (increment application count)
- `app/api/moments/learn/helpful/route.ts` (trigger application increment server-side)

**Effort:** M (2-4 hours)

---

### 19.3 — Prep card export / copy-to-clipboard

**Problem:** Users can't take their prep notes out of the app. Before a meeting, they might want a clean list to reference on their phone or paste into a notes app.

**Acceptance Criteria:**
- [ ] "Copy prep notes" button on the PrepCard (top-right, near the back button)
- [ ] Copies a formatted text block to clipboard:
  ```
  Preparing for: [Event Title]
  Context: [User context if provided]

  Thoughts to remember:
  - [Thought content] (Why: [relevance reason])
  - [Thought content] (Why: [relevance reason])
  ```
- [ ] Show brief toast: "Prep notes copied!"
- [ ] Optional: "Share" button using Web Share API (mobile) — shares as text
- [ ] Works with 0 matches (just copies the title and context)

**Files to modify:**
- `components/moments/PrepCard.tsx` (add export button and formatting logic)

**Effort:** S (1-2 hours)

---

### 19.4 — Moment templates for manual creation

**Problem:** Users who don't connect their calendar have higher friction creating moments. They type free-form descriptions and miss out on the enrichment system's event-type-specific features.

**Acceptance Criteria:**
- [ ] In `MomentEntryModal` and `FloatingButtonMenu`, show a "Templates" section when creating a manual moment
- [ ] 6-8 pre-built templates:
  | Template | Event Type | Pre-selected Chips |
  |----------|------------|-------------------|
  | Tough Conversation | `1:1` | Empathy, Calm, Active Listening |
  | Job Interview | `interview` | Confidence, Experience, Questions |
  | Client Pitch | `presentation` | Persuade, Value Prop, Storytelling |
  | Team Retro | `review` | Retrospective, Feedback, Growth |
  | 1:1 with Report | `1:1` | Mentorship, Feedback, Goals |
  | Strategy Session | `planning` | Strategy, Vision, Data |
  | Public Speaking | `presentation` | Calm, Communication, Storytelling |
  | Networking Event | `social` | Active Listening, Questions, Confidence |
- [ ] Selecting a template:
  - Pre-fills the description with the template name
  - Sets `detected_event_type` automatically
  - Pre-selects the template's context chips
  - User can modify everything before submitting
- [ ] Templates are stored in code (not DB) — simple array of objects
- [ ] "Custom" option at the end falls back to normal free-text entry

**Files to create:**
- `lib/moments/templates.ts` (template definitions)

**Files to modify:**
- `components/moments/MomentEntryModal.tsx` (template selection UI)
- `components/moments/FloatingButtonMenu.tsx` (optional: quick-access to popular templates)

**Effort:** M (2-4 hours)

---

### 19.5 — Weekly moments recap (integrate with TF Insights)

**Problem:** Users have no visibility into the value moments provide over time. They can't see that the system is learning or that their preparation is paying off.

**Acceptance Criteria:**
- [ ] New TF Insight type: "moments_recap"
- [ ] Generated weekly (or when user has 3+ moments in a week)
- [ ] Recap includes:
  - Number of moments prepared for this week
  - Number of thoughts surfaced and reviewed
  - Most frequently helpful thought (if any)
  - Learning highlight: "Your 'active listening' thought was helpful 4 times — it's on track to graduate!"
  - Pattern spotted: "You prepare most for 1:1s and team meetings"
- [ ] Displayed in the TF Insight card on the homepage
- [ ] Can be dismissed like other insights

**Files to modify:**
- `app/api/tf/insights/route.ts` (add moments recap generation)
- `components/home/TFInsight.tsx` (render moments recap insight type)
- `lib/moments/learning.ts` (add `getLearningStats` or extend existing)

**Effort:** M (2-4 hours)

---

### 19.6 — Push/email notifications before events

**Problem:** If users don't open the app before a meeting, they miss their prepared moments entirely. The system has done the work but can't reach the user.

**Prerequisites:** Push notification infrastructure (service worker, VAPID keys) or email service integration.

**Acceptance Criteria:**
- [ ] User setting: "Notify me before moments" (on/off, default off)
- [ ] Notification timing: configurable (5, 10, 15, 30 min before event)
- [ ] Notification content:
  - Title: "Prepare for [Event Title]"
  - Body: "[N] thoughts ready — tap to review"
  - Preview: top matched thought content (truncated)
- [ ] Tap notification → opens prep card for that moment
- [ ] Implementation options (pick one):
  - **Web Push** (service worker + VAPID): works on mobile browsers, no app install needed
  - **Email**: more reliable, less timely; good as a fallback
  - **Both**: web push primary, email fallback if push delivery fails
- [ ] Notification sent by server-side cron (same schedule as Epic 16.1) or a dedicated notification cron
- [ ] Rate limit: max 5 notifications per day per user
- [ ] Don't notify for dismissed moments

**Files to create:**
- `app/api/cron/notifications/route.ts` (notification dispatch)
- `lib/notifications.ts` (notification service)
- `public/sw.js` or equivalent (service worker for web push)

**Files to modify:**
- `components/settings/CalendarSettings.tsx` (notification preferences UI)
- `types/calendar.ts` or new types file (notification preferences)

**Effort:** XL (1-2 days)

---

## Sequencing

```
Can start immediately:
  19.3 (export) — no dependencies, pure UI
  19.4 (templates) — no dependencies, pure UI + data

Needs Epic 15 done:
  19.2 (graduation) — needs consistent was_helpful tracking

Needs Epic 16 + 17 done:
  19.1 (reflection) — needs reliable moment creation + Apply quadrant work
  19.5 (recap) — needs learning system to be working correctly

Needs infrastructure:
  19.6 (notifications) — needs push notification setup
```

---

## Definition of Done

- [ ] Stories 19.1-19.4 complete (core stickiness)
- [ ] Story 19.5 complete (visibility)
- [ ] Story 19.6 tracked and scoped (infrastructure dependent)
- [ ] Post-event reflection loop is functional
- [ ] Gem graduation counts moment applications
- [ ] Users can export prep notes
- [ ] Templates available for non-calendar users
- [ ] Weekly recap surfaces in TF Insights

---

## Relevant Existing Files

```
Components:
├── components/moments/PrepCard.tsx             (export button, graduation trigger)
├── components/moments/MomentEntryModal.tsx     (templates UI)
├── components/moments/FloatingButtonMenu.tsx   (quick template access)
├── components/home/ApplyQuadrant.tsx           (reflection cards)
├── components/home/TFInsight.tsx               (recap rendering)

API:
├── app/api/moments/learn/helpful/route.ts      (graduation trigger)
├── app/api/tf/insights/route.ts                (recap generation)

Lib:
├── lib/moments.ts                              (moment operations)
├── lib/moments/learning.ts                     (learning stats for recap)
├── lib/thoughts.ts                             (gem application_count increment)

Types:
├── types/moments.ts                            (reflection fields)
```
