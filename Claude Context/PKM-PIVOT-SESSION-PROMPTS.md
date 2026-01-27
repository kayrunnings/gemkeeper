# ThoughtFolio 2.0: Session Prompts for Implementation

> **Usage:** Copy the prompt for each session into a new Claude Code conversation.
> **Important:** Complete and test each session before starting the next.

```
Session	Phases	Tasks	What Gets Built
1	1 + 2	24	Types, services, search API, Cmd+K search UI
2	3 + 4	14	4-tab navigation, unified Library with tabs
3	5 + 6	14	Floating 🎯 button, AI Capture modal (Cmd+N)
4	7 + 8 + 9	10	Focus Mode settings, Discovery tabs, Microsoft Calendar UI
5	10	8	Tests, performance, documentation, polish
```

---

## Pre-Session Checklist

Before each session:
- [ ] Previous session's code is committed and pushed
- [ ] App still works (quick manual test)
- [ ] No TypeScript/build errors: `npm run build`

---

## Session 1: Foundation (Types, Services, Search API)

**Phases:** 1 + 2
**Estimated tasks:** 24
**Creates:** Type definitions, core services, search infrastructure

```
# ThoughtFolio 2.0 Implementation - Session 1: Foundation

## Context
Read these files first:
- Claude Context/PKM-PIVOT-FEATURE-SPEC.md
- Claude Context/PKM-PIVOT-TASKS.md
- Claude Context/PKM-PIVOT-CLAUDE-PROMPT.md

The SQL migration has already been run. The database has:
- `sources` table (first-class source entities)
- `note_thought_links` table (bi-directional linking)
- `profiles` with: focus_mode_enabled, active_list_limit, checkin_enabled
- `calendar_connections` with: provider column
- `gems` with: source_id, search_vector columns
- `notes` with: search_vector column
- `discoveries` with: saved_at column
- `unified_search` view and `search_knowledge()` function

## Your Tasks

### Part A: TypeScript Types (Phase 1.3)

Create these type files:

1. **lib/types/source.ts** - Source entity types
   ```typescript
   export interface Source {
     id: string
     user_id: string
     name: string
     author: string | null
     type: 'book' | 'article' | 'podcast' | 'video' | 'course' | 'other'
     url: string | null
     isbn: string | null
     cover_image_url: string | null
     metadata: Record<string, unknown>
     created_at: string
     updated_at: string
   }

   export interface CreateSourceInput {
     name: string
     author?: string
     type?: Source['type']
     url?: string
     isbn?: string
     cover_image_url?: string
     metadata?: Record<string, unknown>
   }

   export interface UpdateSourceInput extends Partial<CreateSourceInput> {}
   

2. **lib/types/note-link.ts** - Note-thought link types
   ```typescript
   export interface NoteThoughtLink {
     id: string
     note_id: string
     gem_id: string
     position: number
     created_at: string
   }
   

3. **lib/types/search.ts** - Search types
   ```typescript
   export interface SearchResult {
     id: string
     type: 'thought' | 'note' | 'source'
     text: string
     secondaryText: string | null
     contextId: string | null
     createdAt: string
     rank: number
   }

   export interface SearchFilters {
     type?: 'thought' | 'note' | 'source'
     contextId?: string
     limit?: number
     offset?: number
   }
   

4. **Update lib/types.ts** - Add to Profile interface:
   ```typescript
   focus_mode_enabled: boolean
   active_list_limit: number
   checkin_enabled: boolean
   

5. **Update types/calendar.ts** - Add provider to CalendarConnection:
   ```typescript
   provider: 'google' | 'microsoft'
   

### Part B: Services (Phase 1.4)

Create these service files:

1. **lib/sources.ts** - Source CRUD operations
   - createSource(input: CreateSourceInput)
   - getSource(id: string)
   - getSources()
   - getSourceByUrl(url: string) - for deduplication
   - updateSource(id: string, input: UpdateSourceInput)
   - deleteSource(id: string)
   - All functions return { data, error } pattern
   - All functions verify user authentication

2. **lib/note-links.ts** - Note-thought linking
   - linkThoughtToNote(noteId: string, gemId: string, position?: number)
   - unlinkThoughtFromNote(noteId: string, gemId: string)
   - getLinkedThoughts(noteId: string) - returns thoughts linked to a note
   - getLinkedNotes(gemId: string) - returns notes linked to a thought
   - reorderLinks(noteId: string, links: {gemId: string, position: number}[])

3. **lib/search.ts** - Full-text search
   - search(query: string, filters?: SearchFilters)
   - Use the `search_knowledge` database function
   - Handle empty queries gracefully
   - Return ranked results

### Part C: Search API (Phase 2.2)

Create the search API endpoint:

1. **app/api/search/route.ts**
   - GET endpoint with query params: q, type, limit, offset
   - Validates user is authenticated
   - Calls search service
   - Returns JSON results with proper error handling

### Part D: Search UI Components (Phase 2.1)

Create search UI components:

1. **components/search/GlobalSearch.tsx**
   - Modal component that opens on Cmd+K / Ctrl+K
   - Search input with debounced onChange (300ms)
   - Calls search API
   - Displays results using SearchResults component
   - Closes on Escape or click outside

2. **components/search/SearchResults.tsx**
   - Receives search results array
   - Groups by type (Thoughts, Notes, Sources)
   - Keyboard navigation (arrow keys, Enter to select)
   - Empty state when no results
   - Loading state while searching

3. **components/search/SearchResultCard.tsx**
   - Displays single search result
   - Type icon (💭 thought, 📝 note, 📖 source)
   - Highlighted search terms in text
   - Secondary text (source for thoughts, preview for notes, author for sources)
   - Click handler to navigate to item

4. **components/search/SearchFilters.tsx**
   - Filter buttons: All, Thoughts, Notes, Sources
   - Active state styling
   - onClick updates filter

5. **lib/hooks/useGlobalShortcuts.ts**
   - Custom hook for global keyboard shortcuts
   - Registers Cmd+K / Ctrl+K for search
   - Returns { isSearchOpen, setIsSearchOpen }

### Part E: Search Integration (Phase 2.3)

1. **Update components/layout/Header.tsx** (or equivalent)
   - Add search icon (🔍) that opens GlobalSearch
   - Tooltip showing "Search (⌘K)"

2. **Update components/layout-shell.tsx** (or app layout)
   - Include GlobalSearch component
   - Include useGlobalShortcuts hook

## Guidelines

- Follow existing code patterns in the codebase
- Use Server Components by default, "use client" only when needed
- Maintain glassmorphism styling (bg-card/80 backdrop-blur-sm)
- All services return { data, error } or { result, error } pattern
- Handle authentication in all API routes and services
- No breaking changes to existing functionality

## Verification

After completing all tasks:
1. Run `npm run build` - should have no errors
2. Run `npm run lint` - should pass
3. Test Cmd+K opens search modal
4. Test search returns results for existing thoughts
5. Existing app functionality still works

## Commit

Create a commit with message:

feat: Add full-text search infrastructure and UI

- Add Source, NoteThoughtLink, SearchResult types
- Add sources, note-links, search services
- Add search API endpoint
- Add GlobalSearch modal with Cmd+K shortcut
- Add SearchResults, SearchResultCard, SearchFilters components

Phase 1 + 2 of PKM Pivot

```

---

## Session 2: Navigation & Library

**Phases:** 3 + 4
**Estimated tasks:** 14
**Creates:** New navigation, unified Library page

```
# ThoughtFolio 2.0 Implementation - Session 2: Navigation & Library

## Context
Read these files:
- Claude Context/PKM-PIVOT-FEATURE-SPEC.md (Section 4: Information Architecture)
- Claude Context/PKM-PIVOT-TASKS.md (Phase 3 + 4)
- Claude Context/PKM-PIVOT-CLAUDE-PROMPT.md

Session 1 completed: Types, services, and search are working.

## Your Tasks

### Part A: Navigation Updates (Phase 3)

1. **Update components/layout/BottomNavigation.tsx** (or create if doesn't exist)
   - New 4-tab layout: Home, Library, Active, Discover
   - Remove Moments tab (will be floating button)
   - Icons: 🏠, 📚, ⚡, 🔮
   - Active tab highlighting
   - Mobile-responsive

2. **Update components/layout/Sidebar.tsx**
   - Add Library section with sub-items:
     - All
     - Thoughts
     - Notes
     - Sources
     - Archive
   - Add Moments section (separate from tabs)
   - Add quick action buttons at bottom: AI Capture, New Moment
   - Collapsible behavior preserved

3. **Create components/home/QuickActionsRow.tsx**
   - Three action cards in a row:
     - ✨ AI Capture - "Paste anything, we'll figure it out"
     - 🎯 New Moment - "Prep for an upcoming situation"
     - 🔮 Discover - "Find new ideas"
   - Cards link to respective features (capture modal, moments, discover)
   - For now, AI Capture can link to existing extraction page
   - Responsive: row on desktop, stack on mobile

4. **Update app/home/page.tsx**
   - Add QuickActionsRow below Today's Focus card
   - Add context chips filter (horizontal scrollable)
   - Add "Recent Activity" section showing latest thoughts/notes

### Part B: Context Chips Filter (Phase 4.1)

1. **Create components/ui/ContextChipsFilter.tsx**
   - Horizontal scrollable container
   - "All" chip + user's contexts
   - Click to filter
   - Active chip has distinct style
   - Badge shows count per context (optional)
   - Props: selectedContextId, onSelect, showCounts

### Part C: Library Page (Phase 4)

1. **Create app/library/page.tsx**
   - Main Library page with tabbed layout
   - URL state for active tab: ?tab=all|thoughts|notes|sources|archive
   - Include ContextChipsFilter
   - Include search bar that uses existing search

2. **Create components/library/LibraryTabs.tsx**
   - Tabs: All, Thoughts, Notes, Sources, Archive
   - Click changes URL param
   - Active tab styling
   - Mobile: horizontal scroll if needed

3. **Create components/library/LibraryAllTab.tsx**
   - Mixed feed of thoughts, notes, sources
   - Sorted by updated_at descending
   - Type icon on each card
   - Infinite scroll or "Load more" button
   - Respects context filter

4. **Create components/library/LibraryThoughtsTab.tsx**
   - List of all thoughts (active + passive status)
   - Show Active List badge (⚡) on applicable thoughts
   - Context badge on each card
   - Click opens thought detail
   - Respects context filter
   - Can reuse existing thought card components

5. **Create components/library/LibraryNotesTab.tsx**
   - List of all notes
   - Show title and content preview
   - Show linked thoughts count
   - Click opens note editor
   - Respects context filter

6. **Create components/library/LibrarySourcesTab.tsx**
   - List of all sources from sources table
   - Use SourceCard component
   - Show cover image, title, author, type
   - Show linked thoughts count
   - Click opens source detail

7. **Create components/library/LibraryArchiveTab.tsx**
   - Shows retired thoughts
   - Grayed out styling
   - Restore and permanent delete actions
   - Confirmation dialog for delete

8. **Create components/library/SourceCard.tsx**
   - Cover image (or placeholder based on type)
   - Title (name)
   - Author (if available)
   - Type badge (book, article, podcast, etc.)
   - Linked thoughts count
   - Click handler

9. **Create app/library/sources/[id]/page.tsx**
   - Source detail page
   - Full metadata display
   - List of linked thoughts
   - Edit and delete actions
   - "Add thought from this source" button

## Guidelines

- Keep existing routes working (/thoughts, /notes still accessible)
- Library is additive, not replacing existing pages yet
- Use existing thought/note card components where possible
- Maintain glassmorphism styling
- Mobile-first responsive design

## Verification

After completing:
1. `npm run build` passes
2. New /library route works
3. All tabs display correct content
4. Context filter works across tabs
5. Navigation updates visible on mobile and desktop
6. Existing /thoughts and /notes pages still work
7. Search still works

## Commit


feat: Add unified Library and updated navigation

- Update bottom nav to 4-tab layout (Home, Library, Active, Discover)
- Update sidebar with Library sub-sections
- Add QuickActionsRow to Home dashboard
- Add ContextChipsFilter component
- Create Library page with All/Thoughts/Notes/Sources/Archive tabs
- Add SourceCard component and source detail page

Phase 3 + 4 of PKM Pivot

```

---

## Session 3: Floating Button & AI Capture

**Phases:** 5 + 6
**Estimated tasks:** 14
**Creates:** Floating moment button, AI capture modal

```
# ThoughtFolio 2.0 Implementation - Session 3: Floating Button & AI Capture

## Context
Read these files:
- Claude Context/PKM-PIVOT-FEATURE-SPEC.md (Sections 2.1, 2.2)
- Claude Context/PKM-PIVOT-TASKS.md (Phase 5 + 6)
- Claude Context/PKM-PIVOT-CLAUDE-PROMPT.md

Sessions 1-2 completed: Search, navigation, and Library are working.

## Your Tasks

### Part A: Floating Moment Button (Phase 5)

1. **Create components/moments/FloatingMomentButton.tsx**
   - Fixed position button in bottom-right corner
   - 🎯 icon when collapsed
   - Semi-transparent when idle (opacity-70)
   - Above bottom navigation on mobile (bottom-20)
   - z-index high enough to float above content

2. **Create components/moments/FloatingButtonMenu.tsx**
   - Appears when FloatingMomentButton is tapped
   - Two options stacked vertically:
     - 📅 "From Calendar"
     - ✏️ "Describe It"
   - Animation: slide up from button
   - Click outside or X closes menu
   - Only show "From Calendar" if calendar is connected

3. **Create components/moments/QuickMomentEntry.tsx**
   - Inline form that appears when "Describe It" is selected
   - Text input: "What are you preparing for?"
   - Optional date/time picker
   - "Find Relevant Thoughts" button
   - Shows matched thoughts in expandable panel
   - Uses existing moments matching API

4. **Create components/moments/CalendarEventPicker.tsx**
   - List of upcoming calendar events (next 7 days)
   - Fetches from existing calendar API
   - Select event to create moment with that title
   - Only shown if calendar connected
   - Empty state if no upcoming events

5. **Create lib/hooks/useScrollVisibility.ts**
   - Custom hook for scroll-based visibility
   - Returns isVisible boolean
   - Hides on scroll down
   - Shows after 500ms of no scroll
   - Used by FloatingMomentButton

6. **Update components/layout-shell.tsx**
   - Add FloatingMomentButton component
   - Pass calendar connection status
   - Hide on /moments page (check pathname)

### Part B: AI Capture Modal (Phase 6)

1. **Create components/capture/AICaptureModal.tsx**
   - Modal component for unified capture
   - Large text area for pasting content
   - States: empty, analyzing, suggestions, saving
   - Entry points will call setIsOpen(true)

2. **Create components/capture/CaptureEmptyState.tsx**
   - Shown when modal opens with empty input
   - Placeholder text in textarea
   - Examples section:
     - "Paste an article URL → Extract key thoughts"
     - "Paste a quote → Save as thought with source"
     - "Paste meeting notes → Save as note, extract thoughts"
     - "Type a quick idea → Save as thought"

3. **Create components/capture/CaptureAnalyzing.tsx**
   - Loading state while AI processes
   - Spinner with "Analyzing..." text
   - Subtle animation
   - Timeout handling (10s max)

4. **Create components/capture/CaptureSuggestions.tsx**
   - Displays AI-detected items
   - Each item has checkbox (default checked)
   - Items grouped by type
   - "Save Selected Items" button
   - "Cancel" button

5. **Create components/capture/CaptureItemCard.tsx**
   - Single suggestion card
   - Type label: THOUGHT, NOTE, or SOURCE
   - Content preview (editable)
   - Context dropdown
   - "Add to Active List" toggle (for thoughts)
   - "Link to thought above" option (for notes)
   - Edit button for full editing

6. **Create app/api/capture/analyze/route.ts**
   - POST endpoint
   - Receives: { content: string }
   - Returns: { suggestions: CaptureItem[] }
   - Calls AI detection logic

7. **Create app/api/capture/save/route.ts**
   - POST endpoint
   - Receives: { items: CaptureItem[] }
   - Creates thoughts, notes, sources as needed
   - Links relationships
   - Returns created entities

8. **Create lib/ai/content-detector.ts**
   - detectContentType(content: string) → 'url' | 'short_text' | 'long_text' | 'mixed' | 'list'
   - isUrl(text: string) → boolean
   - isQuoteLike(text: string) → boolean (has quotation marks, attribution patterns)
   - isBulletList(text: string) → boolean

9. **Create lib/ai/content-splitter.ts**
   - splitMixedContent(content: string) → { quotes: string[], reflections: string[] }
   - extractSourceAttribution(text: string) → { quote: string, source?: string, author?: string }
   - Uses Gemini AI to intelligently split content
   - Falls back to rule-based splitting if AI fails

10. **Add keyboard shortcut for capture**
    - Update lib/hooks/useGlobalShortcuts.ts
    - Add Cmd+N / Ctrl+N for opening capture modal
    - Return { isSearchOpen, setIsSearchOpen, isCaptureOpen, setIsCaptureOpen }

11. **Update Home QuickActionsRow**
    - ✨ AI Capture card opens AICaptureModal
    - Update click handler

12. **Update Header**
    - Add (+) button that opens AICaptureModal
    - Tooltip: "Quick Capture (⌘N)"

## Type Definitions Needed

```typescript
// lib/types/capture.ts
export type ContentType = 'url' | 'short_text' | 'long_text' | 'mixed' | 'list'

export interface CaptureItem {
  id: string // temporary client-side ID
  type: 'thought' | 'note' | 'source'
  content: string
  source?: string
  sourceUrl?: string
  contextId?: string
  addToActiveList?: boolean
  linkToThoughtId?: string // for notes
  selected: boolean
}

export interface CaptureAnalysisResult {
  contentType: ContentType
  suggestions: CaptureItem[]
}


## Guidelines

- Reuse existing Gemini integration from lib/ai/
- Reuse existing thought/note creation services
- Floating button should feel native and non-intrusive
- Capture modal should be fast and intuitive
- Handle errors gracefully with user-friendly messages

## Verification

1. `npm run build` passes
2. Floating 🎯 button visible on all pages except /moments
3. Button hides on scroll, reappears when stopped
4. Tapping button shows menu options
5. "Describe It" opens quick moment entry
6. Cmd+N opens capture modal
7. Pasting URL shows extraction options
8. Pasting text shows thought/note suggestions
9. Saving creates correct entities

## Commit


feat: Add floating moment button and AI capture modal

- Add FloatingMomentButton with expand/collapse behavior
- Add scroll-based visibility hook
- Add QuickMomentEntry and CalendarEventPicker
- Add AICaptureModal with content detection
- Add capture analyze and save API endpoints
- Add content-detector and content-splitter AI utilities
- Add Cmd+N keyboard shortcut for capture

Phase 5 + 6 of PKM Pivot

```

---

## Session 4: Settings, Discovery & Microsoft Calendar

**Phases:** 7 + 8 + 9
**Estimated tasks:** 10
**Creates:** Focus mode settings, enhanced discovery, Microsoft calendar

```
# ThoughtFolio 2.0 Implementation - Session 4: Settings & Enhancements

## Context
Read these files:
- Claude Context/PKM-PIVOT-FEATURE-SPEC.md (Sections 2.4, 2.5, 2.6)
- Claude Context/PKM-PIVOT-TASKS.md (Phase 7 + 8 + 9)
- Claude Context/PKM-PIVOT-CLAUDE-PROMPT.md

Sessions 1-3 completed: Search, Library, floating button, and capture are working.

## Your Tasks

### Part A: Focus Mode Settings (Phase 9)

1. **Update app/settings/page.tsx**
   - Add new "Focus Mode" section/card
   - Contains:
     - Toggle for "Focus Mode" (focus_mode_enabled)
     - Explanation text: "When enabled, Active List is limited to 10 thoughts"
     - When OFF, show slider for active_list_limit (10-25)
     - Current Active List count display

2. **Update app/settings/page.tsx**
   - Add "Daily Check-in" toggle (checkin_enabled)
   - Explanation: "When disabled, Today's Focus card is hidden"
   - Place in Preferences section

3. **Update app/settings/actions.ts**
   - Add updateFocusMode(enabled: boolean, limit?: number)
   - Add updateCheckinEnabled(enabled: boolean)
   - Both update profiles table

4. **Update lib/thoughts.ts**
   - Modify toggleActiveList to respect profile.active_list_limit
   - Fetch user's profile to get current limit
   - Use limit instead of hardcoded MAX_ACTIVE_LIST constant

5. **Update app/home/page.tsx (or DailyThoughtCard)**
   - Check profile.checkin_enabled
   - If false, don't show Today's Focus card
   - Show alternative message or just skip section

### Part B: Enhanced Discovery (Phase 8)

1. **Create components/discover/DiscoverTabs.tsx**
   - Three tabs: For You, Explore, Saved
   - Tab state management
   - Styled consistent with LibraryTabs

2. **Create components/discover/SavedDiscoveriesTab.tsx**
   - List of discoveries where saved_at IS NOT NULL
   - Each card shows: title, source, saved date
   - Actions: "Extract Thoughts", "Remove from Saved"
   - Empty state: "No saved discoveries yet"

3. **Update lib/discovery.ts**
   - Add saveDiscoveryForLater(discoveryId: string)
     - Sets saved_at = NOW()
   - Add unsaveDiscovery(discoveryId: string)
     - Sets saved_at = NULL
   - Add getSavedDiscoveries()
     - Returns discoveries WHERE saved_at IS NOT NULL

4. **Update components/discover/DiscoveryCard.tsx**
   - Add "Save for Later" button (bookmark icon)
   - Toggle state if already saved
   - Call saveDiscoveryForLater or unsaveDiscovery

5. **Update app/discover/page.tsx (or equivalent)**
   - Add DiscoverTabs component
   - Show appropriate content for each tab
   - For You = existing discovery flow
   - Explore = existing explore/search
   - Saved = SavedDiscoveriesTab

### Part C: Microsoft Calendar (Phase 7) - Optional/Partial

Note: Full Microsoft OAuth requires Azure AD app registration.
Implement the UI and service structure; OAuth can be completed when Azure credentials are available.

1. **Create lib/calendar-microsoft.ts**
   - Placeholder service with same interface as Google calendar
   - Functions: getAuthUrl, handleCallback, getEvents, syncCalendar
   - Return appropriate errors indicating "Microsoft Calendar coming soon" for now

2. **Update components/settings/CalendarSettings.tsx**
   - Add "Microsoft Outlook" section below Google
   - Show "Connect Microsoft Calendar" button
   - When clicked, show toast: "Microsoft Calendar integration coming soon"
   - Or if you have Azure credentials, implement full OAuth

3. **Create app/api/calendar/microsoft/auth/route.ts**
   - Placeholder that returns redirect URL or error
   - Structure ready for Microsoft Graph API

4. **Create app/api/calendar/microsoft/callback/route.ts**
   - Placeholder for OAuth callback handling
   - Structure ready for token exchange

## Guidelines

- Focus Mode changes should be backward compatible
- If focus_mode_enabled is true, use limit of 10 regardless of active_list_limit
- Discovery save/unsave should be instant (optimistic UI)
- Microsoft Calendar can be partial - UI ready, OAuth pending

## Verification

1. `npm run build` passes
2. Settings page shows Focus Mode toggle and slider
3. Disabling Focus Mode allows setting limit 10-25
4. Check-in toggle hides/shows Today's Focus
5. Active List respects new limit
6. Discovery cards have "Save for Later" option
7. Saved tab shows saved discoveries
8. Microsoft Calendar section visible in settings

## Commit

feat: Add focus mode settings and enhanced discovery

- Add Focus Mode toggle with configurable Active List limit (10-25)
- Add Check-in enabled toggle to hide Today's Focus
- Update Active List logic to respect user's limit setting
- Add Discovery tabs: For You, Explore, Saved
- Add save/unsave discovery functionality
- Add SavedDiscoveriesTab component
- Add Microsoft Calendar UI (OAuth pending)

Phase 7 + 8 + 9 of PKM Pivot

```

---

## Session 5: Polish & Finalization

**Phases:** 10
**Estimated tasks:** 8
**Creates:** Tests, performance optimizations, documentation

```
# ThoughtFolio 2.0 Implementation - Session 5: Polish & Launch

## Context
Read these files:
- Claude Context/PKM-PIVOT-TASKS.md (Phase 10)
- All code created in Sessions 1-4

Sessions 1-4 completed. All major features are implemented.

## Your Tasks

### Part A: Testing

1. **Create __tests__/lib/search.test.ts**
   - Test search function with various queries
   - Test empty query handling
   - Test type filtering
   - Test pagination (limit/offset)
   - Mock Supabase client

2. **Create __tests__/lib/sources.test.ts**
   - Test CRUD operations
   - Test getSourceByUrl deduplication
   - Test error handling
   - Mock Supabase client

3. **Create __tests__/components/search/GlobalSearch.test.tsx**
   - Test modal opens on trigger
   - Test search input debouncing
   - Test keyboard navigation
   - Test filter buttons
   - Use React Testing Library

4. **Create __tests__/components/capture/AICaptureModal.test.tsx**
   - Test modal states (empty, analyzing, suggestions)
   - Test content type detection display
   - Test item selection
   - Test save flow

### Part B: Performance Optimizations

1. **Optimize search queries**
   - Review lib/search.ts
   - Ensure proper use of indexes
   - Add query result caching if beneficial
   - Consider search result limit defaults

2. **Add search result caching**
   - Simple in-memory cache for recent searches
   - Cache key: query + filters
   - TTL: 30 seconds
   - Clear on new content creation

3. **Lazy load Library tabs**
   - Update LibraryTabs to only load active tab content
   - Use React.lazy or dynamic imports
   - Add loading states for tab switches

4. **Review and optimize component renders**
   - Add React.memo where beneficial
   - Ensure proper dependency arrays in useEffect
   - Check for unnecessary re-renders in Library/Search

### Part C: Documentation Updates

1. **Update Claude Context/ARCHITECTURE.md**
   - Add Sources entity documentation
   - Add Note-Thought Links documentation
   - Add Full-Text Search documentation
   - Update navigation structure
   - Add new settings documentation

2. **Update Claude Context/DECISIONS.md**
   - Add decision: "Full-text search with PostgreSQL tsvector"
   - Add decision: "Sources as first-class entities"
   - Add decision: "Unified Library architecture"
   - Add decision: "Floating Moment Button pattern"
   - Add decision: "AI Capture unified flow"

3. **Review and update CLAUDE.md**
   - Ensure project structure section is current
   - Update feature list
   - Add any new patterns or conventions

### Part D: Final Verification

1. **Full app testing checklist:**
   - [ ] Home dashboard loads correctly
   - [ ] Quick Actions row works (Capture, Moment, Discover)
   - [ ] Search (Cmd+K) works across all content types
   - [ ] Library page loads with all tabs
   - [ ] Context filter works in Library
   - [ ] Source detail pages work
   - [ ] Floating moment button works
   - [ ] AI Capture modal works with various inputs
   - [ ] Focus Mode settings work
   - [ ] Check-in toggle works
   - [ ] Discovery save/unsave works
   - [ ] Existing features still work:
     - [ ] Create thought manually
     - [ ] Extract from URL
     - [ ] Daily check-in
     - [ ] Moments matching
     - [ ] Context management
     - [ ] Theme switching
     - [ ] Calendar integration

2. **Run full test suite:**
   ```bash
   npm run test
   npm run lint
   npm run build
   

3. **Check for console errors:**
   - Open browser dev tools
   - Navigate through all new features
   - Note any warnings or errors

### Part E: Cleanup

1. **Remove any TODO comments** that were completed
2. **Remove any console.log** statements used for debugging
3. **Ensure consistent code formatting** (run prettier if available)
4. **Check for unused imports** in new files

## Verification

1. All tests pass
2. Build succeeds with no errors
3. Lint passes
4. No console errors in browser
5. All checklist items verified
6. Documentation is current

## Final Commit


feat: Complete PKM Pivot with tests and documentation

- Add unit tests for search and sources services
- Add component tests for GlobalSearch and AICaptureModal
- Optimize search with result caching
- Lazy load Library tabs for performance
- Update ARCHITECTURE.md with new entities and features
- Update DECISIONS.md with PKM Pivot decisions
- Final polish and cleanup

Phase 10 of PKM Pivot - Implementation Complete

```

---

## Post-Implementation Checklist

After all sessions are complete:

- [ ] All 5 sessions committed and pushed
- [ ] Create PR from feature branch to main
- [ ] Full app testing on preview deployment
- [ ] Merge to main
- [ ] Verify production deployment
- [ ] Monitor for errors

---

## Quick Reference: What Each Session Creates

| Session | Creates | Key Files |
|---------|---------|-----------|
| 1 | Types, Services, Search | lib/types/*, lib/*.ts, components/search/* |
| 2 | Navigation, Library | app/library/*, components/library/*, nav updates |
| 3 | Floating Button, Capture | components/moments/Floating*, components/capture/* |
| 4 | Settings, Discovery | app/settings updates, components/discover/* |
| 5 | Tests, Docs, Polish | __tests__/*, Claude Context/*.md |
