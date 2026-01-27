# ThoughtFolio 2.0: Implementation Tasks

> **Version:** 1.0
> **Date:** January 27, 2026
> **Status:** Ready for Development

---

## Quick Links

- [Feature Spec](./PKM-PIVOT-FEATURE-SPEC.md)
- [User Stories](./PKM-PIVOT-USER-STORIES.md)
- [SQL Migration](./PKM-PIVOT-SQL-MIGRATION.sql)

---

## Phase 1: Database Foundation

**Duration:** Week 1-2
**Priority:** P0 (Critical)
**Dependencies:** None

### 1.1 Schema Migrations

- [ ] **T1.1.1** Create `sources` table
  - File: `supabase/migrations/XXXXXX_create_sources_table.sql`
  - Columns: id, user_id, name, author, type, url, isbn, cover_image_url, metadata, search_vector, created_at, updated_at
  - RLS policy for user isolation
  - GIN index on search_vector

- [ ] **T1.1.2** Create `note_thought_links` table
  - File: `supabase/migrations/XXXXXX_create_note_thought_links.sql`
  - Columns: id, note_id, gem_id, position, created_at
  - Foreign keys with CASCADE delete
  - Unique constraint (note_id, gem_id)

- [ ] **T1.1.3** Add profile settings columns
  - File: `supabase/migrations/XXXXXX_add_profile_settings.sql`
  - Add: focus_mode_enabled, active_list_limit, checkin_enabled
  - Default values for existing rows

- [ ] **T1.1.4** Add calendar provider column
  - File: `supabase/migrations/XXXXXX_add_calendar_provider.sql`
  - Add: provider column with 'google' default
  - Update unique constraint

- [ ] **T1.1.5** Add gems source_id column
  - File: `supabase/migrations/XXXXXX_add_gems_source_id.sql`
  - Add: source_id UUID nullable reference
  - ON DELETE SET NULL behavior

- [ ] **T1.1.6** Add discoveries saved_at column
  - File: `supabase/migrations/XXXXXX_add_discoveries_saved_at.sql`
  - Add: saved_at TIMESTAMPTZ nullable
  - Index for reading list queries

### 1.2 Full-Text Search Infrastructure

- [ ] **T1.2.1** Add search_vector to gems table
  - File: `supabase/migrations/XXXXXX_add_gems_search_vector.sql`
  - Add: search_vector tsvector column
  - Create GIN index
  - Create update trigger function
  - Populate existing rows

- [ ] **T1.2.2** Add search_vector to notes table
  - File: `supabase/migrations/XXXXXX_add_notes_search_vector.sql`
  - Add: search_vector tsvector column
  - Create GIN index
  - Create update trigger function
  - Populate existing rows

- [ ] **T1.2.3** Add search_vector to sources table
  - Already included in T1.1.1

- [ ] **T1.2.4** Create unified_search view
  - File: `supabase/migrations/XXXXXX_create_unified_search_view.sql`
  - UNION of gems, notes, sources
  - Filter retired content

### 1.3 TypeScript Types

- [x] **T1.3.1** Create Source type
  - File: `lib/types/source.ts`
  - Interface: Source, CreateSourceInput, UpdateSourceInput
  - Type constants

- [x] **T1.3.2** Update Profile type
  - File: `lib/types.ts`
  - Add: focus_mode_enabled, active_list_limit, checkin_enabled

- [x] **T1.3.3** Update CalendarConnection type
  - File: `types/calendar.ts`
  - Add: provider field ('google' | 'microsoft')

- [x] **T1.3.4** Create NoteThoughtLink type
  - File: `lib/types/note-link.ts`
  - Interface: NoteThoughtLink

- [x] **T1.3.5** Create SearchResult type
  - File: `lib/types/search.ts`
  - Interface: SearchResult, SearchFilters

### 1.4 Services

- [x] **T1.4.1** Create sources service
  - File: `lib/sources.ts`
  - Functions: createSource, getSource, getSources, updateSource, deleteSource
  - Include search vector updates

- [x] **T1.4.2** Create note-links service
  - File: `lib/note-links.ts`
  - Functions: linkThoughtToNote, unlinkThought, getLinkedThoughts, getLinkedNotes

- [x] **T1.4.3** Create search service
  - File: `lib/search.ts`
  - Functions: search, searchByType
  - Use ts_rank for relevance

---

## Phase 2: Full-Text Search UI

**Duration:** Week 3
**Priority:** P0 (Critical)
**Dependencies:** Phase 1

### 2.1 Search Components

- [x] **T2.1.1** Create GlobalSearch component
  - File: `components/search/GlobalSearch.tsx`
  - Cmd+K keyboard shortcut listener
  - Modal with search input
  - Debounced search (300ms)

- [x] **T2.1.2** Create SearchResults component
  - File: `components/search/SearchResults.tsx`
  - Result cards by type
  - Keyboard navigation
  - Highlighting

- [x] **T2.1.3** Create SearchResultCard component
  - File: `components/search/SearchResultCard.tsx`
  - Type icon, content preview, metadata
  - Highlighted search terms

- [x] **T2.1.4** Create SearchFilters component
  - File: `components/search/SearchFilters.tsx`
  - Filter buttons: All, Thoughts, Notes, Sources
  - Active state styling

### 2.2 Search API

- [x] **T2.2.1** Create search API endpoint
  - File: `app/api/search/route.ts`
  - GET with query params: q, type, limit, offset
  - Returns ranked results

### 2.3 Search Integration

- [x] **T2.3.1** Add search to header
  - File: `components/layout-shell.tsx`
  - Search icon that opens GlobalSearch
  - Tooltip with keyboard shortcut

- [x] **T2.3.2** Add keyboard shortcut handler
  - File: `lib/hooks/useGlobalShortcuts.ts`
  - Cmd+K / Ctrl+K binding
  - Prevent default browser behavior

---

## Phase 3: Navigation Updates

**Duration:** Week 3-4
**Priority:** P1 (High)
**Dependencies:** Phase 1

### 3.1 Mobile Navigation

- [ ] **T3.1.1** Update BottomNavigation component
  - File: `components/layout/BottomNavigation.tsx`
  - New tabs: Home, Library, Active, Discover
  - Remove Moments tab

### 3.2 Desktop Sidebar

- [ ] **T3.2.1** Update Sidebar component
  - File: `components/layout/Sidebar.tsx`
  - Add Library with sub-items
  - Add Moments section
  - Add quick action buttons

### 3.3 Home Dashboard

- [ ] **T3.3.1** Create QuickActionsRow component
  - File: `components/home/QuickActionsRow.tsx`
  - Three cards: AI Capture, New Moment, Discover
  - Responsive layout

- [ ] **T3.3.2** Update Home page layout
  - File: `app/home/page.tsx`
  - Add QuickActionsRow
  - Add context chips filter
  - Add recent activity section

---

## Phase 4: Unified Library

**Duration:** Week 4-5
**Priority:** P1 (High)
**Dependencies:** Phase 1, 3

### 4.1 Library Page

- [ ] **T4.1.1** Create Library page
  - File: `app/library/page.tsx`
  - Tabbed layout with URL state
  - Search bar integration

- [ ] **T4.1.2** Create LibraryTabs component
  - File: `components/library/LibraryTabs.tsx`
  - Tabs: All, Thoughts, Notes, Sources, Archive
  - Mobile-responsive

- [ ] **T4.1.3** Create ContextChipsFilter component
  - File: `components/ui/ContextChipsFilter.tsx`
  - Horizontal scrollable chips
  - Multi-select support
  - Badge counts

### 4.2 Library Tab Content

- [ ] **T4.2.1** Create LibraryAllTab component
  - File: `components/library/LibraryAllTab.tsx`
  - Mixed feed of all content types
  - Infinite scroll

- [ ] **T4.2.2** Create LibraryThoughtsTab component
  - File: `components/library/LibraryThoughtsTab.tsx`
  - Thought cards with Active List badge
  - Context filtering

- [ ] **T4.2.3** Create LibraryNotesTab component
  - File: `components/library/LibraryNotesTab.tsx`
  - Note cards with linked thoughts count
  - Folder organization

- [ ] **T4.2.4** Create LibrarySourcesTab component
  - File: `components/library/LibrarySourcesTab.tsx`
  - Source cards with cover images
  - Type filtering

- [ ] **T4.2.5** Create LibraryArchiveTab component
  - File: `components/library/LibraryArchiveTab.tsx`
  - Retired content with restore/delete

### 4.3 Source Components

- [ ] **T4.3.1** Create SourceCard component
  - File: `components/library/SourceCard.tsx`
  - Cover image, title, author, type badge
  - Linked content count

- [ ] **T4.3.2** Create SourceDetail page
  - File: `app/library/sources/[id]/page.tsx`
  - Full source metadata
  - Linked thoughts and notes list

---

## Phase 5: Floating Moment Button

**Duration:** Week 5
**Priority:** P1 (High)
**Dependencies:** None (parallel)

### 5.1 Floating Button

- [ ] **T5.1.1** Create FloatingMomentButton component
  - File: `components/moments/FloatingMomentButton.tsx`
  - Fixed position bottom-right
  - Scroll hide/show behavior
  - Expansion on tap

- [ ] **T5.1.2** Create FloatingButtonMenu component
  - File: `components/moments/FloatingButtonMenu.tsx`
  - Two options: From Calendar, Describe It
  - Animation for expand/collapse

- [ ] **T5.1.3** Create QuickMomentEntry component
  - File: `components/moments/QuickMomentEntry.tsx`
  - Inline text input
  - Optional date/time picker
  - Submit to moments API

- [ ] **T5.1.4** Create CalendarEventPicker component
  - File: `components/moments/CalendarEventPicker.tsx`
  - List of upcoming events
  - Select to create moment

### 5.2 Integration

- [ ] **T5.2.1** Add FloatingMomentButton to layout
  - File: `components/layout-shell.tsx`
  - Conditionally hide on Moments page

---

## Phase 6: AI Quick Capture

**Duration:** Week 6-7
**Priority:** P1 (High)
**Dependencies:** Phase 1, 4

### 6.1 Capture Modal

- [ ] **T6.1.1** Create AICaptureModal component
  - File: `components/capture/AICaptureModal.tsx`
  - Modal with text area
  - Entry point handlers (Cmd+N, header, home)

- [ ] **T6.1.2** Create CaptureEmptyState component
  - File: `components/capture/CaptureEmptyState.tsx`
  - Placeholder text
  - Example suggestions

- [ ] **T6.1.3** Create CaptureAnalyzing component
  - File: `components/capture/CaptureAnalyzing.tsx`
  - Loading spinner
  - "Analyzing..." text

- [ ] **T6.1.4** Create CaptureSuggestions component
  - File: `components/capture/CaptureSuggestions.tsx`
  - List of detected items
  - Checkboxes for selection
  - Edit capability per item

- [ ] **T6.1.5** Create CaptureItemCard component
  - File: `components/capture/CaptureItemCard.tsx`
  - Type label (THOUGHT/NOTE/SOURCE)
  - Content preview
  - Context dropdown
  - Edit button

### 6.2 Capture API

- [ ] **T6.2.1** Create capture analysis endpoint
  - File: `app/api/capture/analyze/route.ts`
  - POST with content
  - Returns detected items with types

- [ ] **T6.2.2** Create capture save endpoint
  - File: `app/api/capture/save/route.ts`
  - POST with selected items
  - Creates thoughts, notes, sources
  - Returns created entities

### 6.3 AI Detection Logic

- [ ] **T6.3.1** Create content detector
  - File: `lib/ai/content-detector.ts`
  - URL detection
  - Quote detection
  - Length-based classification
  - Bullet list detection

- [ ] **T6.3.2** Create content splitter
  - File: `lib/ai/content-splitter.ts`
  - Separate quotes from reflections
  - Identify source attribution
  - Generate suggestions

---

## Phase 7: Focus Mode Settings

**Duration:** Week 7
**Priority:** P2 (Medium)
**Dependencies:** Phase 1

### 7.1 Settings UI

- [ ] **T7.1.1** Add Focus Mode section to Settings
  - File: `app/settings/page.tsx`
  - Toggle for focus_mode_enabled
  - Slider for active_list_limit (when OFF)

- [ ] **T7.1.2** Add Check-in toggle to Settings
  - File: `app/settings/page.tsx`
  - Toggle for checkin_enabled
  - Explanation text

### 7.2 Settings Actions

- [ ] **T7.2.1** Add focus mode actions
  - File: `app/settings/actions.ts`
  - updateFocusMode(enabled, limit)
  - updateCheckinEnabled(enabled)

### 7.3 Active List Logic

- [ ] **T7.3.1** Update Active List limit enforcement
  - File: `lib/thoughts.ts`
  - Use profile.active_list_limit instead of constant
  - Respect focus_mode_enabled

---

## Phase 8: Enhanced Discovery

**Duration:** Week 8
**Priority:** P2 (Medium)
**Dependencies:** Phase 1

### 8.1 Tabbed Discovery

- [ ] **T8.1.1** Create DiscoverTabs component
  - File: `components/discover/DiscoverTabs.tsx`
  - Tabs: For You, Explore, Saved
  - Tab state management

- [ ] **T8.1.2** Create SavedDiscoveriesTab component
  - File: `components/discover/SavedDiscoveriesTab.tsx`
  - List of saved discoveries
  - Extract/remove actions

### 8.2 Saved Discoveries

- [ ] **T8.2.1** Update discovery service
  - File: `lib/discovery.ts`
  - Add: saveDiscoveryForLater, getSavedDiscoveries
  - Update saved_at column

- [ ] **T8.2.2** Add save action to discovery cards
  - File: `components/discover/DiscoveryCard.tsx`
  - "Save for Later" button
  - Visual state change when saved

---

## Phase 9: Microsoft Calendar

**Duration:** Week 9
**Priority:** P3 (Low)
**Dependencies:** Phase 1

### 9.1 Microsoft OAuth

- [ ] **T9.1.1** Create Microsoft OAuth endpoints
  - File: `app/api/calendar/microsoft/auth/route.ts`
  - File: `app/api/calendar/microsoft/callback/route.ts`
  - Microsoft Graph API integration

- [ ] **T9.1.2** Create Microsoft calendar service
  - File: `lib/calendar-microsoft.ts`
  - getEvents, syncCalendar
  - Token refresh handling

### 9.2 Settings Integration

- [ ] **T9.2.1** Add Microsoft Calendar to settings
  - File: `components/settings/CalendarSettings.tsx`
  - Connect button
  - Same configuration as Google

---

## Phase 10: Polish & Launch

**Duration:** Week 10
**Priority:** P1 (High)
**Dependencies:** All previous phases

### 10.1 Testing

- [ ] **T10.1.1** Unit tests for search service
- [ ] **T10.1.2** Unit tests for sources service
- [ ] **T10.1.3** Integration tests for capture flow
- [ ] **T10.1.4** E2E tests for Library navigation

### 10.2 Performance

- [ ] **T10.2.1** Optimize search queries
- [ ] **T10.2.2** Add search result caching
- [ ] **T10.2.3** Lazy load Library tabs

### 10.3 Documentation

- [ ] **T10.3.1** Update ARCHITECTURE.md
- [ ] **T10.3.2** Update user-facing help docs
- [ ] **T10.3.3** Update onboarding flow

---

## Task Summary

| Phase | Tasks | Estimated Days |
|-------|-------|----------------|
| 1. Database Foundation | 17 | 5 |
| 2. Full-Text Search UI | 7 | 3 |
| 3. Navigation Updates | 4 | 2 |
| 4. Unified Library | 10 | 5 |
| 5. Floating Moment Button | 5 | 2 |
| 6. AI Quick Capture | 9 | 5 |
| 7. Focus Mode Settings | 4 | 1 |
| 8. Enhanced Discovery | 4 | 2 |
| 9. Microsoft Calendar | 3 | 2 |
| 10. Polish & Launch | 7 | 3 |
| **Total** | **70** | **30 days** |

---

## Definition of Done

Each task is complete when:
1. Code implemented and type-safe
2. RLS policies verified (for DB changes)
3. Existing functionality not broken
4. Manual testing passed
5. Code reviewed (if applicable)
6. Documentation updated (if applicable)
