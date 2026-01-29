# ThoughtFolio - Claude Code Context

> **Tagline:** Thoughts that find you

## Project Overview

ThoughtFolio (formerly GemKeeper) is a knowledge accountability partner app that helps users capture insights from books, podcasts, articles, videos, and life experiences, then proactively surfaces them for daily application. Unlike passive note-taking tools, ThoughtFolio uses constraint-based design (Active List of 10 thoughts) and calendar-aware accountability to drive behavior change.

**Live App:** https://gemkeeper.vercel.app

## Quick Reference

| Resource | Location |
|----------|----------|
| GitHub Repo | kayrunnings/gemkeeper |
| Supabase Project | notekeeper (yjifwqxzqgilbvcabxxz.supabase.co) |
| Linear Workspace | Kay's Personal Playground |
| Vercel Dashboard | Manages deployments + env vars |

## Documentation

Before starting work, read these files in `Claude Context/`:

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Database schema, system design, integrations, data flows |
| `DECISIONS.md` | Living log of key decisions — check before proposing new approaches |
| `PRD.md` | Product requirements and feature specifications |
| `PRODUCT-BRIEF.md` | Vision, positioning, target user, principles |
| `STANDARDS.md` | Code conventions, patterns, things to avoid |

## Current State (January 2026)

### Completed Features
- **Daily Check-in** - Single daily touchpoint for thought accountability and graduation tracking
- **Epic 8: Moments** - Individual scheduling, moments matching (Cmd+M shortcut), calendar integration, rate limiting (20/hr)
- **Epic 12: Discovery** - AI-powered content discovery with Google Search grounding
- **Notes System** - Standalone long-form notes with tags, folders, and extract-to-thoughts capability
- **Contexts System** - Life areas for organizing thoughts (8 defaults + custom)
- **Glassmorphism UI** - Modern UI overhaul with dark/light theme support
- **Graduation System** - Trophy case for mastered thoughts

### Active Work
Check `/tasks/` for any active task files. Each file represents a scoped body of work.

**For current issues and priorities:** Check Linear (Kay's Personal Playground workspace) for active issues and sprint context.

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui + Radix | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| AI | Google Gemini API | 2.0 Flash |
| Hosting | Vercel | Latest |

## Key Concepts

### Contexts
User-defined life areas for organizing thoughts (e.g., Meetings, Health, Relationships). Eight defaults provided, users can create custom contexts. Each context has a configurable thought limit (default: 20).

### Thoughts (formerly "Gems")
Captured insights/knowledge. Each thought belongs to one context. Thoughts have a status:
- `active` - Available thought (Thoughts page)
- `passive` - Available but dormant (Thoughts page, filtered)
- `retired` - Archived (Retired page)
- `graduated` - Applied 5+ times, mastered (Trophy Case)

### Active List
Curated subset of up to 10 thoughts that are surfaced in the Daily Check-in. Controlled by `is_on_active_list` boolean, separate from status. Preserves the original constraint-based accountability model while allowing unlimited total thoughts across contexts.

### Daily Check-in
Single daily touchpoint at `/checkin`. Surfaces one thought from the Active List and asks "Did you apply this thought today?". User responds Yes/No with optional reflection. Tracks application count (toward graduation) and skip count (stale detection at 21+ skips).

### Moments
On-demand thought matching for upcoming situations. Moments search ALL thoughts with `status IN ('active', 'passive')` across ALL contexts, returning the most relevant with explanations. Rate limited to 20 matches/hour. Keyboard shortcut: Cmd+M / Ctrl+M.

### Notes
Standalone long-form content separate from atomic thoughts. Notes have titles, markdown content (no character limit), tags, and can be organized into folders. Users can **extract thoughts from notes**, creating a bridge between detailed note-taking and atomic insights. Notes are NOT the same as "thought reflections" (which are attached to individual thoughts).

### Discover
AI-powered content discovery from the web. Dashboard card with three paths: free-text search, context chips, or "Surprise Me". Returns 8 discoveries per session with refresh capability. Daily limits: 8 curated + 8 directed = 16 max. User edits thought before saving (preserves "user's words" principle).

## Workflow Expectations

### How Kay Works
- Kay is a product manager learning to build apps — no direct terminal usage
- All code changes happen through Claude Code
- Database changes via Supabase SQL Editor (not CLI)
- Environment variables managed in Vercel dashboard
- Testing/validation through the live app before marking issues complete

### How Claude Code Should Work

**Communication Style:**
- Explain what you're doing and why, especially for architectural decisions
- Flag risks or tradeoffs before making significant changes
- Ask clarifying questions when requirements are ambiguous

**Git Workflow:**
- Create feature branches for new work (`claude/[description]-[random]`)
- Write clear commit messages
- Create PRs for Kay to review before merging to main

**When to Ask vs. Proceed:**
- **Ask first:** Architectural changes, new dependencies, database schema modifications, anything that affects multiple features
- **Proceed:** Bug fixes within existing patterns, styling adjustments, implementing clearly-specified acceptance criteria

**Code Quality:**
- Follow patterns established in STANDARDS.md
- Add TypeScript types — avoid `any`
- Keep components focused and reasonably sized
- Handle errors gracefully with user-friendly messages
- Follow glassmorphism UI patterns for visual consistency

**Documentation Updates (Required):**
- **Update documentation at every step** — As you make changes, update the relevant documentation files
- For bug fixes: Add entry to DECISIONS.md with issue, root cause, fix, and lesson learned
- For feature-related fixes: Also update the relevant epic file (e.g., `epic-8-moments.md`)
- For architectural changes: Update ARCHITECTURE.md with new data flows, API changes, or component updates
- Keep documentation in sync with code — outdated docs are worse than no docs
- Document "why" not just "what" — future developers (including Claude) need context

## UI Design System

The app uses a **glassmorphism design system** with:
- Semi-transparent backgrounds with backdrop blur
- Subtle borders and shadows
- Dark/light theme support via `theme-provider.tsx`
- Semantic color tokens from shadcn/ui

Key UI patterns:
- Cards use `bg-card/80 backdrop-blur-sm` for glassmorphism effect
- Dropdowns use solid backgrounds for legibility
- Hover states with smooth transitions
- Mobile-first responsive design

## Key Contacts

- **Owner:** Kay (Product Manager, no coding background)
- **Development:** Claude Code (autonomous implementation)
- **Planning:** Claude Chat (product strategy, task breakdowns)

## Important Notes

- Database uses "gems" table name but UI shows "thoughts"
- Use "knowledge" and "thoughts" terminology, not "wisdom"
- AI uses Google Gemini, not Anthropic Claude
- Always verify changes work in the live app at gemkeeper.vercel.app
- Check DECISIONS.md before proposing architectural changes
