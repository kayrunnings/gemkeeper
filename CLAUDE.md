# ThoughtFolio (GemKeeper) - Claude Code Instructions

> **Tagline:** Thoughts that find you

## Quick Start

This is **ThoughtFolio** (codebase: GemKeeper), a knowledge accountability partner app. For full documentation, see the `Claude Context/` folder.

| Resource | Location |
|----------|----------|
| Full Documentation | `Claude Context/` folder |
| Architecture | `Claude Context/ARCHITECTURE.md` |
| Decisions Log | `Claude Context/DECISIONS.md` |
| Code Standards | `Claude Context/STANDARDS.md` |
| Product Brief | `Claude Context/PRODUCT-BRIEF.md` |
| PRD | `Claude Context/PRD.md` |

## Project Overview

ThoughtFolio helps users capture insights from books, podcasts, articles, and life experiences, then proactively surfaces them for daily application.

- **Live URL:** https://gemkeeper.vercel.app
- **GitHub:** https://github.com/kayrunnings/gemkeeper
- **Linear:** Kay's Personal Playground workspace

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

## Key Features (All Implemented)

1. **Thoughts/Gems** - Capture and organize knowledge with contexts
2. **Active List** - Curated 10-25 thoughts for daily prompts (configurable)
3. **Contexts** - Life areas for organizing (8 defaults + custom)
4. **Daily Check-in** - Unified daily touchpoint for application tracking
5. **Moments** - On-demand AI matching for upcoming situations
6. **Calendar Integration** - Google Calendar for context-aware suggestions
7. **Discovery** - AI-powered content discovery from the web with bookmarks
8. **Graduation** - Trophy case for mastered thoughts (5+ applications)
9. **Library** - Unified view of thoughts, notes, sources (with tabs and filters)
10. **Global Search** - Cmd+K full-text search across all content
11. **AI Capture** - Cmd+N intelligent content analysis and extraction
12. **Sources** - First-class source entities (books, articles, podcasts)
13. **Notes** - Standalone long-form notes with thought linking

## Project Structure

```
gemkeeper/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (contexts, discover, moments, search, capture, etc.)
│   ├── home/               # Dashboard with quick actions
│   ├── library/            # Unified Library (thoughts, notes, sources, archive tabs)
│   ├── thoughts/           # Thought management
│   ├── discover/           # Discovery with tabs (For You, Explore, Saved)
│   ├── moments/            # Situational matching
│   ├── checkin/            # Daily check-in
│   ├── settings/           # User preferences (focus mode, calendar, etc.)
│   ├── retired/            # Archived thoughts
│   ├── trophy-case/        # Graduated thoughts
│   └── ...
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── capture/            # AI Capture modal components
│   ├── search/             # Global search modal components
│   ├── library/            # Library tab components
│   ├── discover/           # Discovery feature
│   ├── moments/            # Moment components (floating button, etc.)
│   ├── contexts/           # Context management
│   └── ...
├── lib/                    # Services and utilities
│   ├── ai/                 # Gemini integration + content detection
│   ├── types/              # TypeScript definitions (search, source, capture, etc.)
│   ├── hooks/              # React hooks (useGlobalShortcuts, useScrollVisibility)
│   ├── supabase/           # Database clients
│   └── [services]          # Feature services (search.ts, sources.ts, etc.)
├── Claude Context/         # Full documentation
└── __tests__/              # Jest tests (lib/, components/)
```

## Database Tables

Core tables (all with RLS):
- `profiles` - User settings (focus_mode_enabled, active_list_limit, checkin_enabled)
- `gems` - Thoughts/knowledge (UI shows "thoughts")
- `contexts` - Life areas for organization
- `notes` - Standalone long-form notes
- `sources` - First-class source entities (books, articles, podcasts)
- `note_thought_links` - Bi-directional note-thought linking
- `moments` - Situational instances
- `gem_schedules` - Individual check-in schedules
- `calendar_connections` - OAuth calendar integrations (Google, Microsoft placeholder)
- `discoveries` - AI-generated content suggestions (with saved_at for bookmarks)
- `discovery_usage` - Daily limits tracking

## Working with Claude Code

### Before Starting
1. Read `Claude Context/CLAUDE.md` for full context
2. Check `Claude Context/DECISIONS.md` before proposing new approaches
3. Follow patterns in `Claude Context/STANDARDS.md`

### Key Patterns
- Use Server Components by default, `"use client"` only when needed
- Handle errors gracefully with user-friendly messages
- Always verify `user_id` ownership in database queries
- Use Tailwind CSS with semantic color tokens
- Follow glassmorphism UI patterns for consistency

### Commit Messages
```
feat: description (KAY-XX)
fix: description
refactor: description
```

### Useful Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm test             # Run Jest tests
```

## Important Notes

- Database uses "gems" table but UI shows "thoughts"
- Use "knowledge" and "thoughts" terminology, not "wisdom"
- AI uses Google Gemini, not Anthropic
- Glassmorphism UI with dark/light theme support
- Verify changes in live app at gemkeeper.vercel.app
