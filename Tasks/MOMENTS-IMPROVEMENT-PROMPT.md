# Moments Improvement — Claude Code Prompt

Use this file as a prompt for Claude Code sessions to implement the moments improvement epics. Copy the relevant section below depending on which epic/story you're working on.

---

## How to Use

1. Start a Claude Code session in the gemkeeper project root
2. Copy the prompt for the epic/story you want to implement
3. Paste it as your first message
4. Claude will read the task file, understand the codebase, and implement the changes

---

## Epic 15: Moments Foundation Cleanup

### Run all of Epic 15 (recommended for first session)

```
Read the task file at Tasks/epic-15-moments-foundation-cleanup.md and implement all 6 stories in order.

Key context:
- This is a Next.js app using Supabase, TypeScript, and Tailwind CSS
- The moments system lets users prepare for upcoming events by surfacing relevant saved thoughts
- This epic fixes bugs and removes dead code — no UX changes, just correctness

For each story:
1. Read the relevant files listed in the story
2. Make the changes described in the acceptance criteria
3. Verify the build passes after each story (npm run build)
4. Commit each story separately with a descriptive message

Important constraints:
- Story 15.1: The constant LEARNING_HELPFUL_THRESHOLD is in lib/types/learning.ts
- Story 15.2: Be careful not to create double-writes — review how recordMomentThoughtFeedback and markThoughtReviewed interact
- Story 15.4: Before deleting UpcomingMomentsCard, grep for all imports to confirm it's unused
- Story 15.5: The new createMomentWithMatching() must be a SERVER-SIDE function (uses Supabase service role or server client, not browser client)
- Story 15.6: Grep for legacy names before removing — update any remaining consumers first
```

### Run a single story

```
Read the task file at Tasks/epic-15-moments-foundation-cleanup.md and implement only story 15.X.

Read the relevant files, make the changes, verify the build passes (npm run build), and commit with a descriptive message.
```

---

## Epic 16: Reliable Calendar Sync

### Story 16.1 — Server-side cron

```
Read the task file at Tasks/epic-16-reliable-calendar-sync.md and implement story 16.1 (server-side calendar sync via cron).

Key context:
- Currently calendar sync only runs client-side via useCalendarAutoSync hook (lib/hooks/useCalendarAutoSync.ts)
- The server needs to iterate all users' active calendar_connections and sync those that are due
- Use the existing calendar sync logic in lib/calendar.ts as a reference
- The cron route needs to be protected — use a CRON_SECRET env var checked against a bearer token
- After syncing events, check for events within lead_time_minutes and create moments using the consolidated createMomentWithMatching() from Epic 15.5
- Configure the cron in vercel.json

Important: This story depends on Epic 15.5 (consolidated moment creation). If that hasn't been done yet, implement it first.

Read the existing files, implement the changes, verify the build passes, and commit.
```

### Story 16.2 — Catch-up on app load

```
Read the task file at Tasks/epic-16-reliable-calendar-sync.md and implement story 16.2 (catch-up check on app load).

Key context:
- When the user opens the app after being away, backfill moments for events that entered the lead-time window since last_sync_at
- Modify useCalendarAutoSync or create a companion hook
- Only create moments for future events or events that started within the last hour
- Show a toast if catch-up created any moments

Read the existing files (especially lib/hooks/useCalendarAutoSync.ts and lib/calendar-sync.ts), implement the changes, verify the build passes, and commit.
```

### Story 16.3 — Sync health indicator

```
Read the task file at Tasks/epic-16-reliable-calendar-sync.md and implement story 16.3 (sync health indicator on Apply quadrant).

Key context:
- Add a subtle status line below the upcoming moments in ApplyQuadrant
- Fetch last_sync_at from calendar_connections on the homepage
- States: "Synced N min ago" / "Syncing..." / "Sync error — tap to retry"
- Tapping triggers manual sync

Read components/home/ApplyQuadrant.tsx and app/home/page.tsx, implement the changes, verify the build passes, and commit.
```

---

## Epic 17: Smarter Apply Quadrant

### Story 17.1 — Un-momentified calendar events

```
Read the task file at Tasks/epic-17-smarter-apply-quadrant.md and implement story 17.1 (show un-momentified calendar events in Apply quadrant).

Key context:
- Port the calendar event cache fetching logic from the now-deleted UpcomingMomentsCard (or see git history if already deleted)
- The ApplyQuadrant should fetch from calendar_events_cache for events where moment_created = false
- Merge with existing moments list, sorted by event start time
- On-demand moment creation when user taps an event
- Cap at 3 items total

Important: The ApplyQuadrant receives upcomingMoments as props from app/home/page.tsx. You'll need to either:
(a) Also pass calendar events as props, or
(b) Fetch them inside the component (like UpcomingMomentsCard did)

Option (b) is simpler and matches the existing pattern. Use Supabase client directly inside the component.

Read the existing files, implement the changes, verify the build passes, and commit.
```

### Stories 17.2 + 17.3 (can be done together)

```
Read the task file at Tasks/epic-17-smarter-apply-quadrant.md and implement stories 17.2 (urgency-aware display) and 17.3 (match quality indicators).

Key context:
- Both are styling/display changes in ApplyQuadrant
- Urgency: amber highlight + countdown for <30min, normal for 30min-2hr, compact for 2hr+
- Quality: "Needs context" badge for 0 matches, count for 1-2, "Ready" badge for 3+
- Use the existing amber-500 / emerald-500 color palette

Read components/home/ApplyQuadrant.tsx, implement both stories, verify the build passes, and commit.
```

### Story 17.4 — Inline thought preview

```
Read the task file at Tasks/epic-17-smarter-apply-quadrant.md and implement story 17.4 (inline thought preview on tap/expand).

Key context:
- First tap expands a moment row to show top 1-2 matched thoughts
- This requires fetching thought data — consider lazy loading on expand via getMoment()
- Second tap or tap elsewhere collapses
- Smooth animation (200ms)

Read the existing files, implement the changes, verify the build passes, and commit.
```

---

## Epic 18: Enhanced Enrichment

### Stories 18.1 + 18.2 (can be done together)

```
Read the task file at Tasks/epic-18-enhanced-enrichment.md and implement stories 18.1 (always-available context) and 18.2 (enrichment for manual moments).

Key context:
- 18.1: Add a persistent "Add context" link on every PrepCard, not conditional on title genericity
- 18.2: Run analyzeEventTitle() on manual moment text (debounced) and show chips inline
- Both stories make enrichment universally available

Read the existing files (PrepCard.tsx, MomentEntryModal.tsx, ContextEnrichmentPrompt.tsx, title-analysis.ts), implement both stories, verify the build passes, and commit.
```

### Story 18.5 — Merge enrichment matches

```
Read the task file at Tasks/epic-18-enhanced-enrichment.md and implement story 18.5 (merge enrichment matches instead of replacing).

Key context:
- Currently app/api/moments/[id]/enrich/route.ts deletes all moment_gems then re-inserts
- Change to: keep existing, run matching, merge by gem_id (keep higher score), insert new ones
- Update gems_matched_count to reflect merged total

Read app/api/moments/[id]/enrich/route.ts, implement the changes, verify the build passes, and commit.
```

### Stories 18.3 + 18.4 (personalization — do after core enrichment)

```
Read the task file at Tasks/epic-18-enhanced-enrichment.md and implement stories 18.3 (personalized chip ordering) and 18.4 (attendee-based learning).

Key context:
- 18.3 requires a new DB table (user_chip_preferences) — create the migration SQL and note it for Kay to run
- 18.4 requires adding attendees column to calendar_events_cache — create migration SQL
- Both stories enhance the learning system with new signal types

IMPORTANT: Create migration SQL files but DO NOT run them. Place them in a migrations/ directory and note in the commit message that Kay needs to run them in Supabase.

Read the existing files, implement the changes, verify the build passes, and commit.
```

---

## Epic 19: Moments Stickiness

### Story 19.1 — Post-event reflection

```
Read the task file at Tasks/epic-19-moments-stickiness.md and implement story 19.1 (post-event reflection prompt).

Key context:
- This is a major feature — new component, new API route, new DB columns
- Create ReflectionPrompt component showing after an event ends
- Show in Apply quadrant for moments whose events have passed
- Quick rating + thought confirmation + optional new gem capture
- Create migration SQL for new columns (reflection_rating, reflection_note, reflected_at) but DO NOT run it

Read the existing files (ApplyQuadrant.tsx, PrepCard.tsx, types/moments.ts, lib/moments/learning.ts), implement the changes, verify the build passes, and commit.
```

### Story 19.2 — Connect moments to graduation

```
Read the task file at Tasks/epic-19-moments-stickiness.md and implement story 19.2 (connect moments to gem graduation).

Key context:
- When "Got it" is clicked in PrepCard, also increment the gem's application_count
- Check if application_count reaches graduation threshold (5) and update status to 'graduated'
- The gems table has application_count and status columns
- Be careful about the server-side vs client-side split — the increment should happen server-side

Read PrepCard.tsx, lib/thoughts.ts (or wherever gem updates happen), and the helpful API route. Implement the changes, verify the build passes, and commit.
```

### Story 19.3 — Export prep notes

```
Read the task file at Tasks/epic-19-moments-stickiness.md and implement story 19.3 (prep card export / copy-to-clipboard).

Key context:
- Simple feature — add a "Copy" button to PrepCard header
- Format matched thoughts as a readable text block
- Use navigator.clipboard.writeText()
- Show toast on copy

Read components/moments/PrepCard.tsx, implement the changes, verify the build passes, and commit.
```

### Story 19.4 — Moment templates

```
Read the task file at Tasks/epic-19-moments-stickiness.md and implement story 19.4 (moment templates for manual creation).

Key context:
- Create lib/moments/templates.ts with template definitions
- Add template selection UI in MomentEntryModal
- Templates pre-fill description, event type, and context chips
- User can modify before submitting

Read the existing files (MomentEntryModal.tsx, title-analysis.ts for chip data), implement the changes, verify the build passes, and commit.
```

### Story 19.5 — Weekly recap

```
Read the task file at Tasks/epic-19-moments-stickiness.md and implement story 19.5 (weekly moments recap in TF Insights).

Key context:
- Add a "moments_recap" insight type to the TF Insights system
- Generate based on the past week's moments data
- Surface in the existing TFInsight component

Read app/api/tf/insights/route.ts and components/home/TFInsight.tsx for the existing insight system. Implement the changes, verify the build passes, and commit.
```

---

## Full Phase Prompts

### Phase 1 — Foundation (Epic 15, all stories)

```
I'm working on improving the moments feature in gemkeeper. Start with the foundation cleanup.

Read Tasks/epic-15-moments-foundation-cleanup.md and implement all 6 stories in order (15.1 through 15.6).

This is a Next.js/Supabase/TypeScript app. For each story: read the relevant files, implement the fix, verify build passes (npm run build), and commit separately.

Key things to watch for:
- 15.1: Import LEARNING_HELPFUL_THRESHOLD from lib/types/learning.ts, don't hardcode
- 15.2: Call recordMomentThoughtFeedback(id, true) in handleGotIt, not just markThoughtReviewed
- 15.3: Filter moments by status='active' for the homepage upcoming section
- 15.4: Grep for UpcomingMomentsCard imports before deleting
- 15.5: createMomentWithMatching must be server-side (uses server Supabase client)
- 15.6: Update all consumers before removing aliases
```

### Phase 2 — Reliability + UX (Epics 16.1-16.3, 17.1-17.3, 18.1-18.2, 18.5)

```
I'm working on Phase 2 of moments improvements. Read these task files for context:
- Tasks/epic-16-reliable-calendar-sync.md (stories 16.1, 16.2, 16.3)
- Tasks/epic-17-smarter-apply-quadrant.md (stories 17.1, 17.2, 17.3)
- Tasks/epic-18-enhanced-enrichment.md (stories 18.1, 18.2, 18.5)

Implement in this order:
1. 16.1 (server-side cron sync)
2. 16.2 (catch-up on app load)
3. 17.1 (calendar events in Apply quadrant)
4. 17.2 + 17.3 (urgency + quality indicators)
5. 18.5 (merge enrichment matches)
6. 18.1 + 18.2 (always-available enrichment + manual enrichment)
7. 16.3 (sync health indicator)

Commit each story or logical group separately. Verify build passes after each.
```

### Phase 3 — Stickiness (Epic 19 + remaining 17/18)

```
I'm working on Phase 3 of moments improvements — stickiness and habit loop. Read these task files:
- Tasks/epic-19-moments-stickiness.md (stories 19.1-19.5)
- Tasks/epic-17-smarter-apply-quadrant.md (story 17.4)
- Tasks/epic-18-enhanced-enrichment.md (stories 18.3, 18.4)

Implement in this order:
1. 19.3 (export — quick win, no dependencies)
2. 19.4 (templates — quick win, no dependencies)
3. 19.2 (graduation connection)
4. 19.1 (post-event reflection — largest story)
5. 17.4 (inline thought preview)
6. 19.5 (weekly recap)
7. 18.3 (personalized chips)
8. 18.4 (attendee learning)

For stories requiring DB migrations (19.1, 18.3, 18.4): create migration SQL files in a migrations/ directory but DO NOT run them. Note in commit messages that they need to be run in Supabase.

Commit each story separately. Verify build passes after each.
```
