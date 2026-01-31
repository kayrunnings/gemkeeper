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
- 8 discoveries per session with refresh capability provides better variety
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

### 2026-01-27: ThoughtFolio 2.0 PKM Pivot - Phase 3 & 4 (Navigation & Library)

**Decision:** Implement unified Library page and updated navigation as part of PKM Pivot.

**Rationale:**
- Users need a single place to browse all their content (thoughts, notes, sources)
- Tabbed interface provides clear organization by content type
- Context filter enables cross-content filtering
- Mobile bottom navigation improves discoverability of key features
- Sidebar Library section with sub-items matches information architecture
- Quick actions reduce friction for common tasks

**Implementation (Phase 3 - Navigation):**
1. Updated BottomNavigation with 4 tabs: Home, Library, Active, Discover
2. Sidebar Library section with expandable sub-items (All, Thoughts, Notes, Sources, Archive)
3. Quick action buttons in sidebar (AI Capture, New Moment)
4. QuickActionsRow on home page with three cards

**Implementation (Phase 4 - Library):**
1. /library page with URL-based tab state
2. LibraryTabs component for tab navigation
3. Five tab components: All, Thoughts, Notes, Sources, Archive
4. ContextChipsFilter for cross-tab filtering
5. SourceCard component for source display
6. Source detail page at /library/sources/[id]

**Key Design Choices:**
- URL state for tabs (?tab=thoughts) enables deep linking
- Context filter only shows for tabs that support it (All, Thoughts, Archive)
- Load more button instead of infinite scroll (simpler implementation)
- Archive tab includes restore and delete actions with confirmation
- Sidebar remains collapsible, Library expands/collapses within

**Alternatives Considered:**
- Separate pages for each content type → Rejected: more fragmented, harder to discover
- Infinite scroll → Rejected: load more is simpler and gives user control
- Floating action button for Moments → Deferred: can add later

**Consequences:**
- New route: /library with tabbed layout
- New route: /library/sources/[id] for source detail
- Updated home page with QuickActionsRow and ContextChipsFilter
- Updated sidebar with expandable Library section
- Mobile bottom navigation added
- Existing /thoughts and /notes pages still work (not replaced)

---

### 2026-01-27: ThoughtFolio 2.0 PKM Pivot - Phase 7, 8, 9 (Settings & Discovery)

**Decision:** Implement Focus Mode settings, enhanced Discovery with saved discoveries, and Microsoft Calendar placeholder.

**Rationale:**
- Users need control over Active List limit (Focus Mode allows 10-25)
- Users want to bookmark discoveries for later processing
- Microsoft Calendar prep enables future enterprise adoption
- Check-in toggle gives users control over dashboard experience

**Implementation (Phase 7 - Microsoft Calendar):**
1. Created `lib/calendar-microsoft.ts` placeholder service
2. Updated `CalendarSettings.tsx` with Microsoft section (Coming Soon badge)
3. Created API routes `/api/calendar/microsoft/auth` and `/callback`
4. All functions return appropriate errors until Azure AD configured

**Implementation (Phase 8 - Enhanced Discovery):**
1. Created `DiscoverTabs.tsx` with For You, Explore, Saved tabs
2. Created `SavedDiscoveriesTab.tsx` for bookmarked discoveries list
3. Added bookmark button to `DiscoveryCard.tsx` with optimistic UI
4. Created API routes `/api/discover/bookmark` (POST/DELETE) and `/api/discover/saved`
5. Added save/unsave functions to `lib/discovery.ts`
6. Updated `Discovery` type with `saved_at` field
7. Created `/app/discover/page.tsx` with tabbed interface

**Implementation (Phase 9 - Focus Mode Settings):**
1. Added server actions: `updateFocusMode`, `updateActiveListLimit`, `updateCheckinEnabled`
2. Created `components/ui/slider.tsx` (Radix UI slider)
3. Updated Settings page with Focus Mode toggle, Active List limit slider, Check-in toggle
4. Updated `toggleActiveList` and `createMultipleThoughts` to respect profile's `active_list_limit`
5. Updated dashboard to conditionally show DailyThoughtCard based on `checkin_enabled`

**Key Design Choices:**
- Focus Mode is opt-in (default limit remains 10)
- Active List limit range 10-25 allows flexibility without removing constraint
- Saved discoveries persist until manually removed
- Microsoft Calendar uses same interface as Google for future parity
- Check-in toggle hides dashboard card but doesn't disable check-in functionality

**Alternatives Considered:**
- Unlimited Active List → Rejected: violates constraint-based design principle
- Auto-expire saved discoveries → Rejected: users want control
- Full Microsoft implementation → Deferred: requires Azure AD credentials

**Consequences:**
- New profile fields: `focus_mode_enabled`, `active_list_limit`, `checkin_enabled`
- New discovery field: `saved_at`
- New components: DiscoverTabs, SavedDiscoveriesTab, Slider
- New API routes: /api/discover/bookmark, /api/discover/saved, /api/calendar/microsoft/*
- New service: lib/calendar-microsoft.ts

---

### 2026-01-27: ThoughtFolio 2.0 PKM Pivot - Phase 10 (Polish & Launch)

**Decision:** Complete the PKM Pivot with comprehensive testing, performance optimizations, and documentation updates.

**Rationale:**
- Tests ensure reliability and catch regressions
- Search caching improves UX with faster repeated queries
- Lazy loading reduces initial bundle size and improves TTI
- React.memo reduces unnecessary re-renders in lists
- Documentation ensures maintainability

**Implementation:**

1. **Testing**
   - Unit tests for search service (empty queries, authentication, type filtering, pagination)
   - Unit tests for sources service (CRUD operations, getSourceByUrl deduplication)
   - Component tests for GlobalSearch (modal open/close, debouncing, keyboard nav)
   - Component tests for AICaptureModal (states, content detection, save flow)

2. **Performance Optimizations**
   - Search result caching with 30s TTL and max 100 entries
   - Library tabs lazy loaded with React.lazy and dynamic imports
   - React.memo added to SearchResultCard, SourceCard, SearchFilters

3. **Documentation**
   - Updated ARCHITECTURE.md Feature Status
   - Added search caching documentation
   - Added decisions for full-text search, sources, library architecture

**Key Design Choices:**
- 30-second cache TTL balances freshness and performance
- Cache limited to 100 entries to prevent memory issues
- Lazy loading at tab level, not individual cards
- React.memo for list items that receive stable props

**Consequences:**
- New test files in __tests__/lib/ and __tests__/components/
- Search service exports clearSearchCache() for cache invalidation
- Library page uses Suspense for tab loading states

---

### 2026-01-28: Major UX Overhaul - Themes, Glassmorphism, AI-Forward Design

**Decision:** Implement comprehensive UX improvements including 16-theme system, enhanced glassmorphism, AI-forward components, and consistent state handling.

**Rationale:**
- App needed to feel like "the slickest newest AI supercharged app"
- Single dark/light toggle was limiting for user personalization
- AI features needed visual prominence to communicate value
- Loading and empty states were inconsistent across the app
- Navigation labels needed clarity ("Active" was confusing)

**Implementation:**

1. **16-Theme System (14 dark + 2 light)**
   - New dark themes: Cyber, Copper, Slate, Aurora, Ember, Onyx
   - New light theme: Daylight
   - Theme picker dropdown in header with preview colors
   - Theme metadata with categories (dark/light) in `lib/themes.ts`

2. **Enhanced Glassmorphism**
   - CSS custom properties for all glass effects (`--glass-card-*`)
   - Increased blur (20px) with backdrop saturation (180%)
   - Layered shadows for depth
   - Top border highlight for 3D effect
   - Hover states with glow effects
   - Theme-specific glass utility classes

3. **AI-Forward Components**
   - `AIBadge` - "AI Powered" indicator in 3 variants
   - `AICard` - Card wrapper with AI glow effects
   - `AIThinking` - Animated thinking state with bouncing dots
   - `AIShimmer` - Loading shimmer effect
   - CSS classes: `.ai-gradient`, `.ai-glow`, `.ai-sparkle`

4. **State Components**
   - `LoadingState` with 3 variants (default, minimal, fullscreen)
   - `CardSkeleton` and `ListSkeleton` for content loading
   - `EmptyState` with 9 content-specific variants
   - `InlineEmptyState` for compact spaces

5. **Animations & Microinteractions**
   - Entry: `bounce-in`, `slide-up`, `pop`
   - Interactive: `wiggle`, `glow-pulse`
   - Hover: `hover-lift`, `hover-scale`, `hover-glow`
   - Touch: `press-effect`

6. **Navigation Updates**
   - "Active" → "Check-in" (clearer purpose)
   - Consolidated on Phosphor icons
   - CheckCircle for Check-in, CalendarCheck for Moments

7. **Dashboard Improvements**
   - Smart contextual greeting based on user state
   - Reordered cards (DailyThought first, Stats last)
   - AI styling on DiscoverCard

**Files Created:**
- `components/theme-picker.tsx` - Theme dropdown
- `components/ui/ai-badge.tsx` - AI components
- `components/ui/loading-state.tsx` - Loading components
- `components/ui/empty-state.tsx` - Empty state components

**Files Modified:**
- `lib/themes.ts` - Theme definitions and metadata
- `app/globals.css` - ~1500 lines for themes, glass, animations
- `components/layout-shell.tsx` - Navigation, ThemePicker
- `components/layout/BottomNavigation.tsx` - Icons, labels
- `components/discover/DiscoverCard.tsx` - AI styling
- `app/home/page.tsx` - Smart greeting, card order

**Alternatives Considered:**
- Keep simple dark/light toggle → Rejected: users want personalization
- Use inline styles for glass effects → Rejected: CSS variables are more maintainable
- AI features as subtle UI → Rejected: AI is key differentiator, should be prominent
- Different animation library → Rejected: CSS animations are lighter weight

**Consequences:**
- 16 themes require maintenance when updating color palette
- AI components should be used consistently across all AI features
- Loading/empty states should replace ad-hoc implementations

---

### 2026-01-28: Enhanced Explore/Discover UX

**Decision:** Increase discovery count from 4 to 8 per session and add refresh capability.

**Rationale:**
- 4 discoveries often felt limiting when exploring a broad topic
- Users wanted more variety without having to close and re-search
- Refresh allows users to get fresh suggestions while staying in context
- Better loading animations (AIThinking) improve perceived performance

**Changes Made:**
1. **8 discoveries per session** — AI prompts updated to generate 8 instead of 4
2. **Refresh button** — Added to DiscoveryGrid header to get new suggestions
3. **Loading animations** — AIThinking component used in ExploreTab for consistent UX
4. **State tracking** — Components track last search context for proper refresh

**Files Modified:**
- `lib/ai/gemini.ts` - AI prompts updated (4→8 discoveries)
- `components/discover/DiscoveryGrid.tsx` - Added refresh button, shows count
- `components/discover/ExploreTab.tsx` - Added refresh support, AI loading
- `components/discover/DiscoverCard.tsx` - Added refresh support

**Consequences:**
- Higher AI token usage per session (more discoveries generated)
- Better user experience with more variety and control
- Consistent loading animations across Discover features

---

### 2026-01-29: Calendar Auto-Sync with Configurable Frequency

**Decision:** Add automatic background calendar syncing with user-configurable frequency options.

**Rationale:**
- Users reported calendar events not showing up without manual sync
- Moments only appear when events are within lead time — users need events synced regularly
- Auto-sync reduces friction for calendar integration
- Configurable frequency gives users control over battery/data usage

**Implementation:**
1. **Database:** Added `sync_frequency_minutes` column to `calendar_connections` (default: 15)
2. **Types:** Added `SYNC_FREQUENCY_OPTIONS` constant with 5 options: Manual only (0), 5/15/30/60 minutes
3. **UI:** Added "Auto-sync frequency" setting in CalendarSettings with button options
4. **Hook:** Created `useCalendarAutoSync` in `lib/hooks/useCalendarAutoSync.ts`
5. **Integration:** Hook runs in `LayoutShell` to provide app-wide background sync
6. **Dashboard:** Updated `UpcomingMomentsCard` to show calendar events from cache even if moments not yet created

**Auto-sync Behavior:**
- Hook checks every 60 seconds if any calendars need syncing
- Compares `last_sync_at` + `sync_frequency_minutes` against current time
- Only syncs connections where `sync_frequency_minutes > 0`
- After syncing, automatically calls `/api/calendar/check-moments` to create moments
- Prevents concurrent sync operations

**Dashboard Display:**
- **Moments** (solid blue background) — Events within lead time that have been converted to moments
- **Upcoming events** (dashed border) — Events synced from calendar but not yet within lead time
- Shows contextual message when calendar connected but no events: "No events in the next 24 hours"
- Only shows "Connect Calendar" button when calendar is NOT connected

**Files Changed:**
- `types/calendar.ts` — Added `sync_frequency_minutes` to CalendarConnection, added SYNC_FREQUENCY_OPTIONS
- `lib/calendar.ts` — Default sync_frequency_minutes: 15 on new connections
- `lib/calendar-client.ts` — Added sync_frequency_minutes to updateCalendarSettings
- `lib/hooks/useCalendarAutoSync.ts` — New hook for background auto-sync
- `components/settings/CalendarSettings.tsx` — Added auto-sync frequency UI
- `components/layout-shell.tsx` — Integrated useCalendarAutoSync hook
- `components/home/UpcomingMomentsCard.tsx` — Shows cached events + calendarConnected prop
- `app/home/page.tsx` — Pass calendarConnected prop to UpcomingMomentsCard

**Alternatives Considered:**
- Server-side cron job → Rejected: adds infrastructure complexity, harder to debug
- Sync on every page load → Rejected: too aggressive, poor UX
- No auto-sync (manual only) → Rejected: too much friction for users

**Consequences:**
- Requires database migration: `ALTER TABLE calendar_connections ADD COLUMN sync_frequency_minutes INTEGER DEFAULT 15;`
- Background interval consumes some battery/resources (mitigated by 60s check interval)
- Users have full control via Manual only option

---

### 2026-01-29: Bug Fix - Calendar Moments Missing AI Matching

**Decision:** Update `/api/calendar/check-moments` endpoint to run AI matching for calendar-imported moments, matching the behavior of manually-created moments.

**Bug Description:** Calendar-imported moments were created without AI matching. The `/api/calendar/check-moments/route.ts` endpoint only inserted moments with `gems_matched_count: 0` and never:
1. Fetched user's thoughts (active and passive)
2. Called the AI matching service
3. Inserted matched thoughts into `moment_gems` table

This caused calendar moments to appear in the dashboard but show "No thoughts matched this moment" when clicked.

**Root Cause:** The endpoint was designed to create moments quickly without the overhead of AI matching, but this broke the core value proposition of moments - matching relevant thoughts for preparation.

**Fix Applied:**
- Added AI matching logic to `/api/calendar/check-moments/route.ts`
- Fetches all thoughts with `status IN ('active', 'passive')` for matching
- Calls `matchGemsToMoment()` for each calendar event
- Stores matched thoughts in `moment_gems` table
- Updates moment with match count and processing time

**Additional Improvements:**
- Enhanced PrepCard to display linked notes with matched thoughts
- Added visual indicators for source and related notes
- Prepare page now fetches linked notes via `note_thought_links` table

**Files Changed:**
- `app/api/calendar/check-moments/route.ts` — Added AI matching
- `app/moments/[id]/prepare/page.tsx` — Fetch linked notes
- `components/moments/PrepCard.tsx` — Display linked notes

**Lesson Learned:** When implementing a feature in multiple places (manual moments vs calendar moments), ensure all code paths include the same critical functionality. AI matching is essential for moments to provide value.

---

### 2026-01-29: On-Demand Moment Creation from Calendar Events

**Decision:** Allow users to create moments from calendar events on-demand by clicking on them in the dashboard, rather than waiting for the lead time window.

**Issue:** Dashboard showed "Upcoming" calendar events from `calendar_events_cache`, but users couldn't click on them to prepare. Moments were only created when events were within the lead time window (e.g., 15-60 minutes before). This created confusing UX where events were visible but not actionable.

**Solution:**
1. Created new API endpoint `POST /api/moments/from-event` that creates a moment from a specific cached calendar event
2. Made calendar events in `UpcomingMomentsCard` clickable with visual feedback
3. When clicked, the endpoint creates the moment with AI matching and navigates to the prepare page
4. Changed badge from "Upcoming" to "Click to prepare" to indicate actionability

**Files Created/Changed:**
- `app/api/moments/from-event/route.ts` — New endpoint for on-demand moment creation
- `components/home/UpcomingMomentsCard.tsx` — Made events clickable, added loading state

**UX Improvement:**
- Before: Events show "Upcoming" badge, not clickable, confusing
- After: Events show "Click to prepare" badge, clickable, creates moment with AI matching

**Rationale:**
- Users expect to prepare for visible events immediately
- Waiting for lead time window (15-60 min) is frustrating
- On-demand creation provides immediate value

**Alternatives Considered:**
- Always create moments when syncing calendar → Rejected: would create many unused moments
- Hide events until within lead time → Rejected: less useful, users want to see upcoming events

---

### 2026-01-30: Homepage Redesign - Four Quadrants Dashboard

**Decision:** Redesign the home page around four core knowledge management pillars: Capture, Grow, Apply, and Track, with a TF Thinks AI insight feature.

**Rationale:**
- Users need a focused dashboard that encourages all aspects of the knowledge loop
- Four quadrants provide clear mental model for different user activities
- TF Thinks creates a "coach in your pocket" experience with personalized AI insights
- Consolidated layout reduces cognitive load vs. many separate cards

**Implementation:**

1. **Capture Quadrant** - Smart AI-powered capture input, quick action buttons, recent captures list
2. **Grow Quadrant** - AI discovery with topic search, context chips, and "Surprise me" button
3. **Apply Quadrant** - Today's thought with graduation progress, check-in CTA, upcoming moments
4. **Track Quadrant** - Streak banner, weekly stats, near-graduation callout, compact stats footer

**TF Thinks Feature:**
- AI-generated insights about user patterns and behaviors
- Auto-rotates through 3-5 insights every 8 seconds
- Carousel dots for manual navigation
- Refresh and dismiss buttons
- Uses Gemini 2.0 Flash for analysis

**New Components:**
- `HomeQuadrant.tsx` - Reusable quadrant container with variant styling
- `TFInsight.tsx` - AI insight card with carousel
- `SmartCaptureInput.tsx` - AI-powered paste/capture input
- `StreakBanner.tsx` - Streak display with weekly activity dots
- `GraduationCallout.tsx` - Thoughts close to graduation
- `CaptureQuadrant.tsx`, `GrowQuadrant.tsx`, `ApplyQuadrant.tsx`, `TrackQuadrant.tsx`

**New API Endpoints:**
- `GET /api/tf/insights` - Generate TF Thinks AI insights
- `GET /api/home/stats` - Aggregated stats for Track quadrant (streak, weekly stats, near-graduation)

**Alternatives Considered:**
- Keep existing card-based layout → Rejected: doesn't encourage balanced engagement
- Single-column layout → Rejected: wastes space on desktop, less scannable
- No AI insights → Rejected: misses opportunity for personalized coaching

**Consequences:**
- Previous home page components (DailyThoughtCard, QuickActionsRow, etc.) no longer used directly but preserved for reference
- Users get immediate visibility into all four knowledge management activities

---

### 2026-01-31: Epic 14 - Moment Intelligence

**Decision:** Implement smart context prompting and learning system for Moments feature.

**Status:** COMPLETED

**Rationale:**
- Generic event titles (e.g., "Meeting", "1:1", "Sync") don't provide enough context for good thought matching
- Users marking thoughts helpful/not helpful was captured but never used to improve future matching
- Recurring events (weekly 1:1s, standup meetings) should remember what worked before
- "Thoughts that find you" core principle means the system should get smarter over time

**Key Design Choices:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Learning threshold | 3 helpful marks | Avoids false patterns from single instances |
| Confidence threshold | 70% | helpful / (helpful + not_helpful) >= 0.7 for suggestion |
| Pattern types | event_type, keyword, recurring, attendee | Covers main ways moments repeat |
| Enrichment timing | Before matching | More context = better matches |
| Learning storage | Separate `moment_learnings` table | Clean separation, doesn't bloat moments table |
| Keyword extraction | Simple stop-word removal | Start simple, can add NLP later |

**Implementation:**

1. **Phase 1: Smart Context Prompting**
   - `lib/moments/title-analysis.ts` - Generic title detection, event type classification
   - `components/moments/ContextEnrichmentPrompt.tsx` - UI for adding context
   - Quick-select chips by event type (1:1, team_meeting, interview, etc.)
   - Stores `user_context` and `detected_event_type` on moments table

2. **Phase 2: Learning System**
   - `moment_learnings` table tracks pattern → thought associations
   - `lib/moments/learning.ts` - Recording helpful/not helpful signals
   - API routes: `/api/moments/learn/helpful` and `/api/moments/learn/not-helpful`
   - "Helped before" badge in PrepCard for learned thoughts
   - AI prompt includes learned thoughts section

**Alternatives Considered:**
- AI-only learning (semantic similarity) → Rejected: too opaque, users want explainable suggestions
- Per-moment learning only → Rejected: doesn't generalize to similar moments
- Complex NLP for keywords → Rejected: start simple, iterate if needed
- No threshold (suggest after 1 helpful) → Rejected: creates noisy suggestions

**Consequences:**
- New database table: `moment_learnings`
- New columns on `moments`: `user_context`, `detected_event_type`
- New field on `moment_gems`: `match_source` ('ai' | 'learned' | 'both')
- AI prompt updated with `{learned_thoughts_section}` placeholder
- PrepCard shows "Helped before" badge for learned suggestions

**Key Learnings:**
- Pattern-based learning (event_type, keyword, recurring) provides explainable AI behavior
- Threshold of 3 helpful marks balances responsiveness with accuracy
- Separate learning table allows flexible querying without moment schema changes

---

### 2026-01-30: Fix Calendar Sync Window Not Respecting Lead Time Setting

**Issue:** Users could set "Prepare how far in advance?" to values like 3 days or 1 week in calendar settings, but the calendar sync was hardcoded to only fetch events within the next 24 hours. This meant:
1. Calendar sync only fetched 24 hours of events regardless of user's lead_time_minutes setting
2. UpcomingMomentsCard only displayed events within 24 hours
3. Users with events 2-3 days out saw "No upcoming moments" even with calendar connected and synced

**Root Cause:**
- `lib/calendar.ts:syncCalendarEvents()` hardcoded `tomorrow = now + 24h` as the sync window
- `components/home/UpcomingMomentsCard.tsx` also hardcoded 24-hour window for display
- User's `lead_time_minutes` setting (which can be up to 10080 minutes = 1 week) was ignored

**Solution:**
1. Modified `syncCalendarEvents()` to use the connection's `lead_time_minutes` setting to determine sync window
2. Modified `UpcomingMomentsCard` to fetch user's calendar connection settings and use `lead_time_minutes` for display window
3. Increased `maxResults` from 50 to 100 to handle longer time windows with more events

**Files Changed:**
- `lib/calendar.ts` — Sync window now respects `lead_time_minutes` setting
- `components/home/UpcomingMomentsCard.tsx` — Display window respects user settings

**Lesson Learned:**
When adding user-configurable settings, ensure all related code paths respect that configuration. The sync window and display window should both honor the "Prepare how far in advance?" setting.

---

## Deferred Decisions

Items we've discussed but intentionally not decided yet:

- **Push notifications:** Deferred to future iOS app version
- **Monetization model:** Deferred until product-market fit validated
- ~~**Multi-theme system:** Planned but not yet prioritized~~ → COMPLETED (2026-01-28)
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
