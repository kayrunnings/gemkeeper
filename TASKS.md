# GemKeeper Phase 1 Tasks

## Overview

Complete Phase 1 of GemKeeper: Epics 1-4 (MVP features).

**Tech Stack:** Next.js + TypeScript + Tailwind + shadcn/ui + Supabase

**Repo:** github.com/kayrunnings/gemkeeper

## Current State

- ✅ Database tables exist: `profiles`, `gems`, `gem_checkins`
- ✅ Basic gem capture working
- ✅ Auth works
- ⚠️ Some branding still says "Notekeeper"

---

## EPIC 1: User Onboarding & Authentication

### Task 1.1: Fix Notekeeper Branding (KAY-40 cleanup)

**Find and replace ALL instances:**
- "Notekeeper" → "GemKeeper"
- "notekeeper" → "gemkeeper"
- "Your personal note-taking companion" → "Your wisdom accountability partner"
- "notes" → "gems" (in user-facing copy, not code variables)
- "note" → "gem" (in user-facing copy)

**Files to check:**
- `app/layout.tsx`
- `app/(auth)/**` - login, signup pages
- `components/**` - any UI components
- `package.json`
- `README.md`

**Commit:** `chore: Replace all Notekeeper branding with GemKeeper`

---

### Task 1.2: Onboarding Walkthrough (KAY-19)

**Create:** `components/onboarding.tsx`

**Requirements:**
- 4-screen carousel/stepper:
  1. **Welcome:** "Welcome to GemKeeper" - Your wisdom accountability partner
  2. **Capture:** "Capture gems" - Save insights from books, podcasts, and life (max 10 active)
  3. **Surface:** "Right moment, right wisdom" - Daily prompts + calendar-aware notifications
  4. **Apply:** "Actually apply it" - Accountability check-ins track your progress
- "Skip" button on all screens
- "Next" button advances screens
- "Get Started" on final screen
- Progress dots at bottom

**Create:** `app/onboarding/page.tsx`
- Protected route (requires auth)
- Shows onboarding carousel
- On complete: update `profiles.onboarding_completed = true`, redirect to `/gems`

**Modify:** `app/(protected)/layout.tsx` or middleware
- Check `profiles.onboarding_completed` on login
- If false, redirect to `/onboarding`

**Add to settings:**
- "Replay onboarding" link that sets `onboarding_completed = false` and redirects to `/onboarding`

**Commit:** `feat(onboarding): Add first-time user walkthrough`

---

### Task 1.3: Profile Settings Enhancement (KAY-18/KAY-30 cleanup)

**Create/Update:** `app/settings/page.tsx`

**Settings to include:**
- Display name (editable)
- Email (read-only)
- Timezone selector (dropdown of common timezones)
- Daily prompt time (time picker, default 8:00 AM)
- Evening check-in time (time picker, default 8:00 PM)
- "Replay onboarding" link
- Sign out button

**Commit:** `feat(settings): Add user preferences page`

---

## EPIC 2: Gem Capture

### Task 2.1: Enhance Context Tagging (KAY-32)

**Verify/Update:** `components/gem-form.tsx`

**Requirements:**
- Context tag is REQUIRED (form won't submit without it)
- Dropdown options: Meetings, Feedback, Conflict, Focus, Health, Relationships, Parenting, Other
- If "Other" selected, show text input for `custom_context`
- Styled select component (use shadcn Select)

**Update:** Gem card display
- Show context tag as colored badge

**Badge color mapping:**
```typescript
const CONTEXT_TAG_COLORS: Record<ContextTag, string> = {
  meetings: 'bg-blue-100 text-blue-800',
  feedback: 'bg-purple-100 text-purple-800',
  conflict: 'bg-red-100 text-red-800',
  focus: 'bg-orange-100 text-orange-800',
  health: 'bg-green-100 text-green-800',
  relationships: 'bg-pink-100 text-pink-800',
  parenting: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};
```

**Commit:** `feat(gems): Enhance context tagging with colored badges`

---

## EPIC 3: Gem Management

### Task 3.1: View Active Gems (KAY-23)

**Update:** `app/gems/page.tsx`

**Requirements:**
- Header: "Your Gems (X/10)" with count
- Grid or list of gem cards
- Each card shows:
  - Content (truncated to ~100 chars with "...")
  - Context tag badge (colored)
  - Source (if present, muted text)
  - Application count: "Applied X times"
  - Created date (relative: "2 days ago")
- Empty state: Illustration + "Capture your first gem" + CTA button
- "Add Gem" FAB or button in header
- Click card → opens detail view

**Commit:** `feat(gems): Enhance gems list with cards and metadata`

---

### Task 3.2: Gem Detail View (KAY-33)

**Create:** `app/gems/[id]/page.tsx`

**Requirements:**
- Full gem content (no truncation)
- Context tag badge
- Source + source_url (clickable link if URL present)
- Stats: Application count, Skip count, Created date
- Actions:
  - "Edit" button → opens edit modal/form
  - "Retire" button → triggers retire flow
  - "Graduate" button (enabled only if application_count >= 5)
- Back button to gems list

**Create:** `components/gem-detail.tsx`

**Commit:** `feat(gems): Add gem detail view`

---

### Task 3.3: Edit Gem (part of KAY-33)

**Create:** `components/gem-edit-form.tsx`

**Requirements:**
- Pre-populated form with current gem data
- Can edit: content, source, source_url, context_tag
- Cannot edit: status, application_count, skip_count
- Save button updates gem
- Cancel button closes without saving

**Add to:** `lib/gems.ts`
```typescript
export async function updateGem(id: string, input: Partial<CreateGemInput>): Promise<Gem>
```

**Commit:** `feat(gems): Add gem editing functionality`

---

### Task 3.4: Retire a Gem (KAY-34)

**Create:** `components/retire-gem-dialog.tsx`

**Requirements:**
- Confirmation dialog with two options:
  - "Release" - permanently deletes the gem
  - "Archive" - sets status = 'retired', keeps data
- Shows gem preview in dialog
- On retire: redirect to gems list, show success toast

**Add to:** `lib/gems.ts`
```typescript
export async function retireGem(id: string, mode: 'release' | 'archive'): Promise<void>
```

**Commit:** `feat(gems): Add retire gem functionality`

---

### Task 3.5: Graduate a Gem (KAY-24)

**Create:** `components/graduate-gem-dialog.tsx`

**Requirements:**
- Only enabled when `application_count >= 5`
- Confirmation dialog: "Congratulations! You've applied this gem 5+ times."
- On confirm: set status = 'graduated', set graduated_at = now()
- Celebratory animation/confetti (optional but nice)
- Redirect to trophy case

**Add to:** `lib/gems.ts`
```typescript
export async function graduateGem(id: string): Promise<Gem>
```

**Commit:** `feat(gems): Add graduate gem functionality`

---

### Task 3.6: Trophy Case (KAY-35)

**Create:** `app/trophy-case/page.tsx`

**Requirements:**
- Header: "Trophy Case 🏆"
- Stats summary: "X gems graduated, Y total applications"
- List of graduated gems (status = 'graduated')
- Each shows: content preview, source, graduation date, total applications
- Empty state: "Graduate your first gem to see it here!"
- Navigation link in sidebar/nav

**Commit:** `feat(gems): Add trophy case for graduated gems`

---

## EPIC 4: Proactive Surfacing

### Task 4.1: Daily Morning Prompt (KAY-26)

**Note:** Full push notifications require mobile app. For web MVP, build the UI and logging.

**Create:** `app/daily/page.tsx`

**Requirements:**
- Shows one gem for today (selected based on: least recently surfaced + active status)
- Large, prominent display of gem content
- Context tag badge
- Question: "Will you apply this today?"
- Three buttons: "Yes" / "Maybe" / "No"
- On response:
  - Log to `gem_checkins` table (checkin_type: 'morning_prompt')
  - Update `gems.last_surfaced_at`
  - Show confirmation and next steps

**Add to:** `lib/gems.ts`
```typescript
export async function getDailyGem(): Promise<Gem | null>
export async function logCheckin(gemId: string, type: 'morning_prompt' | 'evening_checkin', response: 'yes' | 'no' | 'maybe'): Promise<void>
```

**Commit:** `feat(daily): Add daily morning prompt page`

---

### Task 4.2: Accountability Check-in (KAY-27)

**Create:** `app/checkin/page.tsx`

**Requirements:**
- Shows the gem from this morning's prompt (or most recent active gem)
- Question: "Did you apply this gem today?"
- Two buttons: "Yes" / "No"
- On "Yes":
  - Log to `gem_checkins` (type: 'evening_checkin', response: 'yes')
  - Increment `gems.application_count`
  - Update `gems.last_applied_at`
  - Celebratory feedback: "Great job! That's X times you've applied this."
- On "No":
  - Log to `gem_checkins` (type: 'evening_checkin', response: 'no')
  - Increment `gems.skip_count`
  - Encouraging message: "Tomorrow is another chance!"
- Optional: text field for reflection note

**Commit:** `feat(checkin): Add evening accountability check-in`

---

### Task 4.3: Stale Gem Prompt (KAY-36)

**Update:** Check-in flow

**Requirements:**
- When showing a gem with `skip_count >= 21`:
  - Show special prompt: "It's been 3 weeks since you've applied this gem. Is it still useful?"
  - Two options: "Keep" / "Release"
  - "Keep": reset skip_count to 0
  - "Release": trigger retire flow

**Commit:** `feat(checkin): Add stale gem prompt after 3 weeks`

---

## EPIC 4 Bonus: Navigation Updates

### Task 4.4: Update Navigation

**Update:** Sidebar/navigation component

**Add links:**
- "Gems" → `/gems` (home)
- "Daily" → `/daily`
- "Check-in" → `/checkin`
- "Trophy Case" → `/trophy-case`
- "Settings" → `/settings`

**Consider:** Highlighting "Daily" or "Check-in" if action needed

**Commit:** `feat(nav): Update navigation for gem features`

---

## Database Reference

### profiles table
```sql
id, email, name, daily_prompt_time, checkin_time, timezone, 
calendar_connected, onboarding_completed, created_at, updated_at
```

### gems table
```sql
id, user_id, content, source, source_url, context_tag, custom_context,
status ('active'|'retired'|'graduated'), application_count, skip_count,
last_surfaced_at, last_applied_at, retired_at, graduated_at, created_at, updated_at
```

### gem_checkins table
```sql
id, gem_id, user_id, checkin_type ('morning_prompt'|'evening_checkin'),
response ('yes'|'no'|'maybe'), note, created_at
```

---

## Commit Order Suggestion

1. `chore: Replace all Notekeeper branding with GemKeeper`
2. `feat(settings): Add user preferences page`
3. `feat(gems): Enhance context tagging with colored badges`
4. `feat(gems): Enhance gems list with cards and metadata`
5. `feat(gems): Add gem detail view`
6. `feat(gems): Add gem editing functionality`
7. `feat(gems): Add retire gem functionality`
8. `feat(gems): Add graduate gem functionality`
9. `feat(gems): Add trophy case for graduated gems`
10. `feat(daily): Add daily morning prompt page`
11. `feat(checkin): Add evening accountability check-in`
12. `feat(checkin): Add stale gem prompt after 3 weeks`
13. `feat(nav): Update navigation for gem features`
14. `feat(onboarding): Add first-time user walkthrough`

---

## Testing Checklist

After completing all tasks, verify:

- [ ] App shows "GemKeeper" everywhere (no "Notekeeper")
- [ ] Can create account and see onboarding
- [ ] Can skip or complete onboarding
- [ ] Can create gems with all context tags
- [ ] Gem count shows "X/10"
- [ ] Cannot create 11th gem (error message)
- [ ] Can view gem details
- [ ] Can edit gem content/source/context
- [ ] Can retire gem (release or archive)
- [ ] Can graduate gem (after 5 applications)
- [ ] Trophy case shows graduated gems
- [ ] Daily prompt shows a gem
- [ ] Can respond Yes/Maybe/No to daily prompt
- [ ] Check-in updates application_count or skip_count
- [ ] Stale gem prompt appears after 21 skips
- [ ] All navigation links work
- [ ] Settings page works (timezone, times)
