# Epic 13: Unified Sources Integration

## Overview

Tightly integrate Sources as a first-class entity throughout ThoughtFolio, connecting them with Thoughts, Notes, Moments, and Contexts. Sources become the central hub for tracking knowledge origin, enabling powerful workflows like "everything from this book" and source effectiveness analytics.

**Goal:** Transform Sources from passive metadata into an active, interconnected knowledge graph node.

---

## Current State

| Relationship | Status | Notes |
|-------------|--------|-------|
| Sources → Thoughts | Partial | DB has `source_id` FK, capture sets it, but TypeScript types don't expose it |
| Sources → Notes | Missing | No relationship exists |
| Sources → Moments | Missing | Only indirect via thoughts |
| Sources → Contexts | Missing | No relationship exists |
| Source Capture | Missing | Sources only created implicitly during URL extraction |

---

## Phase 1: Complete Sources → Thoughts Integration

**Goal:** Expose the existing `source_id` FK in TypeScript and improve the UI to show source relationships.

### 1.1 TypeScript Type Updates
- [ ] 1.1.1 Update `lib/types/thought.ts` - Add `source_id: string | null` to `Thought` interface
- [ ] 1.1.2 Update `lib/types/thought.ts` - Add `source_id?: string` to `CreateThoughtInput` interface
- [ ] 1.1.3 Create `lib/types/thought-with-source.ts` - Extended type with joined source data:
  ```typescript
  export interface ThoughtWithSource extends Thought {
    source_data?: {
      id: string;
      name: string;
      author: string | null;
      type: SourceType;
      cover_image_url: string | null;
    } | null;
  }
  ```
- [ ] 1.1.4 Export new types from `lib/types/index.ts`

### 1.2 Thought Component Updates
- [ ] 1.2.1 Update `components/thoughts/ThoughtCard.tsx` - Add source chip/badge when `source_id` exists
- [ ] 1.2.2 Create `components/ui/SourceBadge.tsx` - Reusable source indicator with icon + name
- [ ] 1.2.3 Update thought detail page - Add "From Source" section linking to source detail
- [ ] 1.2.4 Update `components/thoughts/ThoughtForm.tsx` - Add source search/select field

### 1.3 Source Detail Page Enhancement
- [ ] 1.3.1 Enhance `/app/library/sources/[id]/page.tsx`:
  - Improve layout with cover image hero
  - Add stats section (thought count, application count, created date)
  - Better thought list with filters (Active/Passive/All)
  - Add "Extract more thoughts" action
- [ ] 1.3.2 Add thought quick-add form inline on source page
- [ ] 1.3.3 Add empty state with CTA to capture first thought

### 1.4 Source Linking in Capture Flow
- [ ] 1.4.1 Update `app/api/capture/analyze/route.ts` - Ensure source detection is robust
- [ ] 1.4.2 Update `components/capture/AICaptureModal.tsx` - Show detected source, allow change
- [ ] 1.4.3 Add source search/autocomplete to manual thought form
- [ ] 1.4.4 Auto-create source when user types new source name (with confirmation)

---

## Phase 2: Sources → Notes Integration

**Goal:** Allow notes to be linked to multiple sources, enabling "reading notes" workflow.

### 2.1 Database Schema Changes
- [ ] 2.1.1 Create migration SQL for `note_sources` join table:
  ```sql
  CREATE TABLE note_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    source_id uuid REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(note_id, source_id)
  );

  -- RLS policies
  ALTER TABLE note_sources ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage their note sources"
    ON note_sources FOR ALL
    USING (
      EXISTS (SELECT 1 FROM notes WHERE notes.id = note_sources.note_id AND notes.user_id = auth.uid())
    );

  -- Index for performance
  CREATE INDEX idx_note_sources_note_id ON note_sources(note_id);
  CREATE INDEX idx_note_sources_source_id ON note_sources(source_id);
  ```
- [ ] 2.1.2 Run migration in Supabase
- [ ] 2.1.3 Verify RLS policies work correctly

### 2.2 TypeScript Types for Note-Source Links
- [ ] 2.2.1 Create `lib/types/note-source.ts`:
  ```typescript
  export interface NoteSource {
    id: string;
    note_id: string;
    source_id: string;
    created_at: string;
  }

  export interface NoteWithSources extends Note {
    sources?: Source[];
  }

  export interface SourceWithNotes extends Source {
    notes?: Note[];
  }
  ```
- [ ] 2.2.2 Update `lib/types/note.ts` - Add optional `source_ids?: string[]` to note types
- [ ] 2.2.3 Export new types

### 2.3 Note-Source Service Layer
- [ ] 2.3.1 Create `lib/note-sources.ts`:
  ```typescript
  // Link a source to a note
  linkSourceToNote(noteId: string, sourceId: string): Promise<void>

  // Unlink a source from a note
  unlinkSourceFromNote(noteId: string, sourceId: string): Promise<void>

  // Get all sources for a note
  getNoteSources(noteId: string): Promise<Source[]>

  // Get all notes for a source
  getSourceNotes(sourceId: string): Promise<Note[]>

  // Bulk link sources to note
  setNoteSources(noteId: string, sourceIds: string[]): Promise<void>
  ```
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
- [ ] 3.1.1 Add `status` column to sources table:
  ```sql
  ALTER TABLE sources ADD COLUMN status text
    DEFAULT 'reading'
    CHECK (status IN ('want_to_read', 'reading', 'completed', 'archived'));

  CREATE INDEX idx_sources_status ON sources(user_id, status);
  ```
- [ ] 3.1.2 Update `lib/types/source.ts` - Add `SourceStatus` type and status field
- [ ] 3.1.3 Add status constants and labels:
  ```typescript
  export type SourceStatus = 'want_to_read' | 'reading' | 'completed' | 'archived';

  export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
    want_to_read: 'Want to Read',
    reading: 'Reading',
    completed: 'Completed',
    archived: 'Archived',
  };

  export const SOURCE_STATUS_ICONS: Record<SourceStatus, string> = {
    want_to_read: '📚',
    reading: '📖',
    completed: '✅',
    archived: '📦',
  };
  ```

### 3.2 Add Source Modal
- [ ] 3.2.1 Create `components/sources/AddSourceModal.tsx`:
  - Name (required)
  - Author (optional)
  - Type dropdown (book/article/podcast/video/course/other)
  - Status dropdown (Want to Read/Reading/Completed/Archived)
  - URL (optional, for articles/videos)
  - ISBN (optional, for books)
  - Cover image URL (optional)
- [ ] 3.2.2 Create `components/sources/SourceForm.tsx` - Reusable form component
- [ ] 3.2.3 Add ISBN lookup integration (Open Library API):
  ```typescript
  // When user enters ISBN, fetch book details
  async function lookupISBN(isbn: string): Promise<BookDetails | null>
  ```
- [ ] 3.2.4 Auto-fetch cover image from Open Library when ISBN provided

### 3.3 Source API Routes
- [ ] 3.3.1 Create `app/api/sources/route.ts` (POST) - Create new source
- [ ] 3.3.2 Create `app/api/sources/[id]/route.ts` (PUT, DELETE) - Update/delete source
- [ ] 3.3.3 Create `app/api/sources/lookup/route.ts` (GET) - ISBN/URL metadata lookup
- [ ] 3.3.4 Add duplicate detection (by URL or ISBN)

### 3.4 Library Sources Tab Enhancement
- [ ] 3.4.1 Add "Add Source" button to `LibrarySourcesTab.tsx` header
- [ ] 3.4.2 Add status filter tabs: All | Want to Read | Reading | Completed | Archived
- [ ] 3.4.3 Update `SourceCard.tsx` - Show status badge
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
- [ ] 4.1.1 Create migration for `source_contexts` join table:
  ```sql
  CREATE TABLE source_contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
    context_id uuid REFERENCES contexts(id) ON DELETE CASCADE NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(source_id, context_id)
  );

  -- RLS policies
  ALTER TABLE source_contexts ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage their source contexts"
    ON source_contexts FOR ALL
    USING (
      EXISTS (SELECT 1 FROM sources WHERE sources.id = source_contexts.source_id AND sources.user_id = auth.uid())
    );

  CREATE INDEX idx_source_contexts_source_id ON source_contexts(source_id);
  CREATE INDEX idx_source_contexts_context_id ON source_contexts(context_id);
  ```
- [ ] 4.1.2 Run migration
- [ ] 4.1.3 Verify RLS

### 4.2 TypeScript Types
- [ ] 4.2.1 Create `lib/types/source-context.ts`:
  ```typescript
  export interface SourceContext {
    id: string;
    source_id: string;
    context_id: string;
    is_primary: boolean;
    created_at: string;
  }

  export interface SourceWithContexts extends Source {
    contexts?: Context[];
    primary_context?: Context;
  }
  ```
- [ ] 4.2.2 Update source types to include context relationships

### 4.3 Service Layer
- [ ] 4.3.1 Create `lib/source-contexts.ts`:
  ```typescript
  linkContextToSource(sourceId: string, contextId: string, isPrimary?: boolean): Promise<void>
  unlinkContextFromSource(sourceId: string, contextId: string): Promise<void>
  getSourceContexts(sourceId: string): Promise<Context[]>
  setSourceContexts(sourceId: string, contextIds: string[], primaryId?: string): Promise<void>
  getContextSources(contextId: string): Promise<Source[]>
  ```

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
- [ ] 5.1.1 Create source effectiveness tracking:
  ```sql
  -- View for source effectiveness (no new table needed, computed from moment_gems)
  CREATE OR REPLACE VIEW source_moment_effectiveness AS
  SELECT
    s.id as source_id,
    s.user_id,
    s.name as source_name,
    COUNT(DISTINCT mg.moment_id) as moments_surfaced,
    COUNT(DISTINCT mg.moment_id) FILTER (WHERE mg.was_helpful = true) as moments_helpful,
    COUNT(mg.id) as thoughts_surfaced,
    COUNT(mg.id) FILTER (WHERE mg.was_helpful = true) as thoughts_helpful,
    MAX(mg.created_at) FILTER (WHERE mg.was_helpful = true) as last_helpful_at
  FROM sources s
  JOIN gems g ON g.source_id = s.id
  JOIN moment_gems mg ON mg.gem_id = g.id
  GROUP BY s.id, s.user_id, s.name;
  ```
- [ ] 5.1.2 Add RLS to view

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
- [ ] Thought type includes `source_id` in TypeScript
- [ ] Thought cards show source badge when linked
- [ ] Source detail page shows all linked thoughts
- [ ] Capture flow shows detected source
- [ ] Manual thought form has source search/select

### Phase 2: Sources → Notes
- [ ] Notes can have multiple sources linked
- [ ] Note form has source multi-select
- [ ] Note cards show source badges
- [ ] Source detail page shows linked notes tab
- [ ] Capture auto-links notes to detected source

### Phase 3: Source Capture Flow
- [ ] Users can add sources directly (book, podcast, etc.)
- [ ] Sources have status (Want to Read, Reading, Completed, Archived)
- [ ] ISBN lookup fetches book details and cover
- [ ] Library has status filter tabs
- [ ] Quick status toggle on source cards

### Phase 4: Sources → Contexts
- [ ] Sources can be linked to multiple contexts
- [ ] Sources have a primary context
- [ ] Source cards show primary context badge
- [ ] Context pages show related sources
- [ ] New thoughts default to source's primary context

### Phase 5: Source-Aware Moments
- [ ] Source effectiveness stats available
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
- [ ] All migrations run successfully
- [ ] RLS policies verified
- [ ] TypeScript types updated and exported
- [ ] Unit tests for service layer
- [ ] UI components match existing design system
- [ ] Mobile responsive
- [ ] No console errors
- [ ] CLAUDE.md updated with new relationships
- [ ] PRD.md updated with Sources section
