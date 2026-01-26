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
2. **Active List** - Curated 10 thoughts for daily prompts
3. **Contexts** - Life areas for organizing (8 defaults + custom)
4. **Daily Prompts** - Morning thought surfacing from Active List
5. **Check-ins** - Evening reflection and application tracking
6. **Moments** - On-demand AI matching for upcoming situations
7. **Calendar Integration** - Google Calendar for context-aware suggestions
8. **Discovery** - AI-powered content discovery from the web
9. **Graduation** - Trophy case for mastered thoughts (5+ applications)

## Project Structure

```
gemkeeper/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (contexts, discover, moments, etc.)
│   ├── home/               # Dashboard
│   ├── thoughts/           # Thought management
│   ├── moments/            # Situational matching
│   ├── daily/              # Morning prompt
│   ├── checkin/            # Evening check-in
│   ├── settings/           # User preferences
│   ├── retired/            # Archived thoughts
│   ├── trophy-case/        # Graduated thoughts
│   └── ...
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── discover/           # Discovery feature
│   ├── moments/            # Moment components
│   ├── schedules/          # Scheduling UI
│   ├── contexts/           # Context management
│   └── ...
├── lib/                    # Services and utilities
│   ├── ai/                 # Gemini integration
│   ├── types/              # TypeScript definitions
│   ├── supabase/           # Database clients
│   └── [services]          # Feature services
├── Claude Context/         # Full documentation
└── __tests__/              # Jest tests
```

## Database Tables

Core tables (all with RLS):
- `profiles` - User settings
- `gems` - Thoughts/knowledge (UI shows "thoughts")
- `contexts` - Life areas for organization
- `moments` - Situational instances
- `gem_schedules` - Individual check-in schedules
- `calendar_connections` - OAuth calendar integrations
- `discoveries` - AI-generated content suggestions
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
