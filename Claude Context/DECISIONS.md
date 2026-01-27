# ThoughtFolio Decision Log

This document tracks key product and technical decisions with their rationale. Check here before proposing approaches that might conflict with established decisions.

---

## How to Use This Document

**Before making a decision:**
1. Search this doc for related past decisions
2. If proposing something that conflicts, discuss with Kay first

**After making a decision:**
1. Add entry with date, decision, rationale, and alternatives considered
2. Keep entries concise but complete enough to understand "why"

---

## Product Decisions

### 2024-XX-XX: Constraint-Based Design (10 Thought Limit)

**Decision:** Limit users to 10 active thoughts at a time on their Active List.

**Rationale:**
- Forces prioritization over hoarding
- Creates a "knowledge portfolio" mindset rather than a dumping ground
- Differentiates from Readwise and other "save everything" tools
- Psychological research supports constraints for behavior change

**Alternatives Considered:**
- Unlimited thoughts with smart filtering → Rejected: doesn't force prioritization
- Tiered limits (free vs. paid) → Deferred: may revisit for monetization

---

### 2024-XX-XX: Proactive Surfacing Over Passive Storage

**Decision:** ThoughtFolio proactively surfaces thoughts rather than waiting for users to search.

**Rationale:**
- Most note apps fail because content is captured but never revisited
- Calendar integration enables contextual relevance
- Daily prompts create habit loops
- Differentiates from Google NotebookLM, Notion, etc.

**Alternatives Considered:**
- Search-first design → Rejected: doesn't solve "I forgot I saved this" problem
- AI-only surfacing → Rejected: users want some control over timing

---

### 2025-01-XX: Rebrand from GemKeeper to ThoughtFolio

**Decision:** Rename the product from GemKeeper to ThoughtFolio with tagline "Thoughts that find you."

**Rationale:**
- "GemKeeper" sounds like a game or jewelry app
- "ThoughtFolio" communicates thought/knowledge curation
- Tagline emphasizes proactive surfacing (key differentiator)
- More professional, scalable brand

**Alternatives Considered:**
- Keep GemKeeper → Rejected: branding confusion
- WisdomKeeper → Rejected: too on-the-nose
- InsightFolio → Rejected: sounds like analytics tool

---

### 2025-01-XX: Individual Thought Scheduling (Epic 8)

**Decision:** Allow users to set custom check-in times per thought, not just global preferences.

**Rationale:**
- Different thoughts are relevant at different times (morning motivation vs. evening reflection)
- Gives users control while maintaining proactive surfacing
- Enables "right thought at the right time" experience

**Alternatives Considered:**
- Global schedule only → Rejected: too inflexible
- AI-only timing → Rejected: users want predictability and control

---

### 2025-01-XX: Moments Feature (On-Demand Matching)

**Decision:** Let users describe upcoming situations to receive AI-matched relevant thoughts.

**Rationale:**
- Bridges scheduled surfacing and search
- High-value moments (presentations, difficult conversations) benefit from prep
- Creates "coach in your pocket" experience
- Validates thought relevance through practical application

**Alternatives Considered:**
- Calendar-only matching → Rejected: not all important moments are calendared
- No matching, just manual selection → Rejected: defeats purpose of AI assistance

---

### 2025-01-25: Thought Status Model Clarification

**Decision:** Four explicit statuses + separate Active List boolean:

| Status | Meaning | Visible In |
|--------|---------|------------|
| `active` | Available thought | Thoughts page |
| `passive` | Available but dormant | Thoughts page (filtered) |
| `retired` | Archived, historical | Retired page |
| `graduated` | Applied 5+ times, mastered | ThoughtBank |

`is_on_active_list` (boolean) is separate — controls daily prompt inclusion (max 10).

**Rationale:** 
- Status = lifecycle state (where is this thought in its journey?)
- Active List = engagement choice (am I focusing on this now?)
- These are orthogonal concerns and should remain separate
- Clear user mental model: status is "what kind of thought is this", Active List is "am I working on this now"

**Consequences:**
- UI needs filter tabs: All / Active List / Passive
- Retired page needed for archived thoughts
- Delete = hard delete (row removed from database)
- Constraint updated: `CHECK (status IN ('active', 'passive', 'retired', 'graduated'))`
- Thoughts page only shows `status IN ('active', 'passive')`
- Moments searches only `status IN ('active', 'passive')`
- Daily prompts only pull `is_on_active_list = true AND status IN ('active', 'passive')`

**Alternatives Considered:**
- Single status field with "active_list" as a status → Rejected: conflates lifecycle with engagement
- No passive status (just active/retired/graduated) → Rejected: need distinction between "available" and "dormant"
- Soft delete instead of hard delete → Rejected: user expects delete to mean delete

---

### 2025-01-26: Discover Something New! Feature (Epic 12)

**Decision:** Add AI-powered content discovery that finds external knowledge based on user's contexts and interests.

**Rationale:**
- Users want to expand their knowledge library without manual searching
- Contexts provide strong signal for personalization
- Complements existing "capture your own" model with "discover new" capability
- Limited to 8/day (4 curated + 4 directed) to prevent endless scrolling
- User always controls what becomes "their" thought (edit before save)

**Key Design Choices:**
1. **Dashboard card only** — no sidebar nav, keeps discovery as invitation not distraction
2. **Grid of 4** — user browses and picks, not forced linear flow
3. **Three paths** — free-text search, context chips, "Surprise Me"
4. **Separate session limits** — encourages both exploration modes without competing
5. **Skipped content tracking** — prevents re-suggesting rejected content
6. **User edits before saving** — preserves "user's words" principle
7. **Fresh daily** — no persistence of unseen discoveries

**Alternatives Considered:**
- Single daily session (8 total) → Rejected: wanted to encourage both exploration modes
- Card-by-card flow → Rejected: less browsable, more pressure
- Sidebar nav item → Rejected: too prominent, could become distraction
- Persist unseen discoveries → Rejected: simpler to refresh daily

**Consequences:**
- New database tables: discoveries, discovery_usage, discovery_skips
- New API routes: /api/discover/*
- Gemini grounding feature required for web search
- Dashboard component changes
- May need to monitor API costs

**Product Principle Alignment:**
- "User's Words, User's Knowledge" — AI finds raw material, user decides what becomes their thought
- "Right Thought, Right Time" — context-aware discovery
- "Gentle Accountability" — no pressure to save, lightweight skip

---

### 2025-01-26: Terminology Update - Knowledge over Wisdom

**Decision:** Use "knowledge" and "thoughts" instead of "wisdom" throughout the product.

**Rationale:**
- "Wisdom" feels pretentious and heavy
- "Knowledge" is more accessible and accurate
- "Thoughts" already established as primary term
- Aligns better with the practical, actionable nature of the app

**Alternatives Considered:**
- Keep "wisdom" → Rejected: user feedback indicated it felt too lofty
- "Insights" → Rejected: sounds too corporate/analytical

---

### 2026-01-XX: Glassmorphism UI Overhaul

**Decision:** Implement a glassmorphism design system with dark/light theme support across the entire application.

**Rationale:**
- Modern, visually appealing aesthetic
- Creates depth and hierarchy through transparency
- Differentiates from typical flat design
- Theme toggle allows user preference
- Consistent with premium app feel

**Implementation:**
- Cards use `bg-card/80 backdrop-blur-sm` for glass effect
- Dropdowns use solid `bg-popover` for legibility (important lesson learned)
- Smooth transitions on hover states
- Theme persisted in localStorage

**Alternatives Considered:**
- Keep flat design → Rejected: less engaging, doesn't feel premium
- Full glassmorphism everywhere → Rejected: dropdowns need solid backgrounds for readability

**Consequences:**
- All pages updated (KAY-81 through KAY-89)
- Theme toggle added to header
- Some components required solid backgrounds (dropdowns, menus)

---

### 2026-01-XX: Epic 8 (Moments) Completed

**Decision:** Ship Moments feature with individual scheduling, AI matching, and Google Calendar integration.

**Status:** COMPLETED

**Key Learnings:**
- Calendar OAuth requires careful token refresh handling
- AI matching works best searching ALL thoughts, not just Active List
- Moments are valuable for "right thought, right time" use case
- Auto-moment creation from calendar events enhances proactive surfacing

---

### 2026-01-XX: Epic 12 (Discovery) Completed

**Decision:** Ship Discovery feature with AI-powered web search using Google Search grounding.

**Status:** COMPLETED

**Key Learnings:**
- Gemini 1.5 Flash required for Google Search grounding (not 2.0 Flash)
- 4 discoveries per session is the right balance
- Separate curated and directed limits encourage both exploration modes
- User editing before save preserves "user's words" principle
- Skipped content tracking prevents annoying re-suggestions

---

### 2026-01-XX: Notes as Standalone Feature

**Decision:** Implement Notes as a standalone long-form content feature, separate from atomic thoughts, with ability to extract thoughts from notes.

**Rationale:**
- Atomic thoughts are limited to 200 chars — users need a place for longer content
- Many workflows start with detailed notes, then distill key insights
- "Extract from notes" creates a bridge between note-taking and thought capture
- Folder organization provides structure for long-form content
- Tags and favorites enable quick access patterns

**Key Design Choices:**
1. **Separate from thoughts** — Notes are not attached to thoughts; they're standalone documents
2. **Markdown support** — Rich formatting for detailed content
3. **No character limit** — Unlike thoughts (200 chars), notes have unlimited length
4. **Extract-to-thoughts** — AI can identify key insights in notes and create thoughts from them
5. **Folder organization** — Hierarchical structure for note management
6. **Tags + favorites** — Quick access patterns without rigid structure

**Alternatives Considered:**
- Notes as thought attachments only → Rejected: too limiting for standalone note-taking use case
- No notes feature, just longer thoughts → Rejected: violates constraint-based design principle
- Third-party note integration (Notion, etc.) → Rejected: fragmented experience, loses extract capability

**Consequences:**
- New database table: `notes` (with tags, is_favorite fields)
- New components: note-editor, note-card, notes-list, extract-from-note-modal
- New server actions in `app/notes/actions.ts`
- Folder system via `app/folders/actions.ts`

**Important Distinction:**
- **Notes** = standalone documents (this feature)
- **Thought Reflections** = notes attached to individual thoughts (Section 7 in PRD)
- These are different features serving different purposes

---

### 2026-01-26: Bug Fix - Total Thought Limit Removal

**Decision:** Remove the incorrect total thought limit from thought creation endpoints.

**Bug Description:** The `createThought` server action and bulk creation endpoints were incorrectly counting ALL thoughts with `status IN ('active', 'passive')` and blocking new thought creation when the count reached 10. This was wrong — the limit of 10 should only apply to the **Active List** (`is_on_active_list = true`), not total thoughts.

**Root Cause:** Remnant code from an older design where there was a hard limit of 10 total thoughts. The current design allows unlimited total thoughts with only the Active List constrained to 10.

**Files Fixed:**
- `app/thoughts/actions.ts` - Removed limit check from `createThought`
- `app/api/thoughts/bulk/route.ts` - Removed limit check
- `app/api/gems/bulk/route.ts` - Removed limit check (legacy endpoint)
- `components/thought-form.tsx` - Removed client-side limit UI
- `components/extract-thoughts-modal.tsx` - Removed limit warning

**Correct Behavior:**
- Users can create **unlimited thoughts** (they go to Passive by default)
- Active List limit of 10 is enforced **only** in `toggleActiveList()` when adding a thought to the Active List
- New thoughts are created with `is_on_active_list = false` by default

**Lesson Learned:** When refactoring from a constrained model (10 total thoughts) to a more flexible model (unlimited total, 10 Active List), ensure all code paths are updated — not just the primary ones.

---

### 2026-01-27: Bug Fix - Dashboard Check-in State Display

**Decision:** Update DailyThoughtCard to show three distinct states based on `alreadyCheckedIn` flag from `getDailyThought()`.

**Bug Description:** The dashboard "Today's Thought" card showed "No active thoughts yet" even when the user had active thoughts on their Active List. This occurred when the user had already completed their evening check-in for the day.

**Root Cause:** `getDailyThought()` returns `{ thought: null, alreadyCheckedIn: true }` after the user completes their evening check-in. The home page and `DailyThoughtCard` component weren't using the `alreadyCheckedIn` value — they only checked if `thought` was null and displayed a misleading message.

**Files Fixed:**
- `app/home/page.tsx` - Track and pass `alreadyCheckedIn` state to DailyThoughtCard
- `components/home/DailyThoughtCard.tsx` - Handle three distinct states

**Correct Behavior (now):**
| State | Condition | Display |
|-------|-----------|---------|
| Thought available | `thought` exists | Shows thought with context badge, content, source |
| Already checked in | `thought: null, alreadyCheckedIn: true` | "You've completed your check-in for today!" |
| No Active thoughts | `thought: null, alreadyCheckedIn: false` | "No thoughts on your Active List yet" |

**Lesson Learned:** When functions return multiple state signals (thought + alreadyCheckedIn + error), ensure all consuming components use all relevant signals to display accurate UI states.

---

## Technical Decisions

### 2024-XX-XX: Google Gemini API Over Anthropic

**Decision:** Use Google Gemini API for AI features, not Anthropic Claude API.

**Rationale:**
- Cost-effective for the use cases (extraction, matching)
- Good balance of capability and price
- Simpler billing than Anthropic for indie project

**Alternatives Considered:**
- Anthropic Claude → Rejected: higher cost, overkill for current needs
- OpenAI → Rejected: similar cost concerns
- Local models → Rejected: complexity, hosting costs

**Note:** Billing must be enabled on Google Cloud project. Free tier quotas are insufficient for production use.

---

### 2024-XX-XX: Supabase for Auth and Database

**Decision:** Use Supabase for authentication, database, and real-time features.

**Rationale:**
- Integrated auth + Postgres in one service
- Row Level Security for data isolation
- Good free tier for development
- SQL access via dashboard (important for Kay's workflow)

**Alternatives Considered:**
- Firebase → Rejected: NoSQL less suitable for relational data
- PlanetScale + separate auth → Rejected: more services to manage
- Self-hosted Postgres → Rejected: operational overhead

---

### 2024-XX-XX: Vercel for Deployment

**Decision:** Deploy Next.js app on Vercel with auto-deploy from main branch.

**Rationale:**
- Native Next.js support
- Zero-config deployments
- Environment variable management via dashboard
- Free tier sufficient for current scale

**Alternatives Considered:**
- Netlify → Viable but less Next.js integration
- Railway → More complex for Kay's workflow
- Self-hosted → Operational overhead

---

### 2025-01-XX: Database Migrations via Supabase SQL Editor

**Decision:** Run database migrations through Supabase SQL Editor, not CLI tools.

**Rationale:**
- Kay doesn't use terminal directly
- Visual confirmation of changes
- Matches existing workflow
- Adequate for project scale

**Alternatives Considered:**
- Supabase CLI migrations → Rejected: terminal dependency
- Prisma migrations → Rejected: adds complexity, Kay can't run locally

---

### 2025-01-XX: Task Files in Repo Root

**Decision:** Store task files in `/tasks/` folder at repo root, not nested in `.claude/`.

**Rationale:**
- High visibility for active work
- Clear separation: `/tasks/` = active, `/.claude/` = reference
- Easier to spot current work when opening repo
- Supports parallel agent workflows with named task files

**Alternatives Considered:**
- Single TASKS.md in root → Rejected: doesn't support parallel agents
- Tasks in .claude/ → Rejected: buries active work with reference docs

---

### 2026-01-27: Merge Daily Prompt and Check-in into Single Daily Check-in

**Decision:** Merge the separate "Daily Prompt" (morning) and "Check-in" (evening) flows into a single "Daily Check-in" interaction.

**Previous Design:**
- Morning `/daily`: "Will you apply this thought today?" (Yes/Maybe/No)
- Evening `/checkin`: "Did you apply this thought today?" (Yes/No + reflection)
- Two separate pages, two touchpoints per day

**New Design:**
- Single `/checkin` page: "Did you apply this thought today?" (Yes/No + reflection)
- One touchpoint per day, user can check in anytime
- `/daily` redirects to `/checkin`

**Rationale:**
- The morning prompt didn't track anything meaningful — only evening "Yes" incremented `application_count`
- Morning was purely psychological (commitment device) with no enforcement
- Redundant interaction: same thought shown twice daily with slightly different questions
- Simpler mental model: "check in once a day"
- Less friction for users
- Graduation system (5+ applications) only cared about evening responses anyway

**Files Changed:**
- `app/checkin/page.tsx` — Renamed to "Daily Check-in", updated icons/colors
- `app/daily/page.tsx` — Now redirects to `/checkin`
- `components/layout-shell.tsx` — Removed "Daily Prompt" nav item, renamed "Check-in" to "Daily Check-in"
- `components/home/DailyThoughtCard.tsx` — Added "Check In" button
- `lib/thoughts.ts` — Added `daily_checkin` type, backward-compatible with `evening_checkin`

**Alternatives Considered:**
- Keep both, clarify roles → Rejected: morning prompt adds complexity without value
- Make morning track something → Rejected: over-engineering for unclear benefit

---

### 2026-01-27: ThoughtFolio 2.0 PKM Pivot - Phase 1 & 2

**Decision:** Implement the foundation for ThoughtFolio 2.0 PKM Pivot with full-text search infrastructure and supporting types/services.

**Rationale:**
- Users need to quickly find content across their knowledge base (thoughts, notes, sources)
- Cmd+K search is an expected pattern in modern productivity apps
- Sources as first-class entities enables better organization and discovery
- Bi-directional note-thought linking creates a knowledge graph
- PostgreSQL full-text search provides fast, scalable search without external services

**Implementation (Phase 1 - Foundation):**
1. TypeScript types for Source, NoteThoughtLink, Search
2. Updated Profile type with focus_mode_enabled, active_list_limit, checkin_enabled
3. Updated CalendarConnection type with Microsoft provider support
4. CRUD services for sources and note-thought links
5. Full-text search service with FTS and ILIKE fallback

**Implementation (Phase 2 - Search UI):**
1. GlobalSearch modal component with Cmd+K shortcut
2. SearchResults with grouped display by type
3. SearchResultCard with term highlighting
4. SearchFilters for type filtering
5. useGlobalShortcuts hook for keyboard shortcuts
6. Search API endpoint (/api/search)
7. Integration in layout-shell.tsx

**Key Design Choices:**
- PostgreSQL FTS first (simpler, cheaper) with ILIKE fallback
- Search modal (Spotlight-style) rather than search page
- Type filtering via filter buttons, not dropdown
- Keyboard navigation with arrow keys and Enter
- Grouped results by type (Thoughts, Notes, Sources)

**Alternatives Considered:**
- External search service (Algolia, etc.) → Rejected: adds complexity and cost
- Search page instead of modal → Rejected: more friction, less discoverable
- AI-powered semantic search → Deferred: can add later with pgvector

**Consequences:**
- New files: lib/types/source.ts, lib/types/note-link.ts, lib/types/search.ts
- New services: lib/sources.ts, lib/note-links.ts, lib/search.ts
- New API: app/api/search/route.ts
- New components: components/search/*
- New hook: lib/hooks/useGlobalShortcuts.ts
- Updated: layout-shell.tsx, lib/types.ts, types/calendar.ts

---

## Deferred Decisions

Items we've discussed but intentionally not decided yet:

- **Push notifications:** Deferred to future iOS app version
- **Monetization model:** Deferred until product-market fit validated
- **Multi-theme system:** Planned but not yet prioritized
- **Team/shared thoughts:** Out of scope for v1

---

## Template for New Decisions

```markdown
### YYYY-MM-DD: [Decision Title]

**Decision:** [Clear statement of what was decided]

**Rationale:**
- [Reason 1]
- [Reason 2]

**Alternatives Considered:**
- [Alternative 1] → Rejected: [why]
- [Alternative 2] → Rejected: [why]
```
