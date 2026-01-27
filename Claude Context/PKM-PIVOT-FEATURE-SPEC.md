# ThoughtFolio 2.0: PKM Pivot Feature Specification

> **Version:** 1.0
> **Date:** January 27, 2026
> **Status:** Proposed

---

## Executive Summary

ThoughtFolio 2.0 evolves from a "knowledge accountability partner" into a "PKM-Lite personal knowledge management system" while retaining its core differentiator: proactive surfacing of knowledge when you need it most.

**Tagline:** *"Your knowledge, working for you"*

---

## Table of Contents

1. [Core Features Retained](#1-core-features-retained)
2. [New Features](#2-new-features)
3. [Settings (Preserved + Enhanced)](#3-settings-preserved--enhanced)
4. [Information Architecture](#4-information-architecture)
5. [Full-Text Search](#5-full-text-search)
6. [Database Schema Changes](#6-database-schema-changes)
7. [UI Component Changes](#7-ui-component-changes)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Core Features Retained

These features form the DNA of ThoughtFolio and will be preserved:

| Feature | Description | Status |
|---------|-------------|--------|
| **Thoughts** | Atomic insights (max 200 chars) with contexts | Keep as-is |
| **Notes** | Long-form content with markdown support | Keep, enhance linking |
| **Moments** | On-demand situational matching via AI | Keep, add floating button |
| **Discover** | AI-powered content discovery | Keep, elevate to main nav |
| **Contexts** | Life areas for organization (8 defaults + custom) | Keep as-is |
| **AI Extraction** | Extract thoughts from text, URLs, YouTube | Keep, enhance with unified capture |
| **Active List** | Curated 10-thought focus list | Keep, make limit configurable |
| **Daily Check-in** | Proactive thought surfacing | Keep, make optional |
| **Trophy Case** | Graduated thoughts (5+ applications) | Keep as-is |
| **Calendar Integration** | Google Calendar for auto-moments | Keep, add Microsoft |

---

## 2. New Features

### 2.1 AI-Powered Quick Capture

**Problem:** Current capture is fragmented across manual entry, URL extraction, and note extraction. Users must know what type of content they have.

**Solution:** A unified "smart paste" modal that analyzes any input and intelligently processes it.

#### Behavior Matrix

| Input Type | AI Detection | Suggested Action |
|------------|--------------|------------------|
| URL | Fetches metadata, detects content type | Extract thoughts, save source, or summarize as note |
| Short text (<200 chars) | Checks if quote-like | Save as thought |
| Long text (>200 chars) | Analyzes for quotes + reflection | Split into thought(s) + note |
| Mixed content | Separates quote from commentary | Thought + linked note |
| Book/author reference | Detects book format | Create source entity |
| Bullet points | Detects list structure | Multiple thoughts with shared source |

#### Entry Points
- `✨` Quick Action on Home dashboard
- `(+)` button in global header
- `Cmd+N` / `Ctrl+N` keyboard shortcut

#### States
1. **Empty** — Text area with placeholder examples
2. **Analyzing** — Loading spinner while AI classifies
3. **Suggestions** — Checkboxes for each detected item (thought/note/source)
4. **Confirmation** — Summary before save

---

### 2.2 Floating Moment Button

**Problem:** Creating a moment requires navigating to the Moments page, adding friction.

**Solution:** A persistent floating action button visible on every screen.

#### States
1. **Collapsed** — Small `🎯` icon in bottom-right, semi-transparent
2. **Expanded** — Two options: "From Calendar" and "Describe It"
3. **Quick Entry** — Inline text input for moment description

#### Behaviors
- Hides during scroll, reappears when stopped
- Hidden on Moments page (already there)
- "From Calendar" shows calendar event picker
- "Describe It" opens inline text input

---

### 2.3 Unified Library

**Problem:** Thoughts, Notes, and Sources are separate features with no clear relationships.

**Solution:** A unified Library view with tabs and bi-directional linking.

#### Tabs
| Tab | Content |
|-----|---------|
| All | Unified search across everything |
| Thoughts | Atomic insights (current gems table) |
| Notes | Long-form content with markdown |
| Sources | Books, articles, podcasts (new entity) |
| Archive | Retired/removed content |

#### Key Additions
1. **Sources as first-class entities**
   - Name, author, type (book/article/podcast/video/course)
   - URL/ISBN when applicable
   - Linked thoughts and notes
   - Cover image (auto-fetched)

2. **Bi-directional linking**
   - Notes can embed thoughts inline
   - Thoughts reference source entity
   - Relationship graph on detail views

3. **Context chips filter**
   - Horizontal scrollable bar
   - Filters entire Library view
   - Multi-select supported

---

### 2.4 Enhanced Discovery

Building on existing Discovery feature with new capabilities:

| Tab | Purpose |
|-----|---------|
| For You | AI-curated based on knowledge profile |
| Explore | Browse by context, topic, or author |
| Saved | Reading list of discoveries to process later |

#### New Capabilities
- "Fill a Gap" — AI identifies contexts with few thoughts
- "More like this" — Content similar to a specific source
- Topic clusters — Group suggestions by theme
- Saved discoveries — Persist for later extraction

---

### 2.5 Microsoft Calendar Integration

Mirror existing Google Calendar integration:
- OAuth connection to Microsoft Outlook/Office 365
- Same auto-moment creation functionality
- Settings to select which calendars to sync
- Configurable event types for moment suggestions

---

### 2.6 Configurable Focus Mode

**Problem:** 10-thought Active List limit may feel restrictive for some users.

**Solution:** Settings toggle:
- **Focus Mode ON** — 10 thought limit (current)
- **Focus Mode OFF** — Configurable 10-25 limit

---

## 3. Settings (Preserved + Enhanced)

All existing settings are preserved. New settings are additive.

### 3.1 Existing Settings (PRESERVED)

#### Profile
| Setting | Type | Storage |
|---------|------|---------|
| Display Name | text | `profiles.name` |
| Email | text (readonly) | `profiles.email` |

#### Preferences
| Setting | Type | Storage |
|---------|------|---------|
| Timezone | dropdown | `profiles.timezone` |
| Daily Check-in Time | time picker | `profiles.daily_prompt_time` |
| Evening Check-in Time | time picker | `profiles.checkin_time` |

#### Themes (Client-side localStorage)
| Setting | Values | Storage Key |
|---------|--------|-------------|
| Color Theme | midnight, obsidian, amethyst, ocean, ruby, sunrise | `thoughtfolio-theme` |
| UI Style | glass, classic | `thoughtfolio-ui-theme` |
| Sidebar State | collapsed, expanded | `thoughtfolio-sidebar-collapsed` |

#### AI Features
| Setting | Type | Storage |
|---------|------|---------|
| Enable AI | boolean | `profiles.ai_consent_given` |
| Consent Date | timestamp | `profiles.ai_consent_date` |

#### Contexts
| Setting | Type | Storage |
|---------|------|---------|
| Custom Contexts | CRUD | `contexts` table |
| Context Colors | hex color | `contexts.color` |
| Context Icons | icon name | `contexts.icon` |
| Thought Limits | 5-100 | `contexts.thought_limit` |

#### Calendar Integration (Google)
| Setting | Type | Storage |
|---------|------|---------|
| Connected | boolean | `calendar_connections` |
| Auto-moment Enabled | boolean | `calendar_connections.auto_moment_enabled` |
| Lead Time | 15/30/60/120 min | `calendar_connections.lead_time_minutes` |
| Event Filter | all/meetings/custom | `calendar_connections.event_filter` |
| Custom Keywords | array | `calendar_connections.custom_keywords` |

### 3.2 New Settings (ADDED)

#### Focus Mode
| Setting | Type | Default | Storage |
|---------|------|---------|---------|
| Focus Mode Enabled | boolean | true | `profiles.focus_mode_enabled` |
| Active List Limit | 10-25 | 10 | `profiles.active_list_limit` |

#### Calendar Integration (Microsoft)
Same settings as Google, with `provider = 'microsoft'`

#### Daily Check-in
| Setting | Type | Default | Storage |
|---------|------|---------|---------|
| Check-in Enabled | boolean | true | `profiles.checkin_enabled` |

---

## 4. Information Architecture

### 4.1 Updated Navigation

#### Mobile (Bottom Tab Bar)
```
[🏠 Home]   [📚 Library]   [⚡ Active]   [🔮 Discover]
```

- **Moments removed** from nav → accessed via floating button
- **Discover elevated** to main navigation
- **Library unifies** thoughts, notes, sources

#### Desktop (Sidebar)
```
ThoughtFolio 2.0

🏠 Home
📚 Library
   └ All
   └ Thoughts
   └ Notes
   └ Sources
   └ Archive
⚡ Active List
🎯 Moments
🔮 Discover
🏆 Trophy Case

──────────────

⚙️ Settings

──────────────

[✨ AI Capture]
[🎯 New Moment]
```

### 4.2 Home Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  ☀️ Good morning, [Name]                      [🔍] [⚙️]    │
├─────────────────────────────────────────────────────────────┤
│  TODAY'S FOCUS (Daily Check-in Card)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "Quote or thought content here..."                  │   │
│  │  📖 Source • Context                                 │   │
│  │  [Mark as Applied ✓]         [Skip for Today →]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  CONTEXT CHIPS                                              │
│  [All ●] [Work] [Strategy] [Relationships] [Health] [+]    │
│                                                             │
│  QUICK ACTIONS                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ ✨ Capture  │ │ 🎯 Moment   │ │ 🔮 Discover │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  UPCOMING MOMENTS                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎯 Q1 Planning • Today 2 PM • 3 thoughts ready     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  RECENT ACTIVITY (filtered by context)                      │
│  [💭 Thought] [📝 Note] [📖 Source] [🔮 Discovery]         │
│                                                             │
│                                              [🎯 Floating]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Full-Text Search

### 5.1 Overview

Full-text search enables users to find any content across their entire knowledge base using natural language queries.

### 5.2 Searchable Content

| Entity | Searchable Fields | Weight |
|--------|-------------------|--------|
| Thoughts | content, source | A (highest) |
| Notes | title, content | A |
| Sources | name, author | B |
| Contexts | name | C |
| Moments | description | C |
| Discoveries | title, summary | D (lowest) |

### 5.3 Search Features

| Feature | Description |
|---------|-------------|
| **Instant Search** | Results appear as you type (debounced 300ms) |
| **Fuzzy Matching** | Handles typos and partial matches |
| **Semantic Search** | AI-enhanced relevance ranking (optional) |
| **Filters** | By type (thought/note/source), context, date range |
| **Highlighting** | Search terms highlighted in results |
| **Keyboard Navigation** | Arrow keys to navigate, Enter to select |
| **Global Shortcut** | `Cmd+K` / `Ctrl+K` opens search modal |

### 5.4 Implementation Strategy

**Phase 1: PostgreSQL Full-Text Search**
- Use `tsvector` columns for searchable text
- Create GIN indexes for fast querying
- `ts_rank` for relevance scoring
- Triggers to keep search vectors updated

**Phase 2: Enhanced Search (Optional)**
- Gemini embeddings for semantic similarity
- Vector storage in `pgvector` extension
- Hybrid scoring (FTS + semantic)

### 5.5 Search UI

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search your knowledge...                        ⌘K     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FILTERS                                                    │
│  [All ●] [Thoughts] [Notes] [Sources]                      │
│                                                             │
│  RESULTS                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💭 THOUGHT                                          │   │
│  │  "You don't rise to the level of your **goals**..."  │   │
│  │  📖 Atomic Habits • Focus                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📝 NOTE                                             │   │
│  │  Meeting Notes: **Goal** Setting Workshop            │   │
│  │  Updated 2 days ago                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ↑↓ to navigate • Enter to open • Esc to close            │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Database Schema Changes

### 6.1 New Tables

#### `sources` — First-class source entities
```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  author TEXT,
  type TEXT CHECK (type IN ('book', 'article', 'podcast', 'video', 'course', 'other')),
  url TEXT,
  isbn TEXT,
  cover_image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `note_thought_links` — Bi-directional linking
```sql
CREATE TABLE note_thought_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  gem_id UUID NOT NULL REFERENCES gems(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, gem_id)
);
```

### 6.2 Table Modifications

#### `profiles` — New settings columns
```sql
ALTER TABLE profiles ADD COLUMN focus_mode_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN active_list_limit INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN checkin_enabled BOOLEAN DEFAULT true;
```

#### `calendar_connections` — Microsoft support
```sql
ALTER TABLE calendar_connections
ADD COLUMN provider TEXT DEFAULT 'google' CHECK (provider IN ('google', 'microsoft'));
```

#### `discoveries` — Saved reading list
```sql
ALTER TABLE discoveries ADD COLUMN saved_at TIMESTAMPTZ;
```

#### `gems` — Source entity reference + search vector
```sql
ALTER TABLE gems ADD COLUMN source_id UUID REFERENCES sources(id);
ALTER TABLE gems ADD COLUMN search_vector tsvector;
```

#### `notes` — Search vector
```sql
ALTER TABLE notes ADD COLUMN search_vector tsvector;
```

### 6.3 Full-Text Search Infrastructure

```sql
-- Search vectors for gems (thoughts)
CREATE INDEX gems_search_idx ON gems USING GIN (search_vector);

-- Search vectors for notes
CREATE INDEX notes_search_idx ON notes USING GIN (search_vector);

-- Search vectors for sources
ALTER TABLE sources ADD COLUMN search_vector tsvector;
CREATE INDEX sources_search_idx ON sources USING GIN (search_vector);

-- Unified search view
CREATE VIEW unified_search AS
SELECT
  id, 'thought' as type, content as text, source as secondary_text,
  user_id, context_id, search_vector, created_at
FROM gems WHERE status != 'retired'
UNION ALL
SELECT
  id, 'note' as type, title as text, content as secondary_text,
  user_id, NULL as context_id, search_vector, created_at
FROM notes
UNION ALL
SELECT
  id, 'source' as type, name as text, author as secondary_text,
  user_id, NULL as context_id, search_vector, created_at
FROM sources;
```

---

## 7. UI Component Changes

### 7.1 New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AICaptureModal` | Unified smart capture | `/components/capture/` |
| `FloatingMomentButton` | Persistent FAB | `/components/moments/` |
| `LibraryLayout` | Unified library with tabs | `/app/library/` |
| `SourceCard` | Display source entity | `/components/library/` |
| `ThoughtEmbedPicker` | Link thoughts in notes | `/components/notes/` |
| `ContextChipsFilter` | Horizontal filter bar | `/components/ui/` |
| `DiscoverTabs` | For You/Explore/Saved | `/components/discover/` |
| `CalendarProviderPicker` | Google + Microsoft | `/components/settings/` |
| `GlobalSearch` | Cmd+K search modal | `/components/search/` |
| `SearchResults` | Search result cards | `/components/search/` |

### 7.2 Modified Components

| Component | Changes |
|-----------|---------|
| `DailyThoughtCard` | Add reflection input field |
| `DiscoverCard` | Support tabbed interface |
| `MomentFAB` | Replace with FloatingMomentButton |
| `Navigation` | Update to 4-tab mobile nav |
| `ThoughtDetail` | Show linked notes and source |
| `NoteEditor` | Add thought embed picker |
| `SettingsPage` | Add Focus Mode, Microsoft Calendar sections |

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations (sources, links, settings, search vectors)
- [ ] Full-text search infrastructure
- [ ] Source entity service + CRUD
- [ ] Note-thought linking service
- [ ] Focus mode settings UI

### Phase 2: Search & Library (Week 3-4)
- [ ] Global search component (Cmd+K)
- [ ] Search API with FTS
- [ ] Unified Library page with tabs
- [ ] Context chips filter component
- [ ] Updated navigation

### Phase 3: AI Capture (Week 5-6)
- [ ] AI Capture modal with content detection
- [ ] Smart splitting logic
- [ ] Auto-source creation from URLs
- [ ] Batch creation with relationships

### Phase 4: Enhanced Discovery (Week 7)
- [ ] Tabbed Discover interface
- [ ] Saved discoveries reading list
- [ ] "Fill a Gap" recommendations
- [ ] Topic exploration

### Phase 5: Calendar & Moments (Week 8)
- [ ] Microsoft Calendar OAuth
- [ ] Floating Moment Button
- [ ] Calendar picker in moment creation

### Phase 6: Polish & Launch (Week 9-10)
- [ ] Data migration scripts
- [ ] Onboarding updates
- [ ] Performance optimization
- [ ] Documentation updates

---

## Appendix A: Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thought character limit | Keep 200 | Atomic discipline |
| Source migration | Optional | Create on demand |
| Note-thought linking | Visual picker | More intuitive than syntax |
| Focus Mode default | ON | Preserve core value |
| Search implementation | PostgreSQL FTS first | Simpler, cheaper |

---

## Appendix B: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feature creep | Lose focus identity | Strict phase gates |
| Migration complexity | Data issues | Backward-compatible schema |
| AI costs increase | Margin pressure | Smart caching, rate limits |
| Navigation confusion | User churn | A/B test with existing users |

---

## Appendix C: Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| DAU/MAU | +20% |
| Thoughts per user | +50% |
| Moments created | +100% |
| Discovery saves | +30% |
| Search usage | 40% of users weekly |
| Notes created | +200% |
