# ThoughtFolio - Claude Code Context

> **Tagline:** Thoughts that find you

## Project Overview

ThoughtFolio (formerly GemKeeper) is a wisdom accountability partner app that helps users capture insights from books, podcasts, and life experiences, then proactively surfaces them for daily application. Unlike passive note-taking tools, ThoughtFolio uses constraint-based design (maximum 10 active "gems") and calendar-aware accountability to drive behavior change.

**Live App:** https://gemkeeper.vercel.app (rebrand to thoughtfolio pending)

## Quick Reference

| Resource | Location |
|----------|----------|
| GitHub Repo | kayrunnings/gemkeeper |
| Supabase Project | notekeeper (yjifwqxzqgilbvcabxxz.supabase.co) |
| Linear Workspace | Kay's Personal Playground |
| Vercel Dashboard | Manages deployments + env vars |

## Documentation

Before starting work, read these files in `.claude/`:

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Database schema, system design, integrations, data flows |
| `DECISIONS.md` | Living log of key decisions — check before proposing new approaches |
| `PRD.md` | Product requirements and feature specifications |
| `PRODUCT-BRIEF.md` | Vision, positioning, target user, principles |
| `STANDARDS.md` | Code conventions, patterns, things to avoid |

## Current Work

Check `/tasks/` for active task files. Each file represents a scoped body of work.

**When starting a session:**
1. Ask which task file to work from, OR
2. If given a specific task file, work exclusively from that scope

Do not mix work across task files unless explicitly instructed.

**For current issues and priorities:** Check Linear (Kay's Personal Playground workspace) for active issues and sprint context.

## Tech Stack

- **Framework:** Next.js + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini API (not Anthropic)
- **Deployment:** Vercel (auto-deploy from main branch)
- **Auth:** Supabase Auth

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
- Create feature branches for new work
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

## Key Contacts

- **Owner:** Kay (Product Manager, no coding background)
- **Development:** Claude Code (autonomous implementation)
- **Planning:** Claude Chat (product strategy, task breakdowns)

## Important Notes

- The rebrand from GemKeeper → ThoughtFolio is in progress
- API keys need regeneration on Supabase (reminder noted)
- Always verify changes work in the live app at gemkeeper.vercel.app
