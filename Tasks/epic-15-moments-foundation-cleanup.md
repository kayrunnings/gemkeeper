# Epic 15: Moments Foundation Cleanup

## Overview

Fix bugs, remove dead code, and establish a clean codebase for the moments system before building new features. This is prerequisite work — no UX changes, just correctness and consolidation.

**Core Principle:** A solid foundation before new features. Every discrepancy found during the moments audit gets resolved here.

---

## Current State (Audit Findings)

- Learning threshold hardcoded as `3` in API route, but `LEARNING_HELPFUL_THRESHOLD` constant is `1`
- "Got it" button in PrepCard sets `was_reviewed: true` but never sets `was_helpful: true`
- Homepage shows completed/dismissed moments in the "upcoming" section
- `UpcomingMomentsCard` component is dead code (replaced by `ApplyQuadrant`)
- `lib/moments.ts` `createMoment()` does bare DB insert without AI matching
- `api/moments/route.ts` duplicates insert logic AND runs matching
- Legacy aliases remain (`MomentGem`, `MomentWithGems`, etc.)

---

## Stories

### 15.1 — Fix learning threshold mismatch

**Problem:** `app/api/moments/route.ts:149` uses `.gte('helpful_count', 3)` while the learning service constant `LEARNING_HELPFUL_THRESHOLD` is `1`. Learned thoughts are being under-surfaced from the API route.

**Acceptance Criteria:**
- [ ] Import `LEARNING_HELPFUL_THRESHOLD` from `@/lib/types/learning` in `app/api/moments/route.ts`
- [ ] Replace hardcoded `3` with the constant
- [ ] Verify the learning query in the API route matches the behavior in `lib/moments/learning.ts`

**Files to modify:**
- `app/api/moments/route.ts` (line ~149)

**Effort:** XS (< 30 min)

---

### 15.2 — Fix "Got it" not recording `was_helpful: true`

**Problem:** In `PrepCard.tsx`, `handleGotIt` calls `markThoughtReviewed()` (sets `was_reviewed: true` only) but never calls `recordMomentThoughtFeedback(id, true)`. The `moment_gems.was_helpful` column stays `null` for positive feedback while "Not helpful" properly sets `false`.

**Acceptance Criteria:**
- [ ] `handleGotIt` in `PrepCard.tsx` calls `recordMomentThoughtFeedback(momentThought.id, true)` before or alongside `markThoughtReviewed()`
- [ ] After clicking "Got it", `moment_gems` row has `was_helpful: true` AND `was_reviewed: true`
- [ ] The learning API call (`/api/moments/learn/helpful`) continues to be called as well
- [ ] No double-write issues (review the interaction between `recordMomentThoughtFeedback` and `markThoughtReviewed`)

**Files to modify:**
- `components/moments/PrepCard.tsx` (`handleGotIt` function, ~line 62)

**Effort:** XS (< 30 min)

---

### 15.3 — Filter out completed/dismissed moments from homepage

**Problem:** `getRecentMoments()` fetches all moments regardless of status. The homepage `upcomingMoments` filter checks event time but not status, so dismissed or completed moments appear in the Apply quadrant.

**Acceptance Criteria:**
- [ ] `getRecentMoments()` in `lib/moments.ts` accepts an optional `statusFilter` parameter
- [ ] Homepage passes `status: 'active'` (or filters client-side after fetch)
- [ ] Completed and dismissed moments no longer appear in the Apply quadrant's "Upcoming moments" section
- [ ] The moments history page (`/moments`) continues to show all moments regardless of status

**Files to modify:**
- `lib/moments.ts` (`getRecentMoments` function)
- `app/home/page.tsx` (where moments are filtered for `upcomingMoments`)

**Effort:** S (< 1 hour)

---

### 15.4 — Remove dead `UpcomingMomentsCard` component

**Problem:** `components/home/UpcomingMomentsCard.tsx` is not used on any page. It was replaced by `ApplyQuadrant` but never cleaned up. It has divergent logic for fetching calendar events and displaying moments.

**Acceptance Criteria:**
- [ ] Verify no file imports `UpcomingMomentsCard` (grep the codebase)
- [ ] Delete `components/home/UpcomingMomentsCard.tsx`
- [ ] Build succeeds without errors

**Note:** The useful features of this component (calendar event cache lookup, on-demand moment creation from events) will be migrated into `ApplyQuadrant` in Epic 17.1.

**Files to modify:**
- Delete `components/home/UpcomingMomentsCard.tsx`

**Effort:** XS (< 30 min)

---

### 15.5 — Consolidate moment creation into a single service

**Problem:** Two separate code paths create moments:
1. `lib/moments.ts` `createMoment()` — bare DB insert, no AI matching, used by some client code
2. `app/api/moments/route.ts` POST handler — duplicates insert logic, runs matching, handles enrichment

Any code calling `createMoment()` directly creates a moment with 0 matches and no AI processing.

**Acceptance Criteria:**
- [ ] Create a new server-side function `createMomentWithMatching()` in a shared service file (e.g., `lib/moments/create-moment.ts`)
- [ ] This function handles: DB insert, gem fetch, learned thoughts, AI matching call, moment_gems insert, match count update
- [ ] `app/api/moments/route.ts` delegates to this function
- [ ] `lib/calendar-sync.ts` `checkForUpcomingEvents()` uses this function (currently calls the API route via fetch)
- [ ] The old `createMoment()` in `lib/moments.ts` is either removed or clearly marked as "DB-only insert for internal use"
- [ ] No behavior change from the user's perspective

**Files to modify:**
- New: `lib/moments/create-moment.ts`
- `app/api/moments/route.ts` (refactor to use shared service)
- `lib/moments.ts` (deprecate or remove `createMoment`)
- `lib/calendar-sync.ts` (use shared service instead of fetch)

**Effort:** M (2-4 hours)

---

### 15.6 — Remove legacy aliases

**Problem:** Legacy backward-compatibility aliases exist in `types/moments.ts` and `lib/moments.ts` from a gems→thoughts rename. These add confusion.

**Acceptance Criteria:**
- [ ] Grep codebase for usage of: `MomentGem`, `MomentWithGems`, `recordMomentGemFeedback`, `markGemReviewed`, `addMomentGems`
- [ ] Update any remaining consumers to use the new names
- [ ] Remove the aliases from `types/moments.ts` and `lib/moments.ts`
- [ ] Build succeeds

**Files to modify:**
- `types/moments.ts` (remove `MomentGem`, `MomentWithGems`)
- `lib/moments.ts` (remove `recordMomentGemFeedback`, `markGemReviewed`, `addMomentGems`)
- Any files still importing the legacy names

**Effort:** S (< 1 hour)

---

## Definition of Done

- [ ] All 6 stories complete
- [ ] Build succeeds (`npm run build`)
- [ ] No new console errors
- [ ] Existing moment functionality unchanged from user perspective (except bugs are fixed)
- [ ] Dead code removed
- [ ] No legacy aliases remain

---

## Relevant Existing Files

```
Core:
├── lib/moments.ts                          (client-side CRUD — has bare createMoment)
├── lib/moments/learning.ts                 (learning service — uses constant)
├── lib/moments/title-analysis.ts           (event type detection)
├── lib/types/learning.ts                   (LEARNING_HELPFUL_THRESHOLD constant)
├── types/moments.ts                        (types + legacy aliases)

API Routes:
├── app/api/moments/route.ts                (POST/GET — hardcoded threshold)

Components:
├── components/moments/PrepCard.tsx          (Got it bug)
├── components/home/UpcomingMomentsCard.tsx  (dead code)
├── components/home/ApplyQuadrant.tsx        (homepage — no status filter)

Pages:
├── app/home/page.tsx                       (fetches moments without status filter)
```
