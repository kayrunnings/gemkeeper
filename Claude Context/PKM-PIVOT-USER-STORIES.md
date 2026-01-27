# ThoughtFolio 2.0: User Story Breakdown

> **Version:** 1.0
> **Date:** January 27, 2026

---

## Epic Overview

| Epic | Description | Priority |
|------|-------------|----------|
| **E1** | Full-Text Search | P0 (Critical) |
| **E2** | Database Foundation | P0 (Critical) |
| **E3** | Unified Library | P1 (High) |
| **E4** | AI-Powered Quick Capture | P1 (High) |
| **E5** | Floating Moment Button | P1 (High) |
| **E6** | Source Entities | P2 (Medium) |
| **E7** | Enhanced Discovery | P2 (Medium) |
| **E8** | Microsoft Calendar | P3 (Low) |
| **E9** | Focus Mode Settings | P2 (Medium) |
| **E10** | Navigation Updates | P1 (High) |

---

## Epic 1: Full-Text Search (E1)

### E1-US1: Global Search Modal
**As a** user
**I want** to press Cmd+K (or Ctrl+K) anywhere in the app
**So that** I can quickly search my entire knowledge base without navigating

**Acceptance Criteria:**
- [ ] Keyboard shortcut `Cmd+K` / `Ctrl+K` opens search modal from any page
- [ ] Modal appears centered with focus on search input
- [ ] Pressing `Esc` closes the modal
- [ ] Click outside modal closes it
- [ ] Modal has glassmorphism styling consistent with app theme

---

### E1-US2: Instant Search Results
**As a** user
**I want** to see search results as I type
**So that** I can find content quickly without pressing Enter

**Acceptance Criteria:**
- [ ] Results appear after 300ms debounce
- [ ] Loading state shown during search
- [ ] Empty state shown when no results
- [ ] Results grouped by type (Thoughts, Notes, Sources)
- [ ] Maximum 10 results shown initially with "Show more" option

---

### E1-US3: Search Result Cards
**As a** user
**I want** to see relevant information in each search result
**So that** I can identify the right item without opening it

**Acceptance Criteria:**
- [ ] Each result shows: type icon, title/content preview, secondary info
- [ ] Search terms highlighted in bold
- [ ] Thought cards show: content, source, context badge
- [ ] Note cards show: title, content preview, updated date
- [ ] Source cards show: name, author, type badge

---

### E1-US4: Search Keyboard Navigation
**As a** user
**I want** to navigate search results with keyboard
**So that** I can select items without using mouse

**Acceptance Criteria:**
- [ ] Arrow Up/Down moves selection through results
- [ ] Enter opens selected result
- [ ] First result is selected by default
- [ ] Visual highlight on selected result
- [ ] Tab cycles through filter buttons before entering results

---

### E1-US5: Search Type Filters
**As a** user
**I want** to filter search results by content type
**So that** I can narrow down results when I know what I'm looking for

**Acceptance Criteria:**
- [ ] Filter buttons: All, Thoughts, Notes, Sources
- [ ] "All" is selected by default
- [ ] Clicking filter updates results immediately
- [ ] Active filter has distinct visual style
- [ ] Result counts shown per filter (optional)

---

### E1-US6: Search from Header
**As a** user
**I want** a search icon in the header
**So that** I can access search with a click if I prefer

**Acceptance Criteria:**
- [ ] Search icon (🔍) visible in header on all pages
- [ ] Clicking icon opens same search modal as Cmd+K
- [ ] Tooltip shows "Search (⌘K)" on hover

---

### E1-US7: Search in Library
**As a** user
**I want** a search bar within the Library page
**So that** I can search while browsing my content

**Acceptance Criteria:**
- [ ] Search input at top of Library page
- [ ] Searches within current Library tab (Thoughts/Notes/Sources)
- [ ] Same instant search behavior as global search
- [ ] Can be combined with context chip filters

---

### E1-US8: Search History (Optional)
**As a** user
**I want** to see my recent searches
**So that** I can quickly repeat common searches

**Acceptance Criteria:**
- [ ] Last 5 searches shown when modal opens (before typing)
- [ ] Clicking history item performs that search
- [ ] "Clear history" option available
- [ ] History stored in localStorage

---

## Epic 2: Database Foundation (E2)

### E2-US1: Sources Table Migration
**As a** developer
**I want** a sources table created with RLS
**So that** we can store first-class source entities

**Acceptance Criteria:**
- [ ] Table `sources` created with columns: id, user_id, name, author, type, url, isbn, cover_image_url, metadata, search_vector, created_at, updated_at
- [ ] RLS policy: users can only CRUD their own sources
- [ ] Index on user_id for fast queries
- [ ] GIN index on search_vector for full-text search

---

### E2-US2: Note-Thought Links Table
**As a** developer
**I want** a junction table for note-thought relationships
**So that** we can link thoughts to notes bidirectionally

**Acceptance Criteria:**
- [ ] Table `note_thought_links` created with: id, note_id, gem_id, position, created_at
- [ ] Foreign keys to notes and gems with CASCADE delete
- [ ] Unique constraint on (note_id, gem_id)
- [ ] RLS through parent tables (no direct user_id needed)

---

### E2-US3: Profile Settings Columns
**As a** developer
**I want** new columns on profiles table
**So that** we can store Focus Mode and check-in settings

**Acceptance Criteria:**
- [ ] Column `focus_mode_enabled` BOOLEAN DEFAULT true
- [ ] Column `active_list_limit` INTEGER DEFAULT 10 CHECK (10-25)
- [ ] Column `checkin_enabled` BOOLEAN DEFAULT true
- [ ] Existing rows get default values (non-breaking)

---

### E2-US4: Calendar Provider Support
**As a** developer
**I want** a provider column on calendar_connections
**So that** we can support both Google and Microsoft calendars

**Acceptance Criteria:**
- [ ] Column `provider` TEXT DEFAULT 'google' CHECK ('google', 'microsoft')
- [ ] Existing rows default to 'google' (non-breaking)
- [ ] Unique constraint updated to include provider

---

### E2-US5: Full-Text Search Vectors
**As a** developer
**I want** tsvector columns and triggers on searchable tables
**So that** PostgreSQL can perform fast full-text search

**Acceptance Criteria:**
- [ ] Column `search_vector` on gems, notes, sources tables
- [ ] GIN indexes on all search_vector columns
- [ ] Trigger functions to update vectors on INSERT/UPDATE
- [ ] Initial population of vectors for existing data

---

### E2-US6: Gems Source Reference
**As a** developer
**I want** a source_id column on gems table
**So that** thoughts can reference source entities

**Acceptance Criteria:**
- [ ] Column `source_id` UUID REFERENCES sources(id)
- [ ] Nullable (existing `source` text field still works)
- [ ] ON DELETE SET NULL (don't cascade delete thoughts)

---

### E2-US7: Discoveries Saved Column
**As a** developer
**I want** a saved_at column on discoveries
**So that** users can save discoveries for later

**Acceptance Criteria:**
- [ ] Column `saved_at` TIMESTAMPTZ nullable
- [ ] Index on (user_id, saved_at) for reading list queries

---

### E2-US8: Unified Search API View
**As a** developer
**I want** a unified search view
**So that** we can query across all content types efficiently

**Acceptance Criteria:**
- [ ] View `unified_search` combining gems, notes, sources
- [ ] Columns: id, type, text, secondary_text, user_id, context_id, search_vector, created_at
- [ ] Filters out retired thoughts
- [ ] Used by search API endpoint

---

## Epic 3: Unified Library (E3)

### E3-US1: Library Page Layout
**As a** user
**I want** a unified Library page with tabs
**So that** I can browse all my content in one place

**Acceptance Criteria:**
- [ ] New route `/library` with tabbed layout
- [ ] Tabs: All, Thoughts, Notes, Sources, Archive
- [ ] Tab state persisted in URL query param
- [ ] Mobile-responsive with horizontal scroll tabs

---

### E3-US2: Library Context Chips
**As a** user
**I want** to filter Library content by context
**So that** I can focus on a specific area of my knowledge

**Acceptance Criteria:**
- [ ] Horizontal scrollable context chips below tabs
- [ ] "All" chip selected by default
- [ ] Clicking chip filters to that context
- [ ] Badge shows count per context
- [ ] Works across all tabs except Sources

---

### E3-US3: Library All Tab
**As a** user
**I want** to see all content types in one unified feed
**So that** I can browse chronologically

**Acceptance Criteria:**
- [ ] Mixed feed of thoughts, notes, sources
- [ ] Sorted by updated_at descending
- [ ] Type icon on each card
- [ ] Infinite scroll or pagination
- [ ] Respects context chip filter

---

### E3-US4: Library Thoughts Tab
**As a** user
**I want** to see all my thoughts in the Library
**So that** I can browse and manage them

**Acceptance Criteria:**
- [ ] Shows all thoughts (active + passive status)
- [ ] Active List badge on applicable thoughts
- [ ] Click to open thought detail
- [ ] Context badge on each card
- [ ] Respects context chip filter

---

### E3-US5: Library Notes Tab
**As a** user
**I want** to see all my notes in the Library
**So that** I can browse and manage them

**Acceptance Criteria:**
- [ ] Shows all notes with title and preview
- [ ] Folder organization (if applicable)
- [ ] Click to open note editor
- [ ] Linked thoughts count shown
- [ ] Search within notes

---

### E3-US6: Library Sources Tab
**As a** user
**I want** to see all my sources in the Library
**So that** I can browse my reading/learning history

**Acceptance Criteria:**
- [ ] Shows all source entities
- [ ] Cover images displayed (when available)
- [ ] Type badge (book, article, podcast, etc.)
- [ ] Linked thoughts count
- [ ] Click to see source detail with linked content

---

### E3-US7: Library Archive Tab
**As a** user
**I want** to see archived/retired content
**So that** I can restore or permanently delete it

**Acceptance Criteria:**
- [ ] Shows retired thoughts, deleted notes
- [ ] Clear visual distinction (grayed out)
- [ ] Restore action available
- [ ] Permanent delete option (with confirmation)

---

## Epic 4: AI-Powered Quick Capture (E4)

### E4-US1: Capture Modal Entry Points
**As a** user
**I want** multiple ways to open the AI Capture modal
**So that** I can capture knowledge from anywhere

**Acceptance Criteria:**
- [ ] ✨ Quick Action card on Home dashboard
- [ ] (+) button in global header
- [ ] Keyboard shortcut `Cmd+N` / `Ctrl+N`
- [ ] All open same modal component

---

### E4-US2: Capture Modal Empty State
**As a** user
**I want** helpful guidance when opening capture
**So that** I know what kinds of content I can paste

**Acceptance Criteria:**
- [ ] Large text area with placeholder text
- [ ] Examples section showing: URL, quote, notes, idea
- [ ] Hint text: "Paste or type anything — I'll help you save it"
- [ ] Focus on text area on open

---

### E4-US3: Content Type Detection
**As a** user
**I want** AI to detect what type of content I pasted
**So that** I don't have to categorize it myself

**Acceptance Criteria:**
- [ ] URL detection with metadata fetch
- [ ] Short text (<200 chars) → likely thought
- [ ] Long text (>200 chars) → analyze for mixed content
- [ ] Quote detection (quotation marks, attribution)
- [ ] Bullet list detection → multiple thoughts

---

### E4-US4: Capture Analysis Loading
**As a** user
**I want** to see that AI is processing my content
**So that** I know the app is working

**Acceptance Criteria:**
- [ ] Loading spinner with "Analyzing..." text
- [ ] Subtle animation
- [ ] Timeout after 10 seconds with error message

---

### E4-US5: Capture Suggestions Display
**As a** user
**I want** to see AI suggestions for what to save
**So that** I can review and approve before saving

**Acceptance Criteria:**
- [ ] Each suggestion has checkbox (default checked)
- [ ] Type label: THOUGHT, NOTE, SOURCE
- [ ] Content preview with ability to edit
- [ ] Context dropdown per item
- [ ] "Add to Active List" toggle for thoughts

---

### E4-US6: Mixed Content Splitting
**As a** user
**I want** AI to separate quotes from my reflections
**So that** I get clean atomic thoughts

**Acceptance Criteria:**
- [ ] Detected quote → THOUGHT suggestion
- [ ] Surrounding reflection → NOTE suggestion
- [ ] Option to link note to thought
- [ ] Source attribution carried through

---

### E4-US7: URL Extraction Options
**As a** user
**I want** to choose how to handle a pasted URL
**So that** I can extract thoughts, save source, or summarize

**Acceptance Criteria:**
- [ ] URL detected → show options modal
- [ ] Option 1: Extract Thoughts (AI reads and extracts)
- [ ] Option 2: Save Source Only (add to library)
- [ ] Option 3: Summarize as Note (AI summary + thoughts)

---

### E4-US8: Capture Confirmation
**As a** user
**I want** confirmation after saving
**So that** I know my content was captured

**Acceptance Criteria:**
- [ ] Success toast with count: "Saved 2 thoughts and 1 note"
- [ ] Link to view saved items
- [ ] Modal closes after save
- [ ] Option to capture more

---

## Epic 5: Floating Moment Button (E5)

### E5-US1: Floating Button Display
**As a** user
**I want** to see a floating moment button on every page
**So that** I can create moments from anywhere

**Acceptance Criteria:**
- [ ] 🎯 icon button in bottom-right corner
- [ ] Semi-transparent when idle
- [ ] Above bottom navigation (mobile)
- [ ] Not shown on Moments page

---

### E5-US2: Floating Button Scroll Behavior
**As a** user
**I want** the button to hide during scroll
**So that** it doesn't obstruct content

**Acceptance Criteria:**
- [ ] Button hides (fade out) when scrolling down
- [ ] Button reappears after 500ms of no scroll
- [ ] Smooth transitions

---

### E5-US3: Floating Button Expansion
**As a** user
**I want** to tap the button and see options
**So that** I can choose how to create a moment

**Acceptance Criteria:**
- [ ] Tap → button expands to show two options
- [ ] Option 1: "From Calendar" (📅 icon)
- [ ] Option 2: "Describe It" (✏️ icon)
- [ ] Tap outside → collapses back

---

### E5-US4: Quick Moment Entry
**As a** user
**I want** to quickly describe a moment inline
**So that** I don't have to navigate to the Moments page

**Acceptance Criteria:**
- [ ] Tapping "Describe It" opens inline text input
- [ ] Optional date/time picker
- [ ] "Find Relevant Thoughts" button
- [ ] Results show in expandable panel

---

### E5-US5: Calendar Moment Picker
**As a** user
**I want** to select from upcoming calendar events
**So that** I can create moments for scheduled meetings

**Acceptance Criteria:**
- [ ] Tapping "From Calendar" opens event list
- [ ] Shows next 7 days of events
- [ ] Selecting event creates moment with title
- [ ] Only shown if calendar is connected

---

## Epic 6: Source Entities (E6)

### E6-US1: Source CRUD Service
**As a** developer
**I want** a source service with CRUD operations
**So that** components can manage source entities

**Acceptance Criteria:**
- [ ] `createSource(input)` → creates source
- [ ] `getSource(id)` → fetches single source
- [ ] `getSources()` → fetches all user sources
- [ ] `updateSource(id, input)` → updates source
- [ ] `deleteSource(id)` → deletes source (thoughts unlinked)

---

### E6-US2: Source Card Component
**As a** user
**I want** to see source information in a card format
**So that** I can browse my sources visually

**Acceptance Criteria:**
- [ ] Cover image (or placeholder icon)
- [ ] Title (name)
- [ ] Author (if available)
- [ ] Type badge (book, article, etc.)
- [ ] Linked thoughts count

---

### E6-US3: Source Detail View
**As a** user
**I want** to see a source's full details
**So that** I can view all linked content

**Acceptance Criteria:**
- [ ] Full source metadata displayed
- [ ] List of linked thoughts
- [ ] List of linked notes
- [ ] Edit and delete actions
- [ ] "Add thought from this source" action

---

### E6-US4: Auto Source Creation
**As a** user
**I want** sources created automatically from URLs
**So that** I don't have to manually create them

**Acceptance Criteria:**
- [ ] URL extraction creates source entity
- [ ] Metadata fetched: title, author, image
- [ ] Duplicate detection by URL
- [ ] Source linked to extracted thoughts

---

### E6-US5: Thought-Source Linking
**As a** user
**I want** to link thoughts to sources
**So that** I can track where my knowledge came from

**Acceptance Criteria:**
- [ ] Source picker in thought create/edit
- [ ] Search existing sources
- [ ] Create new source inline
- [ ] Source shown on thought cards

---

## Epic 7: Enhanced Discovery (E7)

### E7-US1: Tabbed Discovery Interface
**As a** user
**I want** Discovery organized into tabs
**So that** I can explore different ways to discover content

**Acceptance Criteria:**
- [ ] Tabs: For You, Explore, Saved
- [ ] Tab state persisted
- [ ] Mobile-responsive

---

### E7-US2: Saved Discoveries List
**As a** user
**I want** to save discoveries for later
**So that** I can build a reading list

**Acceptance Criteria:**
- [ ] "Save for Later" action on discovery cards
- [ ] Saved tab shows all saved discoveries
- [ ] Can extract or remove from saved
- [ ] Sorted by saved date

---

### E7-US3: Discovery Gap Detection
**As a** user
**I want** AI to suggest content for my knowledge gaps
**So that** I can develop areas with few thoughts

**Acceptance Criteria:**
- [ ] "Fill a Gap" section in For You tab
- [ ] Identifies contexts with <5 thoughts
- [ ] Suggests content to fill gaps
- [ ] Explains reasoning

---

## Epic 8: Microsoft Calendar (E8)

### E8-US1: Microsoft OAuth Connection
**As a** user
**I want** to connect my Microsoft/Outlook calendar
**So that** I can create moments from work meetings

**Acceptance Criteria:**
- [ ] "Connect Microsoft Calendar" button in settings
- [ ] OAuth flow with Microsoft Graph API
- [ ] Tokens stored securely
- [ ] Calendar list fetched after connection

---

### E8-US2: Microsoft Calendar Sync
**As a** user
**I want** my Microsoft calendar events synced
**So that** they appear in moment suggestions

**Acceptance Criteria:**
- [ ] Events fetched for next 7 days
- [ ] Same sync logic as Google Calendar
- [ ] Calendar selection in settings
- [ ] Auto-moment creation supported

---

## Epic 9: Focus Mode Settings (E9)

### E9-US1: Focus Mode Toggle
**As a** user
**I want** to enable/disable Focus Mode
**So that** I can choose between strict or relaxed constraints

**Acceptance Criteria:**
- [ ] Toggle in Settings → Preferences
- [ ] ON = 10 thought Active List limit
- [ ] OFF = configurable 10-25 limit
- [ ] Clear explanation of each mode

---

### E9-US2: Active List Limit Slider
**As a** user
**I want** to set my Active List limit
**So that** I can customize my focus level

**Acceptance Criteria:**
- [ ] Only shown when Focus Mode is OFF
- [ ] Slider from 10-25
- [ ] Current count shown
- [ ] Cannot set below current Active List count

---

### E9-US3: Check-in Toggle
**As a** user
**I want** to enable/disable daily check-ins
**So that** I can use the app without accountability pressure

**Acceptance Criteria:**
- [ ] Toggle in Settings → Preferences
- [ ] When OFF, Today's Focus card hidden
- [ ] Thoughts still tracked, just not surfaced

---

## Epic 10: Navigation Updates (E10)

### E10-US1: Mobile Bottom Navigation
**As a** user
**I want** an updated 4-tab navigation
**So that** I can access the main features

**Acceptance Criteria:**
- [ ] Tabs: Home, Library, Active, Discover
- [ ] Moments removed (floating button instead)
- [ ] Active tab highlighted
- [ ] Icons with labels

---

### E10-US2: Desktop Sidebar
**As a** user
**I want** an updated sidebar with all sections
**So that** I can navigate the expanded feature set

**Acceptance Criteria:**
- [ ] Sections: Home, Library (with sub-items), Active List, Moments, Discover, Trophy Case
- [ ] Settings at bottom
- [ ] Quick actions: AI Capture, New Moment
- [ ] Collapsible to icons only

---

### E10-US3: Home Quick Actions
**As a** user
**I want** quick action cards on the Home dashboard
**So that** I can quickly capture, create moments, or discover

**Acceptance Criteria:**
- [ ] Three cards: AI Capture, New Moment, Discover
- [ ] Each opens respective feature
- [ ] Consistent sizing and spacing
- [ ] Mobile-responsive (stack on small screens)

---

## Story Point Estimates

| Epic | Story Points | Complexity |
|------|--------------|------------|
| E1: Full-Text Search | 21 | High |
| E2: Database Foundation | 13 | Medium |
| E3: Unified Library | 21 | High |
| E4: AI Quick Capture | 21 | High |
| E5: Floating Moment | 8 | Low |
| E6: Source Entities | 13 | Medium |
| E7: Enhanced Discovery | 8 | Low |
| E8: Microsoft Calendar | 13 | Medium |
| E9: Focus Mode Settings | 5 | Low |
| E10: Navigation Updates | 8 | Low |
| **Total** | **131** | - |

---

## Dependencies

```
E2 (Database) ──────┬───> E1 (Search)
                    ├───> E3 (Library)
                    ├───> E6 (Sources)
                    └───> E9 (Focus Mode)

E4 (AI Capture) ────────> E6 (Sources)

E3 (Library) ───────────> E10 (Navigation)

E5 (Floating Button) ───> Independent

E7 (Discovery) ─────────> E2 (Database)

E8 (Microsoft) ─────────> E2 (Database)
```

**Recommended Order:**
1. E2 (Database Foundation) - unblocks everything
2. E1 (Full-Text Search) - high user value
3. E10 (Navigation Updates) - sets new IA
4. E3 (Unified Library) - major feature
5. E5 (Floating Moment Button) - quick win
6. E9 (Focus Mode Settings) - simple settings
7. E4 (AI Quick Capture) - complex but high value
8. E6 (Source Entities) - deepens data model
9. E7 (Enhanced Discovery) - builds on existing
10. E8 (Microsoft Calendar) - nice to have
