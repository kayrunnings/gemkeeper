# Epic 13: Moment Intelligence

## Overview

Enhance the Moments system with intelligent context prompting and learning capabilities. When calendar events have generic titles, proactively ask users for more context before matching. Over time, learn which thoughts are helpful for similar moments and surface them automatically.

**Core Principle:** "Thoughts that find you" — the system should get smarter at surfacing the right thoughts for recurring situations.

**Branch:** `claude/moments-thoughts-feature-P1rRY`

---

## Current State

- ✅ Moments created from calendar events
- ✅ AI matching via MOMENT_MATCHING_PROMPT
- ✅ User feedback captured (was_helpful, was_reviewed)
- ✅ Generic event title detection implemented
- ✅ Context enrichment prompting implemented
- ✅ User feedback used to improve future matching (learning system)
- ✅ Event-type and keyword pattern learning implemented
- ⏳ Recurring event recognition (basic via calendar_event_id, full UI deferred)
- ⏳ Attendee-based learning (deferred to future enhancement)

---

## Problem Statement

**Issue 1: Generic Event Titles**
Calendar events like "Team Meeting", "1:1", "Sync", or "Call" don't provide enough context for meaningful thought matching. Result: 0 matches or irrelevant matches.

**Issue 2: No Learning**
User marks a thought as "helpful" for their weekly 1:1 with their manager. Next week, same meeting — system starts fresh, doesn't remember what worked.

**Issue 3: Context Lost**
User manually adds context like "career conversation about promotion" but this enrichment is never stored for future similar moments.

---

## Phase 1: Smart Context Prompting

### 1.0 Generic Title Detection

**Goal:** Identify when an event title is too generic to produce good matches.

- [x] 1.1 Create `lib/moments/title-analysis.ts`:
  ```typescript
  interface TitleAnalysis {
    isGeneric: boolean;
    genericReason?: 'short' | 'common_pattern' | 'no_description';
    suggestedQuestions?: string[];
    detectedEventType?: EventType;
  }

  type EventType =
    | '1:1'
    | 'team_meeting'
    | 'interview'
    | 'presentation'
    | 'review'
    | 'planning'
    | 'social'
    | 'external'
    | 'unknown';

  function analyzeEventTitle(
    title: string,
    description?: string,
    attendeeCount?: number
  ): TitleAnalysis;
  ```

- [x] 1.2 Implement detection rules:
  | Rule | Examples | Result |
  |------|----------|--------|
  | Short title (< 3 words) | "Meeting", "Call", "Sync" | `isGeneric: true` |
  | Common generic patterns | "Team Meeting", "Weekly Sync", "1:1", "Check-in", "Catch up", "Touch base" | `isGeneric: true` |
  | No description + short title | Title: "Review" Description: null | `isGeneric: true` |
  | Specific title | "Q1 Planning: Budget Review", "Interview: Senior Engineer" | `isGeneric: false` |

- [x] 1.3 Implement event type detection:
  | Pattern | Detected Type |
  |---------|---------------|
  | "1:1", "one on one", "1-on-1" | `1:1` |
  | "team meeting", "standup", "weekly sync" | `team_meeting` |
  | "interview" | `interview` |
  | "presentation", "demo", "pitch" | `presentation` |
  | "review", "feedback", "performance" | `review` |
  | "planning", "roadmap", "strategy" | `planning` |
  | "happy hour", "lunch", "coffee" | `social` |
  | External attendees (different domain) | `external` |

- [x] 1.4 Generate contextual questions based on event type:
  ```typescript
  const questionsByEventType: Record<EventType, string[]> = {
    '1:1': [
      "What do you want to discuss or accomplish?",
      "Any challenges you're facing?",
      "Is this a regular check-in or something specific?"
    ],
    'interview': [
      "What role is this for?",
      "What aspects are you most focused on?",
      "Interviewer or interviewee?"
    ],
    'presentation': [
      "What's your main message?",
      "Who's the audience?",
      "What outcome are you hoping for?"
    ],
    // ... etc
  };
  ```

### 2.0 Context Enrichment UI

**Goal:** When generic title detected, prompt user for more context before matching.

- [x] 2.1 Create `components/moments/ContextEnrichmentPrompt.tsx`:
  - Appears in MomentEntryModal when event is generic
  - Shows the detected event title
  - Displays 1-2 contextual questions
  - Text input for user's additional context
  - Quick-select chips based on event type:
    - For 1:1: [Career] [Feedback] [Project Update] [Personal]
    - For meetings: [Decision] [Brainstorm] [Status] [Planning]
    - For interviews: [Technical] [Behavioral] [Culture Fit]
  - "Skip" option to proceed without enrichment
  - "Find Thoughts" button

- [x] 2.2 Update `components/moments/MomentEntryModal.tsx`:
  - Add new state: `enrichmentNeeded: boolean`
  - Add new state: `enrichmentContext: string`
  - When creating moment from calendar event:
    1. Call `analyzeEventTitle()`
    2. If `isGeneric: true`, show ContextEnrichmentPrompt
    3. User adds context or skips
    4. Combine: `${eventTitle}: ${enrichmentContext}` for matching

- [x] 2.3 Update moment creation flow:
  - Store enrichment in new field: `user_context` on moments table
  - Pass combined context to matching API
  - Display original title + user context in PrepCard

### 3.0 Database Changes for Phase 1

**Migration (Kay runs in Supabase):**

```sql
-- Add user_context field to moments table
ALTER TABLE moments
ADD COLUMN user_context TEXT,
ADD COLUMN detected_event_type TEXT;

-- Comment for clarity
COMMENT ON COLUMN moments.user_context IS 'Additional context provided by user to enrich generic event titles';
COMMENT ON COLUMN moments.detected_event_type IS 'Auto-detected event type: 1:1, team_meeting, interview, etc.';
```

- [x] 3.1 Create migration SQL file
- [x] 3.2 Update `lib/types/moment.ts` with new fields
- [x] 3.3 Update moment creation API to accept and store `user_context`
- [x] 3.4 Update PrepCard to show user context if present

---

## Phase 2: Learning System

### 4.0 Database Schema for Learning

**New table: `moment_learnings`**

```sql
CREATE TABLE moment_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('event_type', 'keyword', 'recurring', 'attendee')),
  pattern_key TEXT NOT NULL,  -- e.g., '1:1', 'career', 'event:google_abc123', 'email:john@company.com'

  -- The learned association
  gem_id UUID REFERENCES gems(id) ON DELETE CASCADE NOT NULL,

  -- Confidence tracking
  helpful_count INTEGER DEFAULT 1,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  last_helpful_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one learning per pattern + thought combo
  UNIQUE(user_id, pattern_type, pattern_key, gem_id)
);

-- Index for efficient lookups
CREATE INDEX idx_moment_learnings_lookup
ON moment_learnings(user_id, pattern_type, pattern_key);

CREATE INDEX idx_moment_learnings_gem
ON moment_learnings(gem_id);

-- RLS policies
ALTER TABLE moment_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learnings"
ON moment_learnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learnings"
ON moment_learnings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learnings"
ON moment_learnings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learnings"
ON moment_learnings FOR DELETE
USING (auth.uid() = user_id);
```

- [x] 4.1 Create migration SQL file
- [x] 4.2 Create TypeScript types:
  ```typescript
  interface MomentLearning {
    id: string;
    user_id: string;
    pattern_type: 'event_type' | 'keyword' | 'recurring' | 'attendee';
    pattern_key: string;
    gem_id: string;
    helpful_count: number;
    not_helpful_count: number;
    last_helpful_at: string;
    created_at: string;
  }

  interface LearnedThought {
    gem_id: string;
    gem_content: string;
    confidence_score: number;  // helpful_count / (helpful_count + not_helpful_count)
    pattern_sources: string[]; // Which patterns matched
  }
  ```

### 5.0 Learning Service

- [x] 5.1 Create `lib/moments/learning.ts`:

  ```typescript
  // Record a learning when user marks thought as helpful
  async function recordHelpfulThought(
    userId: string,
    momentId: string,
    gemId: string,
    moment: Moment
  ): Promise<void>;

  // Record negative signal when user marks thought as not helpful
  async function recordNotHelpfulThought(
    userId: string,
    momentId: string,
    gemId: string
  ): Promise<void>;

  // Get learned thoughts for a moment (before AI matching)
  async function getLearnedThoughts(
    userId: string,
    moment: {
      eventType?: EventType;
      keywords: string[];
      externalEventId?: string;
      attendeeEmails?: string[];
    }
  ): Promise<LearnedThought[]>;

  // Extract keywords from moment description
  function extractKeywords(description: string): string[];

  // Check if recurring event (same external ID or similar pattern)
  function isRecurringEvent(
    eventId?: string,
    title?: string,
    startTime?: Date
  ): Promise<{ isRecurring: boolean; previousMomentId?: string }>;
  ```

- [x] 5.2 Implement `recordHelpfulThought`:
  - Extract patterns from the moment:
    - `event_type`: from `detected_event_type`
    - `keyword`: from `extractKeywords(description + user_context)`
    - `recurring`: from `calendar_event_id`
    - `attendee`: from calendar event attendees (if available)
  - For each pattern, upsert to `moment_learnings`:
    - If exists: increment `helpful_count`, update `last_helpful_at`
    - If not: create with `helpful_count = 1`

- [x] 5.3 Implement `recordNotHelpfulThought`:
  - Find existing learnings for this gem
  - Increment `not_helpful_count`
  - If `not_helpful_count > helpful_count`: consider removing association

- [x] 5.4 Implement `getLearnedThoughts`:
  - Query `moment_learnings` for matching patterns
  - Calculate confidence: `helpful_count / (helpful_count + not_helpful_count)`
  - **Threshold: only return if helpful_count >= 3** (established pattern)
  - Sort by confidence DESC
  - Return with pattern_sources for explainability

- [x] 5.5 Implement keyword extraction:
  - Remove stop words (the, a, an, with, for, etc.)
  - Extract nouns and key phrases
  - Normalize (lowercase, stem)
  - Consider using a simple NLP approach or pattern matching

### 6.0 Integrate Learning into Matching Flow

- [x] 6.1 Update `POST /api/moments/match`:
  - Before calling Gemini, call `getLearnedThoughts()`
  - If learned thoughts found with high confidence (>= 0.7):
    - Include in prompt: "For similar moments, the user found these thoughts helpful: [list]"
    - OR: Pre-populate matches and let AI add more
  - Track which matches came from learning vs AI

- [x] 6.2 Update `MOMENT_MATCHING_PROMPT` in `lib/ai/prompts.ts`:
  ```
  {learned_thoughts_section}

  PREVIOUSLY HELPFUL THOUGHTS (if any):
  The user has marked these thoughts helpful for similar moments in the past:
  {learned_thoughts_list}

  Consider including these if still relevant, but also find new matches.
  ```

- [x] 6.3 Update moment creation response:
  - Add field: `match_source: 'ai' | 'learned' | 'both'` on each matched thought
  - Track in `moment_gems` table

### 7.0 Recurring Event Recognition

- [ ] 7.1 Implement recurring detection in `lib/moments/learning.ts`:

  **Method A: Same External Event ID**
  - Google Calendar uses the same base event ID for recurring instances
  - Store `calendar_event_id` on moments
  - Query: find previous moments with same base ID

  **Method B: Fuzzy Pattern Match**
  - Same title + same day of week + similar time (within 1 hour)
  - e.g., "Weekly 1:1 with Sarah" every Monday at 10am
  - Query: find moments with similar title in past 30 days

  ```typescript
  interface RecurringMatch {
    isRecurring: boolean;
    matchType: 'exact_event_id' | 'fuzzy_pattern';
    previousMomentId?: string;
    previousHelpfulThoughts?: string[]; // gem IDs
  }
  ```

- [ ] 7.2 Create UI for recurring moments:
  - When recurring event detected, show in MomentEntryModal:
    ```
    "You've prepared for this before!"

    Last time, these thoughts helped:
    • [Thought 1 preview]
    • [Thought 2 preview]

    [Use Same Thoughts] [Find New Ones] [Mix Both]
    ```

- [ ] 7.3 Update `components/moments/MomentEntryModal.tsx`:
  - Add state: `recurringMatch: RecurringMatch | null`
  - On calendar event selection, check for recurring
  - If recurring, show previous thoughts UI
  - Handle user choice:
    - "Use Same": Copy previous moment_gems to new moment
    - "Find New": Normal AI matching (but include learnings in prompt)
    - "Mix Both": Use previous as base, AI adds more

### 8.0 Feedback Loop Integration

- [x] 8.1 Update `components/moments/PrepCard.tsx`:
  - On "Got it" (helpful) click:
    - Existing: `markThoughtReviewed(momentId, gemId)`
    - Add: `recordHelpfulThought(userId, momentId, gemId, moment)`
  - On "Not helpful" click:
    - Existing: `recordMomentThoughtFeedback(momentId, gemId, false)`
    - Add: `recordNotHelpfulThought(userId, momentId, gemId)`

- [x] 8.2 Create feedback API routes:
  - `POST /api/moments/learn/helpful` - Record helpful signal
  - `POST /api/moments/learn/not-helpful` - Record not helpful signal
  - Both should trigger learning service updates

- [x] 8.3 Add learning indicator to matched thoughts:
  - If thought came from learned pattern, show subtle badge:
    - "Helped before" or small repeat icon
  - Helps user understand why this thought was suggested

### 9.0 Attendee-Based Learning (Bonus)

- [ ] 9.1 Extract attendee emails from calendar events
- [ ] 9.2 Create `attendee` pattern type learnings
- [ ] 9.3 When meeting with same person(s), surface previously helpful thoughts
- [ ] 9.4 Privacy consideration: only store email hash, not full email

---

## Phase 3: Polish & Edge Cases

### 10.0 Edge Case Handling

- [ ] 10.1 Handle deleted thoughts:
  - When gem is deleted, cascade delete from `moment_learnings`
  - Already handled by FK constraint

- [ ] 10.2 Handle status changes:
  - Retired/graduated thoughts shouldn't be matched
  - But learnings can persist (in case thought is reactivated)
  - Filter at query time, not storage time

- [ ] 10.3 Handle conflicting signals:
  - Same thought: helpful for "1:1" but not helpful for "interview"
  - Solution: learnings are pattern-specific, no conflict

- [ ] 10.4 Cold start for new users:
  - No learnings yet = normal AI matching
  - After ~5-10 moments with feedback, learnings kick in
  - Consider showing "Help me learn" prompt after first few moments

### 11.0 Learning Analytics (Optional)

- [ ] 11.1 Track learning effectiveness:
  - How often do learned thoughts get marked helpful again?
  - Which pattern types are most predictive?

- [ ] 11.2 Add to dashboard or settings:
  - "Your moment patterns" view
  - See which thoughts are associated with which event types
  - Ability to manually remove learned associations

### 12.0 Testing & Validation

- [ ] 12.1 Test generic title detection:
  - "Meeting" → generic
  - "Q1 Budget Review with Finance" → not generic
  - "1:1" → generic, type = 1:1

- [ ] 12.2 Test enrichment flow:
  - Generic event → prompt shown → user adds context → matching uses combined text

- [ ] 12.3 Test learning recording:
  - Mark thought helpful → learning created
  - Mark same thought helpful for similar moment → count increments
  - After 3 helpful marks → thought appears in learned suggestions

- [ ] 12.4 Test recurring recognition:
  - Same Google event ID → detected as recurring
  - Same title + time pattern → detected as fuzzy recurring

- [ ] 12.5 Test threshold behavior:
  - helpful_count = 2 → not suggested (below threshold of 3)
  - helpful_count = 3 → suggested

---

## Relevant Files

### New Files to Create

**Phase 1:**
- `lib/moments/title-analysis.ts` — Generic title detection
- `components/moments/ContextEnrichmentPrompt.tsx` — UI for adding context

**Phase 2:**
- `lib/moments/learning.ts` — Learning service
- `lib/types/learning.ts` — Learning types
- `app/api/moments/learn/helpful/route.ts` — Record helpful
- `app/api/moments/learn/not-helpful/route.ts` — Record not helpful

### Files to Modify

- `lib/types/moment.ts` — Add user_context, detected_event_type
- `components/moments/MomentEntryModal.tsx` — Add enrichment flow, recurring UI
- `components/moments/PrepCard.tsx` — Add learning triggers, learned badge
- `app/api/moments/route.ts` — Store enrichment data
- `app/api/moments/match/route.ts` — Integrate learned thoughts
- `lib/ai/prompts.ts` — Update MOMENT_MATCHING_PROMPT

### Database Migrations

- `migrations/add_moment_user_context.sql` — Phase 1 schema changes
- `migrations/create_moment_learnings.sql` — Phase 2 learning table

---

## Acceptance Criteria

### Phase 1: Smart Context Prompting
- [x] Generic event titles are detected (short, common patterns, no description)
- [x] Event type is auto-detected (1:1, interview, presentation, etc.)
- [x] User is prompted with contextual questions before matching
- [x] Quick-select chips are shown based on event type
- [x] User can skip enrichment and proceed with original title
- [x] Combined context (title + user input) is used for matching
- [x] User context is stored and displayed in PrepCard

### Phase 2: Learning System
- [x] Marking thought "helpful" records learning associations
- [x] Marking thought "not helpful" records negative signal
- [x] Learnings are pattern-specific (event_type, keyword, recurring, attendee)
- [x] Thoughts with >= 3 helpful marks are suggested for similar moments
- [ ] Recurring events are detected (same event ID OR fuzzy title+time match) *(basic via calendar_event_id; full UI deferred)*
- [ ] Recurring event UI shows previous helpful thoughts *(deferred to future enhancement)*
- [ ] User can choose: use same, find new, or mix both *(deferred to future enhancement)*
- [x] Learned thoughts are indicated in PrepCard ("Helped before" badge)
- [x] AI prompt includes learned thoughts as context

---

## Definition of Done

- [x] All Phase 1 tasks complete
- [x] All Phase 2 tasks complete (core learning; recurring UI deferred)
- [x] Database migrations run successfully
- [ ] Feature works in production (gemkeeper.vercel.app) *(pending user testing)*
- [x] CLAUDE.md updated with new feature
- [x] ARCHITECTURE.md updated with learning data flow
- [x] DECISIONS.md updated with key design decisions
- [ ] No console errors *(pending user testing)*
- [ ] Mobile responsive *(pending user testing)*

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Learning threshold | 1 helpful mark (was 3, reduced for testing) | Easier testing; can revert to 3 for production |
| Pattern types | event_type, keyword, recurring, attendee | Covers the main ways moments repeat |
| Recurring detection | Both exact ID + fuzzy match | Google IDs are reliable; fuzzy catches renamed events |
| Enrichment timing | Before matching | More context = better matches (vs. asking after 0 matches) |
| Learning storage | Separate table | Clean separation, easy to query, doesn't bloat moments table |
| Keyword extraction | Simple stop-word removal | Start simple, can add NLP later if needed |

---

## User Testing Feedback (January 2026)

Based on user testing, the following enhancements were implemented:

### Context Enrichment Improvements
- [x] Context enrichment prompt now shows for **all** calendar events (not just generic titles)
- [x] If no thoughts are found, always offer "Add Context & Try Again" option
- [x] Quick add floating button now navigates to prep card (which handles enrichment)

### Chip Selection Enhancements
- [x] Expanded chips to 12-15 per event type (was 4-5)
- [x] Added `ALL_CHIPS` array with 60+ comprehensive topics
- [x] Added chip search functionality (`searchChips()` in title-analysis.ts)
- [x] "Show more topics" toggle to reveal additional chips
- [x] Selected chips summary with easy removal

### Visual Feedback
- [x] "Got it" button now shows visual confirmation overlay: "Noted! This will help future matches."
- [x] Confirmation fades after 2 seconds

### Moments Page Improvements
- [x] Added "New Moment" button in header to create moments from the list page
- [x] Added sorting dropdown with options:
  - Newest First
  - Oldest First
  - Most Thoughts
  - Upcoming

### Testing Configuration
- [x] Reduced `LEARNING_HELPFUL_THRESHOLD` from 3 to 1 for easier testing
- [x] Can be reverted to 3 for production after testing is complete

---

## Open Questions

1. **Decay over time?** Should old learnings (> 6 months) be weighted less?
2. **Cross-context learning?** If "active listening" helps for 1:1s, should it auto-suggest for team meetings too?
3. **Explicit pattern management?** Should users be able to say "always suggest X for 1:1s"?
4. **Learning export?** If user changes jobs, can they take learnings with them?

---

## Future Enhancements

- **Proactive moment creation:** System suggests creating a moment based on learned patterns ("You usually prepare for 1:1s with Sarah - want to find thoughts now?")
- **Learning sharing:** Team-level learnings for shared thought libraries
- **Pattern discovery:** AI identifies patterns user might not notice ("You often find X helpful before presentations")
