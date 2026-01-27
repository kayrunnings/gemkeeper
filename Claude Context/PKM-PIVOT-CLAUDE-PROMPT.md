# ThoughtFolio 2.0: Claude Code Implementation Prompt

> Copy and paste this prompt when starting implementation work with Claude Code.

---

## Context

You are implementing the ThoughtFolio 2.0 PKM Pivot. This is an evolution of the existing ThoughtFolio knowledge accountability app into a "PKM-Lite" personal knowledge management system.

**Read these documents first:**
- `Claude Context/PKM-PIVOT-FEATURE-SPEC.md` - Full feature specification
- `Claude Context/PKM-PIVOT-USER-STORIES.md` - User story breakdown
- `Claude Context/PKM-PIVOT-TASKS.md` - Implementation tasks checklist
- `Claude Context/PKM-PIVOT-SQL-MIGRATION.sql` - Database migration (already run)

---

## Core Principles

### 1. Preserve Existing Functionality
The existing app must continue to work during and after migration:
- All current settings preserved (themes, contexts, AI toggle, calendar)
- Existing thoughts, notes, moments, discoveries intact
- Current navigation works until new navigation is ready
- No breaking changes to the database

### 2. Retain These Features
These are the DNA of ThoughtFolio - do not remove or fundamentally change:
- **Thoughts** (atomic insights, max 200 chars)
- **Notes** (long-form markdown)
- **Moments** (on-demand situational matching)
- **Discover** (AI-powered content discovery)
- **Contexts** (8 defaults + custom categories)
- **AI Extraction** (from text, URLs, YouTube)
- **Active List** (curated focus list)
- **Daily Check-in** (proactive surfacing)
- **Trophy Case** (graduated thoughts)
- **Calendar Integration** (Google, adding Microsoft)

### 3. Preserve All Settings
Do not remove or break any existing settings:
- Profile: name, email
- Preferences: timezone, daily_prompt_time, checkin_time
- Themes: color theme (localStorage), UI style, sidebar state
- AI Features: ai_consent_given, ai_consent_date
- Contexts: full CRUD, colors, icons, limits
- Calendar: connections, auto-moment settings

---

## Key New Features to Implement

### 1. Full-Text Search
- PostgreSQL `tsvector` columns on gems, notes, sources
- GIN indexes for fast querying
- Unified search API with `ts_rank` scoring
- Global search modal with Cmd+K / Ctrl+K shortcut
- Type filters (All, Thoughts, Notes, Sources)
- Keyboard navigation in results

### 2. Unified Library
- New `/library` route with tabs: All, Thoughts, Notes, Sources, Archive
- Context chips filter (horizontal scrollable)
- Source entities as first-class citizens
- Bi-directional linking between notes and thoughts

### 3. AI-Powered Quick Capture
- Unified "smart paste" modal
- Content type detection (URL, quote, reflection, list)
- Mixed content splitting (quote vs. commentary)
- Auto-source creation from URLs
- Entry points: Cmd+N, header (+), Home quick action

### 4. Floating Moment Button
- Persistent FAB in bottom-right corner
- Expands to show: "From Calendar" and "Describe It"
- Quick moment creation without navigation
- Hide during scroll, show when stopped

### 5. Enhanced Discovery
- Tabbed interface: For You, Explore, Saved
- Saved discoveries as reading list
- "Fill a Gap" recommendations

### 6. Focus Mode Settings
- Toggle for focus_mode_enabled (10-limit vs configurable)
- Slider for active_list_limit (10-25)
- Toggle for checkin_enabled

### 7. Microsoft Calendar (Future)
- OAuth with Microsoft Graph API
- Same functionality as Google Calendar

---

## Technical Guidelines

### Database
- Table for thoughts is `gems` (not `thoughts`)
- All tables have RLS - always filter by `user_id`
- Use migrations for schema changes
- Triggers for search vector updates

### Types
- Thought type: `lib/types/thought.ts`
- Context type: `lib/types/context.ts`
- Profile type: `lib/types.ts`
- Calendar type: `types/calendar.ts`
- New Source type: `lib/types/source.ts`
- New Search type: `lib/types/search.ts`

### Components
- Use Server Components by default
- `"use client"` only when needed (hooks, events)
- Max ~150 lines per component
- Glassmorphism styling: `bg-card/80 backdrop-blur-sm`
- shadcn/ui + Radix for base components

### Services
- Place in `lib/` directory
- Functions return `{ data, error }` pattern
- Always get user from Supabase auth
- Handle errors gracefully

### API Routes
- Place in `app/api/` directory
- Use Next.js App Router conventions
- Return JSON with proper status codes
- Validate input, authenticate user

---

## File Locations

```
gemkeeper/
├── app/
│   ├── api/
│   │   ├── search/route.ts          # NEW: Search API
│   │   └── capture/
│   │       ├── analyze/route.ts     # NEW: Content detection
│   │       └── save/route.ts        # NEW: Batch save
│   ├── library/
│   │   ├── page.tsx                 # NEW: Unified library
│   │   └── sources/[id]/page.tsx    # NEW: Source detail
│   ├── home/page.tsx                # UPDATE: Quick actions
│   └── settings/page.tsx            # UPDATE: Focus mode
├── components/
│   ├── search/
│   │   ├── GlobalSearch.tsx         # NEW
│   │   ├── SearchResults.tsx        # NEW
│   │   └── SearchResultCard.tsx     # NEW
│   ├── capture/
│   │   ├── AICaptureModal.tsx       # NEW
│   │   └── CaptureSuggestions.tsx   # NEW
│   ├── library/
│   │   ├── LibraryTabs.tsx          # NEW
│   │   ├── SourceCard.tsx           # NEW
│   │   └── ...                      # NEW
│   ├── moments/
│   │   └── FloatingMomentButton.tsx # NEW
│   ├── ui/
│   │   └── ContextChipsFilter.tsx   # NEW
│   └── layout/
│       ├── BottomNavigation.tsx     # UPDATE
│       └── Sidebar.tsx              # UPDATE
├── lib/
│   ├── sources.ts                   # NEW
│   ├── search.ts                    # NEW
│   ├── note-links.ts                # NEW
│   └── ai/
│       ├── content-detector.ts      # NEW
│       └── content-splitter.ts      # NEW
└── types/
    └── (no new files here, use lib/types/)
```

---

## Implementation Order

Follow this order to minimize disruption:

### Phase 1: Foundation (No UI changes)
1. Run SQL migration (already done if provided)
2. Create TypeScript types for new entities
3. Create services (sources, search, note-links)
4. Create search API endpoint
5. Test with existing data

### Phase 2: Search UI (Additive)
1. Create GlobalSearch component
2. Add keyboard shortcut handler
3. Add search icon to header
4. Test search across content types

### Phase 3: Library (Additive)
1. Create Library page at `/library`
2. Add Library to navigation (alongside existing)
3. Create Source components
4. Test navigation between old and new

### Phase 4: Navigation Switch
1. Update bottom nav to new 4-tab layout
2. Update sidebar
3. Remove old navigation to Moments (FAB replaces)
4. Add floating button

### Phase 5: AI Capture (Additive)
1. Create capture modal
2. Add entry points (header, home, keyboard)
3. Create detection and splitting logic
4. Test various input types

### Phase 6: Settings (Additive)
1. Add Focus Mode section
2. Add Check-in toggle
3. Update Active List logic to respect new settings

---

## Testing Checklist

Before marking any phase complete:

- [ ] Existing thoughts still display correctly
- [ ] Existing notes still accessible
- [ ] Moments still work (create, match, history)
- [ ] Discovery still works
- [ ] Daily check-in still works
- [ ] Settings all still work (themes, contexts, calendar, AI)
- [ ] Can create new thoughts via existing methods
- [ ] Can extract from URLs
- [ ] Active List limit still enforced
- [ ] No console errors
- [ ] Mobile responsive

---

## Common Pitfalls to Avoid

1. **Don't rename the gems table** - It's called "gems" in the database, "thoughts" in the UI
2. **Don't remove existing columns** - Only add, never subtract
3. **Don't break existing APIs** - Add new endpoints, deprecate old ones later
4. **Don't change localStorage keys** - Themes use specific keys
5. **Don't remove existing routes** - Add new routes, keep old ones working
6. **Don't change RLS policies** - Only add new ones for new tables
7. **Don't hardcode user IDs** - Always get from Supabase auth
8. **Don't skip error handling** - All services return { data, error }

---

## Example: Creating the Search Service

```typescript
// lib/search.ts
import { createClient } from "@/lib/supabase/client"

export interface SearchResult {
  id: string
  type: 'thought' | 'note' | 'source'
  text: string
  secondaryText: string | null
  contextId: string | null
  createdAt: string
  rank: number
}

export async function search(
  query: string,
  options?: {
    type?: 'thought' | 'note' | 'source'
    limit?: number
    offset?: number
  }
): Promise<{ results: SearchResult[]; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { results: [], error: "Not authenticated" }
  }

  const { limit = 20, offset = 0, type } = options || {}

  // Use the unified_search view
  let queryBuilder = supabase
    .from('unified_search')
    .select('*')
    .eq('user_id', user.id)
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) {
    queryBuilder = queryBuilder.eq('type', type)
  }

  const { data, error } = await queryBuilder

  if (error) {
    return { results: [], error: error.message }
  }

  return {
    results: data?.map(row => ({
      id: row.id,
      type: row.type,
      text: row.text,
      secondaryText: row.secondary_text,
      contextId: row.context_id,
      createdAt: row.created_at,
      rank: 1 // ts_rank would require RPC
    })) || [],
    error: null
  }
}
```

---

## Starting a Task

When starting a specific task from the checklist:

1. Read the task description in `PKM-PIVOT-TASKS.md`
2. Find related user stories in `PKM-PIVOT-USER-STORIES.md`
3. Check the feature spec in `PKM-PIVOT-FEATURE-SPEC.md` for details
4. Review existing related code before writing new code
5. Follow the technical guidelines above
6. Test that existing functionality still works
7. Mark the task complete in the checklist

---

## Questions?

If you're unsure about something:
1. Check existing code for patterns (e.g., how other services work)
2. Check DECISIONS.md for past decisions
3. Check STANDARDS.md for code conventions
4. Ask for clarification rather than guessing

**The goal is evolution, not revolution.** Preserve what works, enhance incrementally.
