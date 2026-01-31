# Epic 13: Unified Sources Integration

## Overview

Tightly integrate Sources as a first-class entity throughout ThoughtFolio, connecting them with Thoughts, Notes, Moments, and Contexts. Sources become the central hub for tracking knowledge origin, enabling powerful workflows like "everything from this book" and source effectiveness analytics.

**Goal:** Transform Sources from passive metadata into an active, interconnected knowledge graph node.

---

## Current State

| Relationship | Status | Notes |
|-------------|--------|-------|
| Sources → Thoughts | **Complete** | TypeScript types updated, capture flow links sources, UI shows badges |
| Sources → Notes | Schema Ready | `note_sources` table created, service layer implemented |
| Sources → Moments | Schema Ready | `source_moment_effectiveness` view created |
| Sources → Contexts | Schema Ready | `source_contexts` table created, service layer implemented |
| Source Capture | **Complete** | Add Source modal, ISBN lookup, status tracking all working |

## Implementation Progress

### Completed (January 2026)
- **Phase 1.1-1.4**: Full Sources → Thoughts integration
- **Phase 2.1-2.3**: Note-sources schema and service layer
- **Phase 3.1-3.4**: Source capture flow with status system
- **Phase 4.1-4.3**: Source-contexts schema and service layer
- **Phase 5.1**: Source effectiveness view created

### Remaining Work
- Phase 2.4-2.6: Note UI updates for multi-source selection
- Phase 3.5-3.6: Reading list view, quick add improvements
- Phase 4.4-4.5: Context UI updates, smart context suggestion
- Phase 5.2-5.4: Source stats components, moment integration
- Phase 6: Unified source view with tabs

---

## Phase 1: Complete Sources → Thoughts Integration

**Goal:** Expose the existing `source_id` FK in TypeScript and improve the UI to show source relationships.

### 1.1 TypeScript Type Updates
- [x] 1.1.1 Update `lib/types/thought.ts` - Add `source_id: string | null` to `Thought` interface
- [x] 1.1.2 Update `lib/types/thought.ts` - Add `source_id?: string` to `CreateThoughtInput` interface
- [x] 1.1.3 Create `lib/types/thought-with-source.ts` - Extended type with joined source data
- [x] 1.1.4 Export new types from `lib/types/index.ts`

### 1.2 Thought Component Updates
- [x] 1.2.1 Update `components/thoughts/ThoughtCard.tsx` - Add source chip/badge when `source_id` exists
- [x] 1.2.2 Create `components/ui/SourceBadge.tsx` - Reusable source indicator with icon + name (includes SourceBadge, SourceStatusBadge, SourceLink)
- [x] 1.2.3 Update thought detail page - Add "From Source" section linking to source detail
- [x] 1.2.4 Update `components/thoughts/ThoughtForm.tsx` - Add source search/select field (SourceSelector with toggle)

### 1.3 Source Detail Page Enhancement
- [x] 1.3.1 Enhance `/app/library/sources/[id]/page.tsx`:
  - [x] Improve layout with cover image hero
  - [x] Add stats section (thought count, application count, created date)
  - [x] Better thought list with filters (Active/Passive/All)
  - [x] Add status dropdown for changing source status
- [ ] 1.3.2 Add thought quick-add form inline on source page
- [ ] 1.3.3 Add empty state with CTA to capture first thought

### 1.4 Source Linking in Capture Flow
- [x] 1.4.1 Update `app/thoughts/actions.ts` - Include `source_id` in thought creation
- [x] 1.4.2 Update `components/extract-thoughts-modal.tsx` - Show detected source, allow change with SourceSelector
- [x] 1.4.3 Add source search/autocomplete to manual thought form (ThoughtForm has SourceSelector)
- [x] 1.4.4 Auto-create source when extracting from URL (getOrCreateSource in ExtractThoughtsModal)
- [x] 1.4.5 Update `app/api/thoughts/bulk/route.ts` - Support `source_id` parameter

---

## Phase 2: Sources → Notes Integration

**Goal:** Allow notes to be linked to multiple sources, enabling "reading notes" workflow.

### 2.1 Database Schema Changes
- [x] 2.1.1 Create migration SQL for `note_sources` join table
- [x] 2.1.2 Run migration in Supabase
- [x] 2.1.3 Verify RLS policies work correctly

### 2.2 TypeScript Types for Note-Source Links
- [x] 2.2.1 Create `lib/types/note-source.ts` with NoteSource, NoteWithSources, SourceWithNotes types
- [ ] 2.2.2 Update `lib/types/note.ts` - Add optional `source_ids?: string[]` to note types
- [x] 2.2.3 Export new types from `lib/types/index.ts`

### 2.3 Note-Source Service Layer
- [x] 2.3.1 Create `lib/note-sources.ts` with linkSourceToNote, unlinkSourceFromNote, getNoteSources, getSourceNotes, setNoteSources
- [ ] 2.3.2 Add tests for note-source service

### 2.4 Note UI Updates
- [ ] 2.4.1 Update `components/notes/NoteForm.tsx` - Add "Sources" multi-select field
- [ ] 2.4.2 Create `components/notes/SourceSelector.tsx` - Search + select multiple sources
- [ ] 2.4.3 Update `components/notes/NoteCard.tsx` - Show source badges
- [ ] 2.4.4 Update note detail page - Show linked sources section with links
- [ ] 2.4.5 Add "Link to Source" action on note detail page

### 2.5 Source Detail Page - Notes Section
- [ ] 2.5.1 Update `/app/library/sources/[id]/page.tsx` - Add "Notes about this source" section
- [ ] 2.5.2 Show note cards with preview
- [ ] 2.5.3 Add "Create note about this source" action
- [ ] 2.5.4 Tab navigation: Thoughts | Notes | Stats

### 2.6 Capture Flow Updates
- [ ] 2.6.1 Update `app/api/capture/save/route.ts` - Support `sourceIds` array for notes
- [ ] 2.6.2 When capturing from URL, auto-link created note to auto-created source
- [ ] 2.6.3 Update capture UI to show note-source linking option

---

## Phase 3: Source Capture Flow

**Goal:** Allow users to proactively add sources they want to track.

### 3.1 Source Status System
- [x] 3.1.1 Add `status` column to sources table (migration run by user)
- [x] 3.1.2 Update `lib/types/source.ts` - Add `SourceStatus` type and status field
- [x] 3.1.3 Add status constants and labels (SOURCE_STATUS_LABELS, SOURCE_STATUS_ICONS)

### 3.2 Add Source Modal
- [x] 3.2.1 Create `components/sources/AddSourceModal.tsx` with all fields (name, author, type, status, URL, ISBN, cover image)
- [x] 3.2.2 Create `components/sources/SourceSelector.tsx` - Search/select with quick-create
- [x] 3.2.3 Add ISBN lookup integration (Open Library API) - handleISBNLookup in AddSourceModal
- [x] 3.2.4 Auto-fetch cover image from Open Library when ISBN provided

### 3.3 Source API Routes
- [x] 3.3.1 Enhanced `lib/sources.ts` with createSource, updateSource, updateSourceStatus, getOrCreateSource, searchSources
- [ ] 3.3.2 Create `app/api/sources/[id]/route.ts` (PUT, DELETE) - Update/delete source (optional API layer)
- [ ] 3.3.3 Create `app/api/sources/lookup/route.ts` (GET) - ISBN/URL metadata lookup
- [ ] 3.3.4 Add duplicate detection (by URL or ISBN)

### 3.4 Library Sources Tab Enhancement
- [x] 3.4.1 Add "Add Source" button to `LibrarySourcesTab.tsx` header
- [x] 3.4.2 Add status filter tabs: All | Want to Read | Reading | Completed | Archived
- [x] 3.4.3 Update `SourceCard.tsx` - Show status badge (via SourceStatusBadge component)
- [ ] 3.4.4 Add quick status toggle on card (e.g., "Mark as Reading")
- [ ] 3.4.5 Add sorting: By status, By thought count, By date added

### 3.5 Reading List View
- [ ] 3.5.1 Create dedicated "Reading List" section/page
- [ ] 3.5.2 Show sources with status "want_to_read" or "reading"
- [ ] 3.5.3 Progress indicator (thoughts captured from this source)
- [ ] 3.5.4 Quick actions: Start Reading, Mark Complete, Capture Thought

### 3.6 Quick Add from Thought Form
- [ ] 3.6.1 Update thought source field with autocomplete
- [ ] 3.6.2 Show "Create '[typed name]' as new source" option when no match
- [ ] 3.6.3 Inline source creation with minimal fields (name, type)
- [ ] 3.6.4 Auto-link newly created source to the thought

---

## Phase 4: Sources → Contexts Integration

**Goal:** Associate sources with primary contexts for better organization and discovery.

### 4.1 Database Schema
- [x] 4.1.1 Create migration for `source_contexts` join table
- [x] 4.1.2 Run migration (by user)
- [x] 4.1.3 Verify RLS

### 4.2 TypeScript Types
- [x] 4.2.1 Create `lib/types/source-context.ts` with SourceContext, SourceWithContexts types
- [x] 4.2.2 Export new types from `lib/types/index.ts`

### 4.3 Service Layer
- [x] 4.3.1 Create `lib/source-contexts.ts` with linkContextToSource, unlinkContextFromSource, getSourceContexts, setSourceContexts, getContextSources

### 4.4 UI Updates
- [ ] 4.4.1 Update Add/Edit Source Modal - Add "Related Contexts" multi-select
- [ ] 4.4.2 Update Source Card - Show primary context badge
- [ ] 4.4.3 Update Source Detail Page - Show all related contexts
- [ ] 4.4.4 Add "Sources" section to Context detail/settings page
- [ ] 4.4.5 Filter sources by context in Library

### 4.5 Smart Context Suggestion
- [ ] 4.5.1 When adding thoughts from a source, default to source's primary context
- [ ] 4.5.2 Analyze existing thoughts from source to suggest contexts
- [ ] 4.5.3 Auto-link source to context when first thought is added (if not already linked)

---

## Phase 5: Source-Aware Moments

**Goal:** Track which sources produce the most helpful insights for moments, enabling source effectiveness analytics.

### 5.1 Database Schema
- [x] 5.1.1 Create source effectiveness tracking view `source_moment_effectiveness` (migration run by user)
- [x] 5.1.2 Add RLS to view

### 5.2 Source Stats Component
- [ ] 5.2.1 Create `components/sources/SourceStats.tsx`:
  - Thoughts: X active, Y passive, Z graduated
  - Applications: X times applied
  - Moments: Helpful in X moments
  - Notes: X notes linked
- [ ] 5.2.2 Add stats to Source Detail Page
- [ ] 5.2.3 Create `components/sources/SourceEffectivenessChart.tsx` (optional, future)

### 5.3 Moment Integration
- [ ] 5.3.1 After marking thought as "helpful", show source attribution
- [ ] 5.3.2 Add "View Source" link in moment thought card
- [ ] 5.3.3 Update moment detail to show sources of matched thoughts

### 5.4 Analytics Queries
- [ ] 5.4.1 Create `lib/source-analytics.ts`:
  ```typescript
  getSourceStats(sourceId: string): Promise<SourceStats>
  getTopSources(userId: string, limit?: number): Promise<SourceWithStats[]>
  getSourcesByContext(userId: string, contextId: string): Promise<SourceWithStats[]>
  ```
- [ ] 5.4.2 Add to Source Detail Page

---

## Phase 6: Unified Source View (Knowledge Graph Lite)

**Goal:** Create a comprehensive source detail page that shows all connected entities.

### 6.1 Enhanced Source Detail Page
- [ ] 6.1.1 Redesign `/app/library/sources/[id]/page.tsx` with tabs:
  - **Overview**: Stats, metadata, quick actions
  - **Thoughts**: All thoughts from this source with filters
  - **Notes**: All notes linked to this source
  - **Moments**: Moments where this source's thoughts were helpful
  - **Related**: Other sources in the same contexts
- [ ] 6.1.2 Add hero section with cover image (or type icon fallback)
- [ ] 6.1.3 Add progress ring for books (thoughts captured vs typical)

### 6.2 Source Connections Visualization
- [ ] 6.2.1 Create `components/sources/SourceConnections.tsx`:
  - Visual representation of: Source ↔ Thoughts ↔ Notes ↔ Moments
  - Simple node graph or list-based view
- [ ] 6.2.2 Click-through navigation to connected entities

### 6.3 "Everything from this Source" Export
- [ ] 6.3.1 Add "Export" action on source detail
- [ ] 6.3.2 Export options: Markdown, JSON
- [ ] 6.3.3 Include: source metadata, all thoughts, all notes, moment history

---

## Relevant Files

### New Files to Create
- `lib/types/thought-with-source.ts` — Extended thought type
- `lib/types/note-source.ts` — Note-source link types
- `lib/types/source-context.ts` — Source-context link types
- `lib/note-sources.ts` — Note-source service
- `lib/source-contexts.ts` — Source-context service
- `lib/source-analytics.ts` — Source stats queries
- `components/ui/SourceBadge.tsx` — Reusable source indicator
- `components/sources/AddSourceModal.tsx` — Add source modal
- `components/sources/SourceForm.tsx` — Reusable source form
- `components/sources/SourceStats.tsx` — Source statistics
- `components/sources/SourceSelector.tsx` — Source search/select
- `components/notes/SourceSelector.tsx` — Multi-source selector for notes
- `app/api/sources/route.ts` — Create source API
- `app/api/sources/[id]/route.ts` — Update/delete source API
- `app/api/sources/lookup/route.ts` — ISBN/URL lookup API

### Files to Modify
- `lib/types/thought.ts` — Add `source_id` field
- `lib/types/source.ts` — Add `status` field and types
- `lib/types/note.ts` — Add source relationship types
- `lib/types/index.ts` — Export new types
- `components/thoughts/ThoughtCard.tsx` — Add source badge
- `components/thoughts/ThoughtForm.tsx` — Add source selector
- `components/notes/NoteForm.tsx` — Add source multi-select
- `components/notes/NoteCard.tsx` — Show source badges
- `components/library/LibrarySourcesTab.tsx` — Add filters, add button
- `components/library/SourceCard.tsx` — Add status badge
- `app/library/sources/[id]/page.tsx` — Complete redesign
- `app/api/capture/save/route.ts` — Support note-source linking
- `components/capture/AICaptureModal.tsx` — Show source detection

---

## Database Migrations Summary

### Migration 1: Source Status
```sql
ALTER TABLE sources ADD COLUMN status text
  DEFAULT 'reading'
  CHECK (status IN ('want_to_read', 'reading', 'completed', 'archived'));
CREATE INDEX idx_sources_status ON sources(user_id, status);
```

### Migration 2: Note-Sources Join Table
```sql
CREATE TABLE note_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(note_id, source_id)
);
-- Plus RLS and indexes
```

### Migration 3: Source-Contexts Join Table
```sql
CREATE TABLE source_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
  context_id uuid REFERENCES contexts(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_id, context_id)
);
-- Plus RLS and indexes
```

### Migration 4: Source Effectiveness View
```sql
CREATE OR REPLACE VIEW source_moment_effectiveness AS
SELECT ...
```

---

## Acceptance Criteria

### Phase 1: Sources → Thoughts
- [x] Thought type includes `source_id` in TypeScript
- [x] Thought cards show source badge when linked
- [x] Source detail page shows all linked thoughts with filters
- [x] Capture flow (ExtractThoughtsModal) shows detected source
- [x] Manual thought form (ThoughtForm) has source search/select

### Phase 2: Sources → Notes
- [x] Database schema for note-sources created
- [x] Service layer implemented (lib/note-sources.ts)
- [ ] Note form has source multi-select
- [ ] Note cards show source badges
- [ ] Source detail page shows linked notes tab

### Phase 3: Source Capture Flow
- [x] Users can add sources directly via AddSourceModal
- [x] Sources have status (Want to Read, Reading, Completed, Archived)
- [x] ISBN lookup fetches book details and cover from Open Library
- [x] Library has status filter tabs
- [ ] Quick status toggle on source cards

### Phase 4: Sources → Contexts
- [x] Database schema for source-contexts created
- [x] Service layer implemented (lib/source-contexts.ts)
- [ ] Source cards show primary context badge
- [ ] Context pages show related sources
- [ ] New thoughts default to source's primary context

### Phase 5: Source-Aware Moments
- [x] Source effectiveness view created in database
- [ ] Source detail shows "Helpful in X moments"
- [ ] Moment detail shows source attribution
- [ ] Top sources by helpfulness query works

### Phase 6: Unified View
- [ ] Source detail has tabbed interface (Overview/Thoughts/Notes/Moments)
- [ ] Source connections visible
- [ ] Export functionality works

---

## Definition of Done

- [ ] All phase tasks completed
- [x] All migrations run successfully
- [x] RLS policies verified
- [x] TypeScript types updated and exported
- [ ] Unit tests for service layer
- [x] UI components match existing design system
- [ ] Mobile responsive
- [ ] No console errors
- [ ] CLAUDE.md updated with new relationships
- [ ] PRD.md updated with Sources section

---

## Test Plan (January 2026 Implementation)

This test plan covers the implemented features for Epic 13: Unified Sources Integration.

### Prerequisites
1. Run the application locally: `npm run dev`
2. Ensure you're logged in with a valid user account
3. Database migrations have been applied (status column, note_sources, source_contexts, source_moment_effectiveness view)

---

### Test Suite 1: Add Source Modal

**Location:** Library > Sources tab > "Add Source" button

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AS-01 | Open Add Source Modal | Click "Add Source" button | Modal opens with form fields |
| AS-02 | Validate required fields | Leave name empty, click submit | Error message shows "Name is required" |
| AS-03 | Create source manually | Fill name, author, type, status, click "Add Source" | Source created, toast shows success, modal closes |
| AS-04 | ISBN lookup - valid | Enter ISBN (e.g., 978-0-13-110362-7), click lookup button | Fields auto-populate with book details from Open Library |
| AS-05 | ISBN lookup - invalid | Enter invalid ISBN, click lookup button | Error toast shows "ISBN not found" |
| AS-06 | ISBN lookup - cover image | Enter valid ISBN with cover, click lookup | Cover image URL populated, preview shown |
| AS-07 | Type selection | Select each type (Book, Article, Podcast, Video, Course, Other) | Type dropdown works, selection persists |
| AS-08 | Status selection | Select each status (Want to Read, Reading, Completed, Archived) | Status dropdown works, selection persists |
| AS-09 | Optional URL field | Add source with URL | Source created with URL stored |
| AS-10 | Navigate after creation | Create source | Redirected to new source detail page |

---

### Test Suite 2: Source Status Filters (Library)

**Location:** Library > Sources tab

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SF-01 | Default view | Navigate to Library > Sources | "All" filter active, all sources shown |
| SF-02 | Filter by Want to Read | Click "Want to Read" filter | Only sources with that status shown |
| SF-03 | Filter by Reading | Click "Reading" filter | Only sources with that status shown |
| SF-04 | Filter by Completed | Click "Completed" filter | Only sources with that status shown |
| SF-05 | Filter by Archived | Click "Archived" filter | Only sources with that status shown |
| SF-06 | Filter counts | View filter tabs | Each filter shows correct count badge |
| SF-07 | Empty filter state | Click filter with no sources | Empty state message shown |
| SF-08 | Filter + search combo | Apply filter, then search | Results filtered by both status and search query |

---

### Test Suite 3: Source Detail Page

**Location:** Library > Sources > [Source Name]

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SD-01 | View source details | Click on a source card | Source detail page loads with all info |
| SD-02 | Change status | Use status dropdown to change status | Status updates, success feedback shown |
| SD-03 | Thought filter - All | Click "All" tab | All linked thoughts shown |
| SD-04 | Thought filter - Active | Click "Active" tab | Only active thoughts shown |
| SD-05 | Thought filter - Passive | Click "Passive" tab | Only passive thoughts shown |
| SD-06 | Stats display | View stats section | Shows total thoughts, on active list count, applications |
| SD-07 | Cover image display | View source with cover image | Cover image displayed correctly |
| SD-08 | No cover fallback | View source without cover image | Type icon fallback displayed |
| SD-09 | Linked thoughts count | View source with thoughts | Correct count shown in stats |

---

### Test Suite 4: ThoughtForm Source Linking

**Location:** Thoughts page > "Add Thought" button

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TF-01 | Source selector visible | Open thought form | Source field with selector shown |
| TF-02 | Search sources | Type in source selector | Matching sources appear in dropdown |
| TF-03 | Select existing source | Click a source from dropdown | Source selected, shown in field |
| TF-04 | Create new source | Type new name, click "Create [name]" | New source created and selected |
| TF-05 | Toggle to manual entry | Click "Enter manually" | Text input replaces selector |
| TF-06 | Toggle back to selector | Click "Search sources" | Selector replaces text input |
| TF-07 | Submit with source linked | Fill form with source, submit | Thought created with source_id set |
| TF-08 | Submit without source | Fill form without source, submit | Thought created with source_id = null |
| TF-09 | Source URL field | Enter manual source + URL | Both source name and URL saved |

---

### Test Suite 5: ExtractThoughtsModal Source Linking

**Location:** Thoughts page > "Extract with AI" button

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ET-01 | URL extraction auto-creates source | Enter URL, extract content | Source auto-created from page title/siteName |
| ET-02 | Source selector shown | View source field after extraction | SourceSelector shows with linked source |
| ET-03 | YouTube URL creates video source | Extract from YouTube URL | Source created with type "video" |
| ET-04 | Article URL creates article source | Extract from article URL | Source created with type "article" |
| ET-05 | Change source before save | Select different source | New source linked to extracted thoughts |
| ET-06 | Toggle to manual source | Click "Enter manually" | Can enter source name as text |
| ET-07 | Thoughts saved with source_id | Save extracted thoughts | All thoughts have source_id set |
| ET-08 | Fallback on source creation error | Source creation fails | Falls back to manual source mode |

---

### Test Suite 6: SourceSelector Component

**Location:** Used in ThoughtForm, ExtractThoughtsModal

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SS-01 | Debounced search | Type quickly | Only searches after typing stops |
| SS-02 | Loading state | Search for sources | Loading spinner shown while fetching |
| SS-03 | No results | Search for non-existent source | "No sources found" message |
| SS-04 | Quick create option | Type name not in results | "Create [name]" option appears |
| SS-05 | Clear selection | Click X on selected source | Source deselected |
| SS-06 | Display source info | Select a source | Shows name and author (if exists) |

---

### Test Suite 7: SourceBadge Components

**Location:** Various (ThoughtDetail, SourceCard)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SB-01 | SourceBadge displays | View thought with source | Source badge shows type icon + name |
| SB-02 | SourceStatusBadge displays | View source card | Status badge shows emoji + label |
| SB-03 | SourceLink navigation | Click source link | Navigates to source detail page |
| SB-04 | Badge styling | View badges | Matches glass morphism design system |

---

### Test Suite 8: Bulk Thoughts API

**Location:** API endpoint (via ExtractThoughtsModal)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BA-01 | Bulk create with source_id | Extract and save multiple thoughts | All thoughts have source_id in database |
| BA-02 | Mixed source_id values | Save some with source, some without | Correct source_id for each thought |
| BA-03 | Source name fallback | Manual source name provided | source field contains name |

---

### Test Suite 9: Edge Cases & Error Handling

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| EC-01 | Delete source with thoughts | Delete a source that has linked thoughts | Thoughts retain data, source_id nullified (or cascade delete based on FK) |
| EC-02 | Network error on source search | Disconnect network, search | Graceful error handling |
| EC-03 | Very long source name | Enter 200+ char name | Truncated or validation error |
| EC-04 | Special characters in name | Enter source with emojis, quotes | Handled correctly |
| EC-05 | Concurrent source creation | Rapidly create same source twice | No duplicates, or handled gracefully |

---

### Quick Smoke Test Checklist

Run through these quickly to verify core functionality:

- [ ] Can create a new source via Add Source modal
- [ ] ISBN lookup works for a known book
- [ ] Status filter tabs work in Library > Sources
- [ ] Can change source status on detail page
- [ ] ThoughtForm shows source selector
- [ ] Can link an existing source when creating a thought
- [ ] Can create a new source inline from ThoughtForm
- [ ] ExtractThoughtsModal auto-creates source from URL
- [ ] Extracted thoughts are saved with source_id
- [ ] Source detail page shows linked thoughts
