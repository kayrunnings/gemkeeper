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
