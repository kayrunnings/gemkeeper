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

### 2024-XX-XX: Constraint-Based Design (10 Gem Limit)

**Decision:** Limit users to 10 active gems at a time.

**Rationale:**
- Forces prioritization over hoarding
- Creates a "wisdom portfolio" mindset rather than a dumping ground
- Differentiates from Readwise and other "save everything" tools
- Psychological research supports constraints for behavior change

**Alternatives Considered:**
- Unlimited gems with smart filtering → Rejected: doesn't force prioritization
- Tiered limits (free vs. paid) → Deferred: may revisit for monetization

---

### 2024-XX-XX: Proactive Surfacing Over Passive Storage

**Decision:** ThoughtFolio proactively surfaces gems rather than waiting for users to search.

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
- "ThoughtFolio" communicates wisdom/thought curation
- Tagline emphasizes proactive surfacing (key differentiator)
- More professional, scalable brand

**Alternatives Considered:**
- Keep GemKeeper → Rejected: branding confusion
- WisdomKeeper → Rejected: too on-the-nose
- InsightFolio → Rejected: sounds like analytics tool

---

### 2025-01-XX: Individual Gem Scheduling (Epic 8)

**Decision:** Allow users to set custom check-in times per gem, not just global preferences.

**Rationale:**
- Different gems are relevant at different times (morning motivation vs. evening reflection)
- Gives users control while maintaining proactive surfacing
- Enables "right gem at the right time" experience

**Alternatives Considered:**
- Global schedule only → Rejected: too inflexible
- AI-only timing → Rejected: users want predictability and control

---

### 2025-01-XX: Moments Feature (On-Demand Matching)

**Decision:** Let users describe upcoming situations to receive AI-matched relevant gems.

**Rationale:**
- Bridges scheduled surfacing and search
- High-value moments (presentations, difficult conversations) benefit from prep
- Creates "coach in your pocket" experience
- Validates gem relevance through practical application

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
- **Team/shared gems:** Out of scope for v1

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
