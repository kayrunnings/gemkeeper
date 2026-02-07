# ThoughtFolio Architecture

## 1. System Overview

ThoughtFolio is a Next.js application deployed on Vercel, using Supabase for authentication, database, and real-time features. The app integrates with Google Gemini for AI-powered thought extraction/matching and Google Calendar for contextual scheduling.
```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js App)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages/    │  │    API      │  │      Server            │  │
│  │   Routes    │  │   Routes    │  │      Components        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│   Supabase   │    │   Google     │    │    Google            │
│   (Auth +    │    │   Gemini     │    │    Calendar          │
│   Database)  │    │   API        │    │    API               │
└──────────────┘    └──────────────┘    └──────────────────────┘
```

---

## 2. Project Structure
```
gemkeeper/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── ai/extract/           # AI extraction endpoint
│   │   ├── capture/              # AI Quick Capture (ThoughtFolio 2.0)
│   │   │   ├── analyze/          # Analyze content
│   │   │   └── save/             # Save selected items
│   │   ├── calendar/             # Calendar endpoints
│   │   │   └── events/           # Upcoming events (ThoughtFolio 2.0)
│   │   ├── contexts/             # Context CRUD endpoints
│   │   ├── discover/             # Discovery endpoints
│   │   │   ├── route.ts          # Generate discoveries
│   │   │   ├── save/             # Save discovery as thought
│   │   │   ├── skip/             # Skip discovery
│   │   │   └── usage/            # Get usage limits
│   │   ├── extract/url/          # URL extraction endpoint
│   │   ├── gems/bulk/            # Bulk thought creation
│   │   ├── schedules/            # Thought schedule endpoints
│   │   │   └── parse/            # NLP schedule parsing
│   │   ├── moments/              # Moment endpoints
│   │   │   ├── match/            # AI thought matching
│   │   │   └── learn/            # Epic 14: Learning endpoints
│   │   │       ├── helpful/      # Record helpful thought
│   │   │       └── not-helpful/  # Record not-helpful thought
│   │   ├── auth/                 # OAuth callbacks
│   │   │   └── google-calendar/  # Google Calendar OAuth
│   │   └── cron/                 # Cron job routes (Phase 2)
│   │       └── calendar-sync/    # Server-side calendar sync (every 10 min)
│   ├── auth/                     # Auth actions
│   ├── checkin/                  # Daily check-in page
│   ├── daily/                    # Redirects to /checkin (legacy)
│   ├── home/                     # Main dashboard (primary)
│   ├── dashboard/                # Dashboard (legacy alias)
│   ├── thoughts/                 # Thought management (alias: gems/)
│   │   └── [id]/                 # Thought detail page
│   ├── notes/                    # Notes feature
│   │   └── actions.ts            # Note CRUD operations
│   ├── folders/                  # Folder organization for notes
│   │   └── actions.ts            # Folder management
│   ├── retired/                  # Retired thoughts page
│   ├── moments/                  # Moments feature
│   │   ├── page.tsx              # Moments history (filterable by source)
│   │   ├── MomentsHistoryClient.tsx  # Client component with filters
│   │   └── [id]/prepare/         # Moment prep card
│   ├── login/                    # Authentication
│   ├── onboarding/               # First-time setup
│   ├── settings/                 # User preferences + contexts
│   ├── trophy-case/              # Graduated thoughts (ThoughtBank)
│   ├── thought-bank/             # Alternative view for graduated thoughts
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components (includes slider.tsx)
│   ├── contexts/                 # Context management components
│   ├── discover/                 # Discovery components
│   │   ├── DiscoverCard.tsx      # Dashboard entry point
│   │   ├── ContextChip.tsx       # Context selector chip
│   │   ├── DiscoveryGrid.tsx     # Grid of discoveries (8 items) with refresh
│   │   ├── DiscoveryCard.tsx     # Individual discovery card
│   │   ├── DiscoveryDetail.tsx   # Expanded discovery view
│   │   └── SaveDiscoveryModal.tsx # Save flow modal
│   ├── schedules/                # Schedule components
│   ├── moments/                  # Moment components
│   │   ├── MomentFAB.tsx         # Floating action button (Cmd+M shortcut)
│   │   ├── MomentEntryModal.tsx  # Create moment modal
│   │   ├── PrepCard.tsx          # Matched thoughts display
│   │   ├── RecentMoments.tsx     # Dashboard widget
│   │   ├── MomentBanner.tsx      # Moment header banner
│   │   ├── FloatingMomentButton.tsx  # Fixed FAB (ThoughtFolio 2.0)
│   │   ├── FloatingButtonMenu.tsx    # Menu options
│   │   ├── QuickMomentEntry.tsx      # Inline moment entry
│   │   ├── CalendarEventPicker.tsx   # Event selector
│   │   └── ContextEnrichmentPrompt.tsx  # Epic 14: Context enrichment UI with chip search
│   ├── capture/                  # AI Capture components (ThoughtFolio 2.0)
│   │   ├── AICaptureModal.tsx    # Main capture modal (Cmd+N)
│   │   ├── CaptureEmptyState.tsx # Initial state
│   │   ├── CaptureAnalyzing.tsx  # Loading state
│   │   ├── CaptureSuggestions.tsx # Results display
│   │   └── CaptureItemCard.tsx   # Item card with selection
│   ├── notes/                    # Notes components
│   │   ├── rich-text-editor.tsx  # TipTap rich text editor with AI assist
│   │   └── enhanced-note-editor.tsx # Full note editor modal with attachments/links
│   ├── note-editor.tsx           # Basic note editor (markdown, legacy)
│   ├── note-card.tsx             # Note display card
│   ├── notes-list.tsx            # Notes list view
│   ├── search/                   # Search components (ThoughtFolio 2.0)
│   │   ├── GlobalSearch.tsx      # Cmd+K search modal
│   │   ├── SearchResults.tsx     # Grouped search results
│   │   ├── SearchResultCard.tsx  # Individual result card
│   │   └── SearchFilters.tsx     # Type filter buttons
│   ├── library/                  # Library components (ThoughtFolio 2.0)
│   │   ├── LibraryTabs.tsx       # Tab navigation
│   │   ├── LibraryAllTab.tsx     # Mixed content feed
│   │   ├── LibraryThoughtsTab.tsx # Full-featured thoughts tab with filters, Add/Extract
│   │   ├── LibraryNotesTab.tsx   # Notes list with folders
│   │   ├── LibrarySourcesTab.tsx # Sources grid with status filters
│   │   ├── LibraryArchiveTab.tsx # Archived thoughts
│   │   └── SourceCard.tsx        # Source display card
│   ├── sources/                  # Source components (Epic 13)
│   │   ├── AddSourceModal.tsx    # Add source modal with type-first UX
│   │   └── SourceSelector.tsx    # Single/multi source selector with quick-create
│   ├── calendar/                 # Calendar components (Phase 2)
│   │   └── SyncHealthIndicator.tsx  # Sync status dot + label
│   ├── layout/                   # Layout components
│   │   └── BottomNavigation.tsx  # Mobile bottom tab bar
│   ├── extract-from-note-modal.tsx  # Extract thoughts from notes
│   ├── settings/                 # Settings components
│   └── ...                       # Other components
├── lib/                          # Utilities and services
│   ├── moments/                  # Epic 14: Moment Intelligence
│   │   ├── title-analysis.ts     # Generic title detection, event type classification, chip search
│   │   └── learning.ts           # Learning service for pattern associations (threshold: 1)
│   ├── ai/                       # AI/Gemini integration
│   │   ├── prompts.ts            # Centralized AI prompt templates (v2.1.0)
│   │   ├── gemini.ts             # Gemini API logic
│   │   ├── rate-limit.ts         # Rate limiting & caching
│   │   ├── content-detector.ts   # Content type detection (ThoughtFolio 2.0)
│   │   └── content-splitter.ts   # Quote/reflection splitting (ThoughtFolio 2.0)
│   ├── supabase/                 # Database clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── admin.ts              # Admin client (service role, for cron jobs)
│   ├── types/                    # Type definitions
│   │   ├── thought.ts            # Thought types
│   │   ├── context.ts            # Context types
│   │   ├── discovery.ts          # Discovery types
│   │   ├── source.ts             # Source entity types (ThoughtFolio 2.0)
│   │   ├── note-link.ts          # Note-thought link types (ThoughtFolio 2.0)
│   │   ├── search.ts             # Search types (ThoughtFolio 2.0)
│   │   ├── capture.ts            # AI Capture types (ThoughtFolio 2.0)
│   │   ├── learning.ts           # Epic 14: Learning types (pattern associations)
│   │   └── gem.ts                # Legacy gem types (backward compat)
│   ├── hooks/                    # React hooks
│   │   ├── useGlobalShortcuts.ts # Global keyboard shortcuts (Cmd+K, Cmd+N)
│   │   ├── useScrollVisibility.ts # Scroll-based visibility (ThoughtFolio 2.0)
│   │   └── useCalendarAutoSync.ts # Background calendar auto-sync
│   ├── contexts.ts               # Context service functions
│   ├── thoughts.ts               # Thought service functions
│   ├── discovery.ts              # Discovery service functions
│   ├── schedules.ts              # Schedule service functions
│   ├── moments.ts                # Moment service functions
│   ├── calendar.ts               # Calendar service functions
│   ├── sources.ts                # Source CRUD service (ThoughtFolio 2.0)
│   ├── note-sources.ts           # Note-source linking service (Epic 13)
│   ├── source-contexts.ts        # Source-context linking service (Epic 13)
│   ├── note-links.ts             # Note-thought linking service (ThoughtFolio 2.0)
│   ├── search.ts                 # Full-text search service (ThoughtFolio 2.0)
│   ├── url-extractor.ts          # URL content extraction
│   ├── matching.ts               # AI thought matching
│   └── utils.ts                  # Utility helpers
├── types/                        # Additional type definitions
│   ├── moments.ts                # Moment types (MomentSource, MomentStatus, etc.)
│   ├── matching.ts               # AI matching types and constants
│   ├── schedules.ts              # Schedule types
│   └── calendar.ts               # Calendar integration types
├── __tests__/                    # Test files
├── public/                       # Static assets
├── middleware.ts                 # Auth middleware
└── tasks/                        # Claude Code task files
```

---

## 3. Tech Stack Details

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.4 |
| Language | TypeScript | 5.x |
| Runtime | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui + Radix UI | Latest |
| Rich Text Editor | TipTap (@tiptap/react, extension-table, extension-text-align, extension-text-style) | 2.x |
| Emoji Picker | emoji-picker-react | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth (@supabase/ssr) | 0.8.0 |
| AI/ML | Google Gemini API | 2.0 Flash |
| Calendar | Google Calendar API (googleapis) | v3 |
| URL Parsing | Mozilla Readability | 0.6.0 |
| YouTube | youtube-transcript | 1.2.1 |
| Schedule Parsing | cron-parser | 5.5.0 |
| Testing | Jest | 30.2.0 |
| Hosting | Vercel | Latest |

---

## 4. Database Schema

### Entity Relationship Diagram
```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│  profiles   │       │  contexts   │       │      gems       │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)         │
│ email       │  │    │ user_id(FK) │◄─┤    │ user_id (FK)    │◄──┐
│ name        │  │    │ name        │  │    │ context_id (FK) │◄──┤
│ timezone    │  └───►│ slug        │  │    │ content         │   │
│ ...         │       │ color       │  │    │ source          │   │
└─────────────┘       │ is_default  │  │    │ is_on_active_   │   │
                      │ thought_    │  │    │   list          │   │
                      │   limit     │  │    │ status          │   │
                      └─────────────┘  │    │ ...             │   │
                                       │    └─────────────────┘   │
                                       │                          │
┌─────────────────┐                    │    ┌─────────────────┐   │
│  gem_schedules  │                    │    │    moments      │   │
├─────────────────┤                    │    ├─────────────────┤   │
│ id (PK)         │                    │    │ id (PK)         │   │
│ gem_id (FK)     │◄───────────────────┤    │ user_id (FK)    │◄──┤
│ user_id (FK)    │◄───────────────────┘    │ description     │   │
│ cron_expression │                         │ source          │   │
│ ...             │                         │ ...             │   │
└─────────────────┘                         └─────────────────┘   │
                                                                  │
┌─────────────────┐       ┌─────────────────────┐                 │
│  moment_gems    │       │ calendar_connections│                 │
├─────────────────┤       ├─────────────────────┤                 │
│ id (PK)         │       │ id (PK)             │                 │
│ moment_id (FK)  │       │ user_id (FK)        │◄────────────────┤
│ gem_id (FK)     │       │ provider            │                 │
│ relevance_score │       │ access_token        │                 │
│ ...             │       │ ...                 │                 │
└─────────────────┘       └─────────────────────┘                 │
                                                                  │
┌─────────────────┐       ┌─────────────────────┐                 │
│  discoveries    │       │  discovery_usage    │                 │
├─────────────────┤       ├─────────────────────┤                 │
│ id (PK)         │       │ id (PK)             │                 │
│ user_id (FK)    │◄──────│ user_id (FK)        │◄────────────────┘
│ session_type    │       │ usage_date          │
│ thought_content │       │ curated_count       │
│ source_url      │       │ directed_count      │
│ status          │       └─────────────────────┘
│ ...             │
└─────────────────┘
```

### Core Tables

#### `profiles`
User preferences and settings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK, FK → auth.users |
| email | TEXT | User email |
| name | TEXT | Display name |
| timezone | TEXT | e.g., "America/Toronto" |
| daily_prompt_time | TIME | Morning prompt time |
| checkin_time | TIME | Evening check-in time |
| calendar_connected | BOOLEAN | Calendar integration status |
| onboarding_completed | BOOLEAN | Completed onboarding |
| ai_consent_given | BOOLEAN | AI feature consent |
| focus_mode_enabled | BOOLEAN | Enable expanded Active List limit |
| active_list_limit | INTEGER | Active List limit (10-25, default 10) |
| checkin_enabled | BOOLEAN | Show daily check-in card (default true) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `contexts`
User-defined life areas for organizing thoughts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| name | VARCHAR(50) | Context display name |
| slug | VARCHAR(50) | URL-safe identifier |
| color | VARCHAR(7) | Hex color for UI |
| icon | VARCHAR(50) | Optional emoji/icon |
| is_default | BOOLEAN | True for system defaults |
| thought_limit | INTEGER | Max thoughts (default: 20, range: 5-100) |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Default contexts:** Meetings, Feedback, Conflict, Focus, Health, Relationships, Parenting, Other

#### `gems` (Thoughts)
Core feature table for knowledge/insights. Note: Database table is named `gems` for historical reasons, UI shows "thoughts".

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| context_id | UUID | FK → contexts |
| source_id | UUID | FK → sources (Epic 13) |
| content | TEXT | Thought text (max 200 chars) |
| source | TEXT | Book/podcast/article name (legacy, use source_id) |
| source_url | TEXT | URL to source (legacy, use source_id) |
| context_tag | ENUM | Legacy field (deprecated) |
| custom_context | TEXT | Legacy field (deprecated) |
| is_on_active_list | BOOLEAN | On Active List for Daily Check-in (max 10) |
| status | ENUM | active/passive/retired/graduated |
| application_count | INTEGER | Times applied |
| skip_count | INTEGER | Times skipped |
| last_surfaced_at | TIMESTAMPTZ | Last shown to user |
| last_applied_at | TIMESTAMPTZ | Last applied |
| retired_at | TIMESTAMPTZ | When retired |
| graduated_at | TIMESTAMPTZ | When graduated |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Status Values:**

| Status | Description | Visible In |
|--------|-------------|------------|
| `active` | Available thought | Thoughts page |
| `passive` | Available but dormant | Thoughts page (filtered) |
| `retired` | Archived, kept for historical record | Retired page |
| `graduated` | Applied 5+ times, mastered | ThoughtBank |

**Active List:** Controlled by `is_on_active_list` boolean. Maximum 10 thoughts with `is_on_active_list = true`. Limit is enforced in application code via `toggleActiveList()` function in `lib/thoughts.ts`. Only thoughts with `status IN ('active', 'passive')` can be on the Active List. New thoughts are created with `is_on_active_list = false` by default (Passive), so there is no limit on total thoughts — only on how many can be on the Active List at once.

**Deletion:** Hard delete (row removed from database). No soft delete.

**Important:** Status and Active List are orthogonal:
- `status` = lifecycle state (where is this thought in its journey?)
- `is_on_active_list` = engagement choice (am I focusing on this now?)

A thought can be `status = 'active'` but `is_on_active_list = false` (available but not in daily rotation).

#### `gem_schedules`
Individual check-in schedules per thought.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gem_id | UUID | FK → gems |
| user_id | UUID | FK → auth.users |
| cron_expression | VARCHAR(100) | Cron format |
| human_readable | VARCHAR(255) | Display text |
| timezone | VARCHAR(50) | Schedule timezone |
| schedule_type | VARCHAR(20) | daily/weekly/monthly/custom |
| days_of_week | INTEGER[] | [0-6] for days |
| time_of_day | TIME | Check-in time |
| is_active | BOOLEAN | Toggle on/off |
| next_trigger_at | TIMESTAMPTZ | Pre-computed next trigger |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `moments`
User-created situations for thought matching.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| description | TEXT | Situation description |
| source | VARCHAR(20) | manual/calendar |
| calendar_event_id | VARCHAR(255) | External event ID |
| calendar_event_title | VARCHAR(500) | Event title |
| calendar_event_start | TIMESTAMPTZ | Event start time |
| gems_matched_count | INTEGER | Number of thoughts matched |
| ai_processing_time_ms | INTEGER | AI matching duration |
| status | VARCHAR(20) | active/completed/dismissed |
| user_context | TEXT | Additional context provided by user (Epic 14) |
| detected_event_type | TEXT | Auto-detected event type (Epic 14) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Event Types (Epic 14):** 1:1, team_meeting, interview, presentation, review, planning, social, external, unknown

#### `moment_gems`
Junction table linking moments to matched thoughts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| moment_id | UUID | FK → moments |
| gem_id | UUID | FK → gems |
| user_id | UUID | FK → auth.users |
| relevance_score | FLOAT | 0.0-1.0 AI score |
| relevance_reason | TEXT | AI explanation |
| was_helpful | BOOLEAN | User feedback |
| was_reviewed | BOOLEAN | User marked "got it" |
| created_at | TIMESTAMPTZ | |

#### `moment_learnings` (Epic 14)
Pattern-based learning for moment matching. Records which thoughts were helpful for specific patterns.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| pattern_type | TEXT | event_type, keyword, recurring, attendee |
| pattern_key | TEXT | Pattern identifier (e.g., "1:1", "event:abc123") |
| gem_id | UUID | FK → gems |
| helpful_count | INTEGER | Times marked helpful (default 1) |
| not_helpful_count | INTEGER | Times marked not helpful (default 0) |
| last_helpful_at | TIMESTAMPTZ | Last helpful timestamp |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Pattern Types:**
- `event_type`: Event classification (1:1, team_meeting, etc.)
- `keyword`: Keywords from description/user context
- `recurring`: Recurring calendar events (uses base event ID)
- `attendee`: Meeting attendees (future use)

**Learning Thresholds:**
- Minimum 3 helpful marks before suggesting
- Minimum 70% confidence (helpful / total)

**Indexes:** `idx_moment_learnings_lookup` (user_id, pattern_type, pattern_key), `idx_moment_learnings_gem` (gem_id)

#### `calendar_connections`
OAuth tokens for connected calendars.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| provider | VARCHAR(20) | 'google' or 'microsoft' |
| email | VARCHAR(255) | Calendar account email |
| access_token | TEXT | OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| token_expires_at | TIMESTAMPTZ | Token expiration |
| is_active | BOOLEAN | Connection active |
| auto_moment_enabled | BOOLEAN | Auto-create moments |
| lead_time_minutes | INTEGER | Minutes before event (15/30/60/120) |
| event_filter | TEXT | 'all', 'meetings', or 'custom' |
| custom_keywords | TEXT[] | Keywords for custom filter |
| sync_frequency_minutes | INTEGER | Auto-sync interval (0=manual, 5/15/30/60) |
| last_sync_at | TIMESTAMPTZ | Last sync time |
| sync_error | TEXT | Last sync error message |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Note:** Microsoft Calendar integration is prepared but pending Azure AD credentials configuration.

#### `calendar_events_cache`
Cached calendar events for moment generation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| connection_id | UUID | FK → calendar_connections |
| external_event_id | VARCHAR(255) | Calendar event ID |
| title | VARCHAR(500) | Event title |
| description | TEXT | Event description |
| start_time | TIMESTAMPTZ | Event start |
| end_time | TIMESTAMPTZ | Event end |
| moment_created | BOOLEAN | Moment generated |
| moment_id | UUID | FK → moments |
| created_at | TIMESTAMPTZ | |

#### `ai_usage`
Daily rate limiting for AI features.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| usage_date | DATE | Date of usage |
| extraction_count | INTEGER | Extractions today (max 10) |
| tokens_used | INTEGER | Tokens today (max 50,000) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `ai_extractions`
Cached extraction results for deduplication.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| input_content | TEXT | First 10,000 chars |
| input_hash | VARCHAR(64) | SHA-256 for dedup |
| source | TEXT | User attribution |
| extracted_gems | JSONB | Array of extracted thoughts |
| tokens_used | INTEGER | Tokens consumed |
| created_at | TIMESTAMPTZ | |

#### `discoveries`
AI-generated discovery suggestions for users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| session_type | VARCHAR(20) | 'curated' or 'directed' |
| query | TEXT | User's search query (null for curated) |
| context_id | UUID | FK → contexts (null for directed) |
| thought_content | TEXT | Extracted insight |
| source_title | TEXT | Article/video title |
| source_url | TEXT | URL to source |
| source_type | VARCHAR(20) | article/video/research/blog |
| article_summary | TEXT | 2-3 sentence summary |
| relevance_reason | TEXT | Why relevant to user |
| content_type | VARCHAR(20) | trending/evergreen |
| suggested_context_id | UUID | FK → contexts |
| status | VARCHAR(20) | pending/saved/skipped |
| saved_gem_id | UUID | FK → gems (if saved) |
| saved_at | TIMESTAMPTZ | When bookmarked for later |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `discovery_usage`
Daily rate limiting for discovery feature.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| usage_date | DATE | Date of usage |
| curated_count | INTEGER | Curated sessions today (max 1) |
| directed_count | INTEGER | Directed sessions today (max 1) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `discovery_skips`
Track skipped content to avoid re-suggesting.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| content_hash | VARCHAR(64) | SHA-256 of source_url |
| source_url | TEXT | Original URL |
| skipped_at | TIMESTAMPTZ | |

#### `notes`
Standalone long-form notes, separate from thoughts. Notes can contain markdown content and be organized into folders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| title | TEXT | Note title |
| content | TEXT | Markdown content (no length limit) |
| folder_id | UUID | FK → folders (optional) |
| is_draft | BOOLEAN | Whether note is a draft (default: false) |
| search_vector | TSVECTOR | Full-text search index |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Note:** Notes are a separate feature from "thought reflections" (which are attached to individual thoughts). Notes are standalone documents that can be organized into folders and have thoughts extracted from them.

**Drafts:** When `is_draft` is true, the note is a work-in-progress that auto-saves to the database. Drafts appear in a dedicated "Drafts" section in the library sidebar and can be "published" (converted to regular notes) when ready. Drafts sync across devices since they're stored in the database.

#### `sources` (ThoughtFolio 2.0)
First-class source entities representing books, articles, podcasts, etc.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| name | TEXT | Source title |
| author | TEXT | Author/creator name |
| type | TEXT | book/article/podcast/video/course/other |
| status | TEXT | want_to_read/reading/completed/archived (Epic 13) |
| url | TEXT | Source URL if applicable |
| isbn | TEXT | ISBN for books |
| cover_image_url | TEXT | Cover image URL |
| metadata | JSONB | Additional metadata |
| search_vector | TSVECTOR | Full-text search index |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Status Values (Epic 13):**
- `want_to_read` - User wants to consume this source
- `reading` - Currently being consumed (default)
- `completed` - Finished consuming
- `archived` - No longer relevant

#### `note_sources` (Epic 13)
Many-to-many relationship between notes and sources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| note_id | UUID | FK → notes (CASCADE) |
| source_id | UUID | FK → sources (CASCADE) |
| created_at | TIMESTAMPTZ | |

**Constraints:** UNIQUE(note_id, source_id)

#### `source_contexts` (Epic 13)
Many-to-many relationship between sources and contexts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_id | UUID | FK → sources (CASCADE) |
| context_id | UUID | FK → contexts (CASCADE) |
| is_primary | BOOLEAN | Primary context for this source |
| created_at | TIMESTAMPTZ | |

**Constraints:** UNIQUE(source_id, context_id)

#### `note_thought_links` (ThoughtFolio 2.0)
Bi-directional linking between notes and thoughts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| note_id | UUID | FK → notes |
| gem_id | UUID | FK → gems |
| position | INTEGER | Order position in note |
| created_at | TIMESTAMPTZ | |

**Constraints:** UNIQUE(note_id, gem_id), CASCADE delete on both FKs.

---

## 5. API Routes

### Context Management

#### GET `/api/contexts`
List user's contexts with thought counts.

**Response:**
```typescript
{
  contexts: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
    is_default: boolean;
    thought_limit: number;
    thought_count: number; // Only counts status IN ('active', 'passive')
  }>;
}
```

#### POST `/api/contexts`
Create a new custom context.

**Request:**
```typescript
{
  name: string;
  color?: string;
  thought_limit?: number;
}
```

#### PUT `/api/contexts/[id]`
Update context properties.

#### GET `/api/contexts/[id]`
Get a single context by ID.

**Response:**
```typescript
{
  id: string;
  name: string;
  slug: string;
  color: string;
  is_default: boolean;
  thought_limit: number;
}
```

#### DELETE `/api/contexts/[id]`
Delete custom context (thoughts move to "Other").

### Schedule Parsing

#### POST `/api/schedules/parse`
Parse natural language schedule text using NLP.

**Request:**
```typescript
{
  text: string; // e.g., "every Monday at 9am"
}
```

**Response:**
```typescript
{
  cron_expression: string;
  human_readable: string;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week?: number[];
  time_of_day?: string;
}
```

### Thought Extraction

#### POST `/api/ai/extract`
Extract thoughts from text content.

**Request:**
```typescript
{
  content?: string;
  source?: string;
  media?: Array<{ mimeType: string; data: string }>;
}
```

**Response:**
```typescript
{
  thoughts: Array<{
    content: string;
    context_tag: string;
    suggested_context_id?: string;
    source_quote?: string;
  }>;
  cached: boolean;
  usage: UsageStatus;
}
```

#### POST `/api/ai/write-assist`
AI-powered writing assistance for the rich text editor.

**Request:**
```typescript
{
  prompt: string;  // Action: "improve", "simplify", "expand", "summarize", "fix-grammar", "continue"
  text: string;    // Selected text or full content to process
}
```

**Response:**
```typescript
{
  result: string;  // AI-generated improved text
}
```

#### POST `/api/extract/url`
Extract thoughts from URL (article or YouTube).

**Request:**
```typescript
{
  url: string;
  source?: string;
}
```

**Response:**
```typescript
{
  thoughts: Array<ExtractedThought>;
  source_title: string;
  source_type: 'article' | 'youtube';
  suggested_context_id?: string;
  usage: UsageStatus;
}
```

### Thought Management

**Note:** Most thought CRUD operations use the service layer pattern via functions in `lib/thoughts.ts` rather than REST endpoints. Components import and call these functions directly:
- `updateThought()` - Update thought properties
- `deleteThought()` - Hard delete a thought
- `retireThought()` - Set status to retired
- `restoreThought()` - Restore from retired status
- `graduateThought()` - Graduate a thought
- `toggleActiveList()` - Toggle Active List membership

#### POST `/api/gems/bulk`
Create multiple thoughts at once (legacy endpoint).

**Request:**
```typescript
{
  gems: Array<{
    content: string;
    context_id: string;
    source?: string;
    source_url?: string;
    is_on_active_list?: boolean; // Defaults to false
    status?: string; // Defaults to 'active'
  }>;
}
```

#### POST `/api/thoughts/bulk`
Create multiple thoughts at once (new endpoint, mirrors `/api/gems/bulk`).

**Request:**
```typescript
{
  thoughts: Array<{
    content: string;
    context_id: string;
    source?: string;
    source_url?: string;
    is_on_active_list?: boolean;
    status?: string;
  }>;
}
```

### Moments

#### POST `/api/moments`
Create moment and trigger AI matching.

**Request:**
```typescript
{
  description: string;           // Max 500 characters
  source?: 'manual' | 'calendar';
  calendarData?: {
    event_id: string;
    title: string;
    start_time: string;
  };
}
```

**Response:**
```typescript
{
  moment: MomentWithThoughts;  // Includes matched_thoughts array
}
```

#### GET `/api/moments`
List user's moments.

**Query Parameters:**
- `limit`: Number of moments to return (default: 10)
- `source`: Filter by source ('manual' | 'calendar')

#### POST `/api/moments/match`
Match thoughts to moment using AI. Searches ALL thoughts with `status IN ('active', 'passive')` across ALL contexts.

**Rate Limiting:** 20 matches per hour per user.

**Matching Constants:**
- `MAX_GEMS_TO_MATCH = 5` — Maximum thoughts returned
- `MIN_RELEVANCE_SCORE = 0.5` — Minimum score threshold (0.0-1.0)
- `MATCHING_TIMEOUT_MS = 5000` — AI timeout in milliseconds

#### POST `/api/moments/learn/helpful` (Epic 14)
Record that a thought was helpful for a moment. Creates pattern associations for future learning.

**Request:**
```typescript
{
  moment_id: string;
  gem_id: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### POST `/api/moments/learn/not-helpful` (Epic 14)
Record that a thought was NOT helpful. Updates confidence scores for pattern associations.

**Request:**
```typescript
{
  moment_id: string;
  gem_id: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### Calendar

#### GET `/api/auth/google-calendar`
OAuth callback for Google Calendar.

#### POST `/api/calendar/sync`
Sync calendar events from Google Calendar to cache.

#### POST `/api/calendar/check-moments`
Create moments from cached calendar events that are within lead time.
Story 16.2: Uses catchUp mode to also find events that started ≤1 hour ago.

#### GET `/api/cron/calendar-sync` (Phase 2, Story 16.1)
Server-side cron job for calendar sync. Runs every 10 minutes via Vercel Cron.
Protected by `CRON_SECRET` bearer token — not publicly callable.
Iterates all active calendar connections across all users, syncs events,
and creates moments for events within each user's lead_time_minutes.

**Response:**
```typescript
{
  connections_checked: number;
  connections_synced: number;
  moments_created: number;
  errors: string[];
}
```

**Response:**
```typescript
{
  momentsCreated: number;
  events: Array<{ event: CalendarEvent; momentId: string }>;
}
```

**Note:** This endpoint should be called after `/api/calendar/sync` to convert cached events into moments.

### Discovery

#### POST `/api/discover`
Generate discoveries for user.

**Request:**
```typescript
{
  mode: 'curated' | 'directed';
  query?: string;           // For directed mode
  context_id?: string;      // For context-specific curated
}
```

**Response:**
```typescript
{
  discoveries: Discovery[];
  session_type: 'curated' | 'directed';
  remaining_curated: number;
  remaining_directed: number;
}
```

#### POST `/api/discover/save`
Save a discovery as a thought.

**Request:**
```typescript
{
  discovery_id: string;
  thought_content: string;      // May be edited
  context_id: string;
  is_on_active_list?: boolean;
  save_article_as_note?: boolean;
}
```

#### POST `/api/discover/skip`
Skip a discovery.

**Request:**
```typescript
{
  discovery_id: string;
}
```

#### GET `/api/discover/usage`
Get user's discovery usage for today.

**Response:**
```typescript
{
  curated_used: boolean;
  directed_used: boolean;
  curated_remaining: number;
  directed_remaining: number;
}
```

#### POST `/api/discover/bookmark`
Save a discovery for later (bookmark to reading list).

**Request:**
```typescript
{
  discovery_id: string;
}
```

#### DELETE `/api/discover/bookmark`
Remove a discovery from the reading list.

**Request:**
```typescript
{
  discovery_id: string;
}
```

#### GET `/api/discover/saved`
Get all saved discoveries (reading list).

**Response:**
```typescript
{
  discoveries: Discovery[];
  count: number;
}
```

### Microsoft Calendar (Placeholder)

#### GET `/api/calendar/microsoft/auth`
Initiate Microsoft OAuth flow. Returns 503 until Azure AD credentials are configured.

#### GET `/api/calendar/microsoft/callback`
Handle Microsoft OAuth callback. Placeholder for future implementation.

### AI Quick Capture (ThoughtFolio 2.0)

#### POST `/api/capture/analyze`
Analyze content and suggest items to capture.

**Request:**
```typescript
{
  content: string;  // Text, URL, or mixed content
}
```

**Response:**
```typescript
{
  success: boolean;
  contentType: 'url' | 'short_text' | 'long_text' | 'mixed' | 'list';
  suggestions: CaptureItem[];
}

interface CaptureItem {
  id: string;
  type: 'thought' | 'note' | 'source';
  content: string;
  source?: string;
  sourceUrl?: string;
  selected: boolean;
}
```

#### POST `/api/capture/save`
Save selected capture items.

**Request:**
```typescript
{
  items: CaptureItem[];
}
```

**Response:**
```typescript
{
  success: boolean;
  created: {
    thoughts: number;
    notes: number;
    sources: number;
  };
}
```

### Calendar Events

#### GET `/api/calendar/events`
Get upcoming calendar events.

**Query Parameters:**
- `days`: Number of days to fetch (default: 7)

**Response:**
```typescript
{
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
}
```

### Full-Text Search (ThoughtFolio 2.0)

#### GET `/api/search`
Search across thoughts, notes, and sources.

**Query Parameters:**
- `q`: Search query (required)
- `type`: Filter by type (thought, note, source)
- `limit`: Max results (default 20, max 100)
- `offset`: Pagination offset (default 0)

**Response:**
```typescript
{
  results: SearchResult[];
  total: number;
  query: string;
}

interface SearchResult {
  id: string;
  type: 'thought' | 'note' | 'source';
  text: string;
  secondaryText: string | null;
  contextId: string | null;
  createdAt: string;
  rank: number;
}
```

---

## 6. Key Components

### Layout Components
| Component | File | Purpose |
|-----------|------|---------|
| Root Layout | `app/layout.tsx` | HTML structure, providers |
| Layout Shell | `components/layout-shell.tsx` | Header, sidebar, content |
| App Sidebar | `components/app-sidebar.tsx` | Navigation menu |

### Context Components
| Component | File | Purpose |
|-----------|------|---------|
| Context Settings | `components/settings/ContextSettings.tsx` | Context management UI |
| Context Form | `components/settings/ContextForm.tsx` | Add/edit context |
| Context Dropdown | `components/contexts/ContextDropdown.tsx` | Context selection |

### Thought Components
| Component | File | Purpose |
|-----------|------|---------|
| Thought Detail | `components/thought-detail.tsx` | Display with actions |
| Thought Form | `components/thought-form.tsx` | Manual creation |
| Thought Edit Form | `components/thought-edit-form.tsx` | Edit existing thought |
| Extracted Thought Card | `components/extracted-thought-card.tsx` | Card for extracted thoughts |
| Extract Modal | `components/extract-thoughts-modal.tsx` | AI extraction wizard |
| Retire Dialog | `components/retire-thought-dialog.tsx` | Retirement confirmation |
| Graduate Dialog | `components/graduate-thought-dialog.tsx` | Graduation confirmation |

### Home/Dashboard Components
| Component | File | Purpose |
|-----------|------|---------|
| Daily Thought Card | `components/home/DailyThoughtCard.tsx` | Today's thought display with 3 states |
| Activity Stats | `components/home/ActivityStatsCard.tsx` | Usage statistics |
| Quick Actions Row | `components/home/QuickActionsRow.tsx` | 4-card grid: Add Thought, Extract with AI, New Moment, Your Thoughts |
| Apply Quadrant | `components/home/ApplyQuadrant.tsx` | Daily check-in + upcoming moments |

**QuickActionsRow Features:**
- **Add Thought** — Opens ThoughtForm modal directly (amber/orange gradient)
- **Extract with AI** — Opens ExtractThoughtsModal directly (violet/purple gradient)
- **New Moment** — Links to /moments (blue/cyan gradient)
- **Your Thoughts** — Links to /library?tab=thoughts (slate gradient)

**DailyThoughtCard States:**
- **Thought available** — Shows the thought with context badge, content, and source
- **Already checked in** — Shows "You've completed your check-in for today!" (green icon)
- **No thoughts on Active List** — Shows "No thoughts on your Active List yet" with add button

### Moment Components
| Component | File | Purpose |
|-----------|------|---------|
| Moment FAB | `components/moments/MomentFAB.tsx` | Floating action button (Cmd+M / Ctrl+M) |
| Moment Entry | `components/moments/MomentEntryModal.tsx` | Quick creation with states (idle/loading/success/empty/error) |
| Prep Card | `components/moments/PrepCard.tsx` | Matched thoughts with relevance scores |
| Recent Moments | `components/moments/RecentMoments.tsx` | Dashboard widget |
| Moment Banner | `components/moments/MomentBanner.tsx` | Moment header display |
| Floating Moment Button | `components/moments/FloatingMomentButton.tsx` | Fixed bottom-right FAB with scroll visibility |
| Floating Button Menu | `components/moments/FloatingButtonMenu.tsx` | Menu with AI Capture, Add Thought, From Calendar, New Moment options |

| Quick Moment Entry | `components/moments/QuickMomentEntry.tsx` | Inline moment description input |
| Calendar Event Picker | `components/moments/CalendarEventPicker.tsx` | Upcoming events selector |

**FloatingButtonMenu Options:**
- **AI Capture** — Opens AICaptureModal (ai-gradient)
- **Add Thought** — Opens ThoughtForm modal (amber lightbulb icon)
- **From Calendar** — Opens CalendarEventPicker (conditional, only if calendar connected)
- **New Moment** — Opens QuickMomentEntry (blue)

### Capture Components (ThoughtFolio 2.0)
| Component | File | Purpose |
|-----------|------|---------|
| AI Capture Modal | `components/capture/AICaptureModal.tsx` | Main capture modal (Cmd+N shortcut) |
| Capture Empty State | `components/capture/CaptureEmptyState.tsx` | Initial state with examples |
| Capture Analyzing | `components/capture/CaptureAnalyzing.tsx` | Loading/analyzing state |
| Capture Suggestions | `components/capture/CaptureSuggestions.tsx` | Results with selection checkboxes |
| Capture Item Card | `components/capture/CaptureItemCard.tsx` | Individual item with type/context/edit |

### Notes Components
| Component | File | Purpose |
|-----------|------|---------|
| Rich Text Editor | `components/notes/rich-text-editor.tsx` | TipTap WYSIWYG editor with formatting, tables, and AI writing assist |
| Enhanced Note Editor | `components/notes/enhanced-note-editor.tsx` | Full-screen modal with inline sidebar for attachments/thoughts, AI extraction |
| Collapsible | `components/ui/collapsible.tsx` | Radix UI collapsible sections |
| Note Editor (Legacy) | `components/note-editor.tsx` | Basic markdown note editing |
| Note Card | `components/note-card.tsx` | Note display in lists |
| Notes List | `components/notes-list.tsx` | List of user's notes |
| Extract from Note | `components/extract-from-note-modal.tsx` | Extract thoughts from note content |

#### Rich Text Editor Features
The `RichTextEditor` component uses TipTap and provides:
- **Text formatting:** Bold, italic, underline, headings (H1, H2, H3)
- **Font selection:** Font family dropdown (Sans Serif, Serif, Mono, Arial, Times, Verdana, Courier)
- **Font size:** Size dropdown (Small, Normal, Medium, Large, X-Large, XX-Large)
- **Lists:** Bullet lists, numbered lists, blockquotes
- **Text alignment:** Left, center, right, justify alignment for paragraphs and headings
- **Media:** Links, images (via URL)
- **Tables:** Insert 3x3 tables with header rows, add/delete rows and columns
- **Dividers:** Horizontal rule/divider insertion
- **Emoji:** Emoji picker with search functionality
- **History:** Undo/redo support
- **AI Assist:** Writing assistance dropdown (improve, simplify, expand, summarize, fix grammar, continue) - requires AI consent
- **Paste handling:** Preserves formatting when pasting from Notion and other rich text sources
- **Sticky toolbar:** Toolbar remains fixed at top when scrolling through long notes
- **Text selection callback:** Notifies parent when text is selected (for thought creation)

#### Enhanced Note Editor Layout
The note editor modal (95vw x 90vh) features a modern layout:
- **Main content area:** Title input, folder selector, rich text editor
- **Folder management:** Dropdown to select existing folder or create new folder inline
- **Right sidebar (desktop):** Collapsible sections for Attachments, Linked Thoughts, and AI Extraction
- **AI Thought extraction in sidebar:** Extract thoughts directly from note content with:
  - **Extract button:** Generate AI-powered thought suggestions
  - **Extract more:** Append additional extractions to existing list
  - **Try again:** Re-run extraction with fresh results
  - **Edit extracted thoughts:** Inline editing of content and context tag before saving
  - **Context tag selection:** Choose category for each extracted thought
  - **Batch save:** Select and save multiple thoughts at once, auto-linked to note
- **Create thought from selection:** When text is selected in editor, sidebar shows:
  - Pre-filled thought content from selection
  - Context tag dropdown for categorization
  - Save button to create thought and link to note
- **Manual thought creation:** Create thoughts by typing directly (not just from selection)
- **Inline attachments:** Upload files directly from sidebar without switching tabs
- **Link existing thoughts:** Search and link existing thoughts to the note
- **Auto-save drafts:** Drafts are automatically saved to database after 3 seconds of inactivity
- **Draft restoration:** On opening a new note, users are prompted to restore any previous unsaved drafts
- **Minimize functionality:** Minimize button saves current content as draft and closes the editor; draft can be restored later
- **Note:** Context tags are NOT shown for notes (only for Thoughts) - folder organization is used instead

### Discovery Components
| Component | File | Purpose |
|-----------|------|---------|
| Discover Card | `components/discover/DiscoverCard.tsx` | Dashboard entry point |
| Context Chip | `components/discover/ContextChip.tsx` | Context selector |
| Discovery Grid | `components/discover/DiscoveryGrid.tsx` | Grid view with refresh button |
| Discovery Card | `components/discover/DiscoveryCard.tsx` | Individual card with bookmark |
| Discovery Detail | `components/discover/DiscoveryDetail.tsx` | Expanded view |
| Save Modal | `components/discover/SaveDiscoveryModal.tsx` | Save flow |
| Discover Tabs | `components/discover/DiscoverTabs.tsx` | Tab navigation (For You, Explore, Saved) |
| Saved Discoveries Tab | `components/discover/SavedDiscoveriesTab.tsx` | Bookmarked discoveries list |

### Search Components (ThoughtFolio 2.0)
| Component | File | Purpose |
|-----------|------|---------|
| Global Search | `components/search/GlobalSearch.tsx` | Cmd+K search modal |
| Search Results | `components/search/SearchResults.tsx` | Grouped results display |
| Search Result Card | `components/search/SearchResultCard.tsx` | Individual result |
| Search Filters | `components/search/SearchFilters.tsx` | Type filter buttons |

### Library Components (ThoughtFolio 2.0)
| Component | File | Purpose |
|-----------|------|---------|
| Library Tabs | `components/library/LibraryTabs.tsx` | Tab navigation (All, Thoughts, Notes, Sources, Archive) |
| Library All Tab | `components/library/LibraryAllTab.tsx` | Mixed content feed |
| Library Thoughts Tab | `components/library/LibraryThoughtsTab.tsx` | Full-featured thoughts management |
| Library Notes Tab | `components/library/LibraryNotesTab.tsx` | Notes with folder organization |
| Library Sources Tab | `components/library/LibrarySourcesTab.tsx` | Sources grid |
| Library Archive Tab | `components/library/LibraryArchiveTab.tsx` | Archived/retired thoughts |

**LibraryThoughtsTab Features:**
- **Filter Sidebar** (desktop): All Thoughts, Active List, Passive with counts
- **Mobile Filter**: Dropdown selector for filter options
- **Header Actions**: "Add Thought" and "Extract with AI" buttons
- **Integrated Modals**: ThoughtForm for manual entry, ExtractThoughtsModal for AI extraction
- **Context Filter**: Optional filtering by context (passed from parent)
- **Pagination**: "Load more" for large collections

---

## 7. Services & Libraries

### Context Service (`lib/contexts.ts`)
```typescript
getContexts(): Promise<ContextWithCount[]>
getContextBySlug(slug: string): Promise<Context>
getContextById(id: string): Promise<Context>
createContext(input: CreateContextInput): Promise<Context>
updateContext(id: string, input: UpdateContextInput): Promise<Context>
deleteContext(id: string): Promise<void>
getContextThoughtCount(contextId: string): Promise<number> // Only counts status IN ('active', 'passive')
isContextAtLimit(contextId: string): Promise<{atLimit, count, limit}>
getOtherContextId(): Promise<string>  // For fallback assignments
```

### Thought Service (`lib/thoughts.ts`)
```typescript
createMultipleThoughts(thoughts: CreateThoughtInput[]): Promise<Thought[]>
updateThought(id: string, input: Partial<CreateThoughtInput>): Promise<Thought>
retireThought(id: string): Promise<Thought> // Sets status = 'retired', retired_at = now()
deleteThought(id: string): Promise<void> // Hard delete
restoreThought(id: string): Promise<Thought> // Sets status = 'active', clears retired_at
graduateThought(id: string): Promise<Thought>
toggleActiveList(id: string): Promise<Thought>
getActiveListCount(): Promise<number>
getDailyThought(): Promise<{ thought: Thought | null; alreadyCheckedIn: boolean; error: string | null }>
  // Only Active List (is_on_active_list = true AND status IN ('active', 'passive'))
  // Returns alreadyCheckedIn: true if user completed daily check-in today
getAllThoughtsForMoments(): Promise<Thought[]>  // ALL thoughts with status IN ('active', 'passive')
getRetiredThoughts(): Promise<Thought[]> // status = 'retired'
```

### Discovery Service (`lib/discovery.ts`)
```typescript
generateDiscoveries(userId: string, mode: 'curated' | 'directed', query?: string, contextId?: string): Promise<Discovery[]>
saveDiscovery(discoveryId: string, input: SaveDiscoveryInput): Promise<Thought>
skipDiscovery(discoveryId: string): Promise<void>
getDiscoveryUsage(userId: string): Promise<DiscoveryUsage>
getContextWeights(userId: string): Promise<ContextWeight[]>  // Weighted by thought count
checkContentSkipped(userId: string, url: string): Promise<boolean>
createDiscoveries(userId: string, discoveries: Discovery[]): Promise<Discovery[]>
updateDiscoveryStatus(id: string, status: string, savedGemId?: string): Promise<void>
addSkippedContent(userId: string, url: string): Promise<void>
incrementUsage(userId: string, sessionType: 'curated' | 'directed'): Promise<void>
saveDiscoveryForLater(discoveryId: string, userId: string): Promise<{ discovery: Discovery | null; error: string | null }>
unsaveDiscovery(discoveryId: string, userId: string): Promise<{ discovery: Discovery | null; error: string | null }>
getSavedDiscoveries(userId: string): Promise<{ discoveries: Discovery[]; error: string | null }>
getSavedDiscoveriesCount(userId: string): Promise<{ count: number; error: string | null }>
```

### Microsoft Calendar Service (`lib/calendar-microsoft.ts`)
Placeholder service for Microsoft Calendar integration (pending Azure AD configuration).
```typescript
getMicrosoftAuthUrl(): string
isMicrosoftConfigured(): boolean
handleMicrosoftCallback(code: string, redirectUri: string): Promise<CallbackResult>
getMicrosoftEvents(accessToken: string, startDate: Date, endDate: Date): Promise<EventsResult>
refreshMicrosoftToken(refreshToken: string): Promise<RefreshResult>
syncMicrosoftCalendar(connectionId: string, userId: string): Promise<{ error: string | null }>
```

### Calendar Sync Service (`lib/calendar-sync.ts`)
**⚠️ Server-only:** This module uses the server Supabase client and `createMomentWithMatching` directly. Do NOT import in client components.

For client-side code, use the API route instead: `POST /api/calendar/check-moments`

```typescript
checkForUpcomingEvents(): Promise<{ momentsCreated: number; events: Array<{ event: CalendarEvent; momentId: string }>; error: string | null }>
syncAllCalendars(): Promise<{ synced: number; error: string | null }>
runCalendarCheck(): Promise<void>  // Syncs calendars then creates moments
```

**Critical:** `checkForUpcomingEvents()` queries `calendar_events_cache` for events where `moment_created = false` and `start_time` is within the user's configured `lead_time_minutes`. It calls `createMomentWithMatching` directly and marks cache entries as processed.

### Moment Creation Service (`lib/moments/create-moment.ts`)
Single source of truth for creating moments with full AI matching pipeline.
```typescript
createMomentWithMatching(supabase: SupabaseClient, params: CreateMomentParams): Promise<CreateMomentResult>
// Handles: DB insert, gem fetch, learned thoughts, AI matching, moment_gems insert, match count update
```

Used by: `app/api/moments/route.ts` (POST handler) and `lib/calendar-sync.ts`.

### Moments Client Service (`lib/moments.ts`)
Client-side CRUD operations for moments.
```typescript
createMoment(description, source?, calendarData?): Promise<{ moment: Moment | null; error: string | null }>  // DB-only insert, no AI matching — use createMomentWithMatching for full pipeline
getMoment(momentId: string): Promise<{ moment: MomentWithThoughts | null; error: string | null }>
getRecentMoments(limit?: number, statusFilter?: MomentStatus): Promise<{ moments: Moment[]; error: string | null }>
getAllMoments(sourceFilter?: MomentSource): Promise<{ moments: Moment[]; error: string | null }>
updateMomentStatus(momentId: string, status: MomentStatus): Promise<{ error: string | null }>
updateMomentMatchResults(momentId: string, thoughtsMatchedCount: number, processingTimeMs: number): Promise<{ error: string | null }>
recordMomentThoughtFeedback(momentGemId: string, wasHelpful: boolean): Promise<{ error: string | null }>
markThoughtReviewed(momentGemId: string): Promise<{ error: string | null }>
addMomentThoughts(momentId: string, matches: GemMatch[]): Promise<{ error: string | null }>
```

### Matching Service (`lib/matching.ts`)
```typescript
matchGemsToMoment(momentDescription: string, gems: GemForMatching[]): Promise<MatchingResponse>
```

**Constants (from `types/matching.ts`):**
- `MAX_GEMS_TO_MATCH = 5`
- `MIN_RELEVANCE_SCORE = 0.5`
- `MATCHING_TIMEOUT_MS = 5000`

### URL Extractor Service (`lib/url-extractor.ts`)
```typescript
detectUrlType(url: string): 'article' | 'youtube' | 'unknown'
extractArticleContent(url: string): Promise<ExtractedContent>
extractYouTubeTranscript(url: string): Promise<ExtractedContent>
```

### Sources Service (`lib/sources.ts`) (ThoughtFolio 2.0)
```typescript
createSource(input: CreateSourceInput): Promise<{ data: Source | null; error: string | null }>
getSource(id: string): Promise<{ data: Source | null; error: string | null }>
getSources(): Promise<{ data: Source[]; error: string | null }>
getSourceByUrl(url: string): Promise<{ data: Source | null; error: string | null }>
updateSource(id: string, input: UpdateSourceInput): Promise<{ data: Source | null; error: string | null }>
deleteSource(id: string): Promise<{ error: string | null }>
```

### Note Links Service (`lib/note-links.ts`) (ThoughtFolio 2.0)
```typescript
linkThoughtToNote(noteId: string, gemId: string, position?: number): Promise<{ data: NoteThoughtLink | null; error: string | null }>
unlinkThoughtFromNote(noteId: string, gemId: string): Promise<{ error: string | null }>
getLinkedThoughts(noteId: string): Promise<{ data: Thought[]; error: string | null }>
getLinkedNotes(gemId: string): Promise<{ data: Note[]; error: string | null }>
reorderLinks(noteId: string, links: ReorderLinkInput[]): Promise<{ error: string | null }>
```

### Search Service (`lib/search.ts`) (ThoughtFolio 2.0)
```typescript
search(query: string, filters?: SearchFilters): Promise<{ data: SearchResponse; error: string | null }>
clearSearchCache(): void  // Clear cache when content is created/modified
```

Uses PostgreSQL full-text search with `tsvector` columns and falls back to ILIKE queries if the `search_knowledge` database function is unavailable.

**Caching:** Results are cached in-memory with 30-second TTL. Cache key is generated from query + filters. Cache is limited to 100 entries to prevent memory issues. Call `clearSearchCache()` when new content is created to ensure fresh results.

### AI Prompts (`lib/ai/prompts.ts`)
Centralized prompt templates for all AI features. Version 2.0.0.

**Exported Prompts:**
| Constant | Purpose |
|----------|---------|
| `THOUGHT_EXTRACTION_PROMPT` | Extract insights from text content |
| `MULTIMEDIA_EXTRACTION_PROMPT` | Extract from images/audio/video |
| `CAPTURE_ANALYSIS_PROMPT` | Categorize pasted content for AI Capture |
| `IMAGE_ANALYSIS_PROMPT` | Process pasted images |
| `TF_THINKS_PROMPT` | Generate user insights for dashboard |
| `DISCOVERY_WEB_SEARCH_PROMPT` | Find web content with grounding |
| `DISCOVERY_FALLBACK_PROMPT` | Recommend without web access |
| `SCHEDULE_PARSE_PROMPT` | Parse natural language schedules |
| `MOMENT_MATCHING_PROMPT` | Match thoughts to moments |

**Helper Functions:**
```typescript
formatContextsForPrompt(contexts: Context[]): string  // Format contexts for prompt injection
buildWriteAssistPrompt(userPrompt: string, text: string): string  // Build write assist prompt
```

**Constants:**
- `PROMPT_VERSION = "2.0.0"`
- `DEFAULT_CONTEXTS` — Fallback context list string

**Key Conventions:**
- 300 character limit for extracted thoughts
- Dynamic `{contexts_list}` placeholder for user's contexts
- Quality over quantity — no hard-coded extraction limits
- Good/bad examples in prompts to guide AI behavior

### AI Service (`lib/ai/gemini.ts`)
```typescript
extractThoughtsFromContent(content: string, source?: string, contexts?: Context[]): Promise<ExtractionResult>
extractThoughtsFromMultimedia(text: string, media: MediaInput[], contexts?: Context[]): Promise<ExtractionResult>
parseScheduleNLP(text: string): Promise<NLPScheduleResult>
matchThoughtsToMoment(description: string, thoughts: Thought[]): Promise<MatchingResponse>
generateDiscoveries(mode: 'curated' | 'directed', contexts: Context[], existingThoughts: Thought[], query?: string): Promise<Discovery[]>
```

**Note:** Functions import prompts from `lib/ai/prompts.ts` and inject user contexts dynamically.

### Content Detector (`lib/ai/content-detector.ts`) (ThoughtFolio 2.0)
```typescript
detectContentType(content: string): ContentType  // 'url' | 'short_text' | 'long_text' | 'mixed' | 'list'
isUrl(text: string): boolean
isQuoteLike(text: string): boolean
isBulletList(text: string): boolean
extractUrls(text: string): string[]
extractBulletPoints(text: string): string[]
```

### Content Splitter (`lib/ai/content-splitter.ts`) (ThoughtFolio 2.0)
```typescript
splitMixedContent(content: string): Promise<SplitContentResult>  // Uses Gemini AI
extractSourceAttribution(text: string): SourceAttribution
detectBookReference(text: string): { isBook: boolean; title?: string; author?: string }
```

### Scroll Visibility Hook (`lib/hooks/useScrollVisibility.ts`) (ThoughtFolio 2.0)
```typescript
useScrollVisibility(options?: { hideDelay?: number }): { isVisible: boolean; setIsVisible: (v: boolean) => void }
```

Custom hook that hides UI elements on scroll down and shows them after a delay (default 500ms).

### Global Shortcuts Hook (`lib/hooks/useGlobalShortcuts.ts`)
```typescript
useGlobalShortcuts(): {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isCaptureOpen: boolean;
  setIsCaptureOpen: (open: boolean) => void;
}
```

Handles Cmd+K (search) and Cmd+N (capture) keyboard shortcuts globally.

### Calendar Auto-Sync Hook (`lib/hooks/useCalendarAutoSync.ts`)
```typescript
useCalendarAutoSync(): {
  runAutoSync: () => Promise<void>;
  lastSyncAt: string | null;     // Story 16.3: Last successful sync time
  syncError: string | null;      // Story 16.3: Current sync error if any
  isSyncing: boolean;            // Story 16.3: Currently syncing
  catchUpCount: number;          // Story 16.2: Moments created during catch-up
  clearCatchUp: () => void;      // Story 16.2: Dismiss catch-up notification
}
```

Best-effort client-side calendar sync supplement (Phase 2, Stories 16.1/16.2/16.3). The primary sync driver is the server-side cron job at `/api/cron/calendar-sync`. This hook acts as a supplement.

**Behavior:**
- Syncs on app load (mount) with catch-up for missed events (Story 16.2)
- Polls every 5 minutes as a fallback supplement to the cron job
- Compares `last_sync_at` with `sync_frequency_minutes` to determine if sync is due
- Only syncs connections where `sync_frequency_minutes > 0` (excludes manual-only)
- After syncing, automatically calls `/api/calendar/check-moments` to create moments
- Prevents concurrent sync operations
- Exposes sync health state for the SyncHealthIndicator component (Story 16.3)

---

## 8. Data Flows

### Thought Capture Flow
```
1. User enters content (text, URL, or media)
2. If URL:
   a. Detect type (article/YouTube)
   b. Fetch and parse content
   c. If fails, show manual paste fallback
3. Send to Gemini for extraction
4. AI suggests context based on content
5. User reviews, adjusts context, selects thoughts
6. Check per-context limit
7. Save to database (status = 'active', is_on_active_list = false by default)
8. User can add to Active List if desired
```

### Daily Check-in Flow
```
1. Check if user already checked in today (query gem_checkins for daily_checkin)
2. If already checked in, show "done for today" state
3. Query thoughts with:
   - is_on_active_list = true
   - status IN ('active', 'passive')
4. Select least recently surfaced
5. Display thought with "Did you apply this today?" prompt
6. User responds Yes or No (with optional reflection)
7. If Yes: increment application_count, update last_applied_at
8. If No: increment skip_count
9. If skip_count >= 21, show "stale thought" prompt (keep or release)
10. If application_count >= 5, thought eligible for graduation
```

### Moment Matching Flow
```
1. User describes upcoming situation (or selects calendar event)
2. If event title is generic (e.g., "Meeting", "1:1"):
   a. Detect event type (1:1, team_meeting, interview, etc.)
   b. Show context enrichment prompt with quick-select chips
   c. User provides additional context (optional, can skip)
3. Fetch ALL user's thoughts where status IN ('active', 'passive')
4. Epic 14 Learning: Check for learned thoughts
   a. Query moment_learnings for patterns matching event type/keywords
   b. Filter by helpful_count >= 3 and confidence >= 70%
   c. Pass learned thoughts to matching prompt for boosted scoring
5. Send to Gemini for matching (with learned thoughts context)
6. Return top 3-5 with relevance scores + match source (ai/learned/both)
7. Display prep card with "Helped before" badge on learned thoughts
8. User reviews thoughts, marks "Got it" or "Not helpful"
9. Feedback triggers learning:
   - "Got it" → POST /api/moments/learn/helpful → creates pattern associations
   - "Not helpful" → POST /api/moments/learn/not-helpful → updates confidence
```

### Calendar Sync & Moment Creation Flow (Phase 2)
```
1. User connects Google Calendar via OAuth
2. User configures sync settings:
   - Auto-sync frequency: Manual only, Every 5/15/30/60 minutes
   - Lead time: 15/30/60/120 minutes before event
   - Event filter: All events, Meetings only, Custom keywords
3. PRIMARY: Server-side cron sync (Story 16.1):
   a. GET /api/cron/calendar-sync runs every 10 minutes (Vercel Cron)
   b. Iterates ALL active connections across ALL users
   c. Uses admin Supabase client (service role key, no user session)
   d. For each due connection: sync events + create moments within lead_time
4. SUPPLEMENT: Client-side sync (Story 16.1/16.2):
   a. useCalendarAutoSync runs sync on app load (catch-up)
   b. Polls every 5 minutes as best-effort fallback
   c. Story 16.2: On mount, uses catchUp mode to look back 1 hour
      for events that started but are still ongoing
5. On any sync:
   a. Fetch events from Google Calendar API for next 24 hours
   b. Filter events based on user settings
   c. Upsert events to calendar_events_cache table
6. Moment creation:
   a. check-moments route queries events within lead_time window
   b. Story 16.2: catchUp=true also finds events started ≤1 hour ago
   c. For each qualifying event: create moment, mark cache as processed
7. Dashboard display (Story 17.1/17.2/17.3):
   a. ApplyQuadrant shows combined list of moments + un-momentified events
   b. Un-momentified events show "Tap to prepare" — creates moment on-demand
   c. Urgency: <30 min = amber highlight with pulsing dot
   d. Quality badges: "Ready" (3+ matches), count, "Needs context", "Tap to prepare"
8. Sync health (Story 16.3):
   a. SyncHealthIndicator in sidebar shows last sync time + status
   b. Green=healthy, amber=stale (>30 min), red=error, blue=syncing
```

**Key Files:**
- `app/api/cron/calendar-sync/route.ts` — Primary cron sync (every 10 min)
- `lib/supabase/admin.ts` — Admin client for cron (service role key)
- `vercel.json` — Cron schedule configuration
- `lib/calendar.ts` — Server-side Google Calendar API integration
- `lib/calendar-client.ts` — Client-safe calendar functions
- `lib/hooks/useCalendarAutoSync.ts` — Best-effort client-side sync supplement
- `app/api/calendar/check-moments/route.ts` — Moment creation from cached events
- `components/home/ApplyQuadrant.tsx` — Dashboard display (moments + events combined)
- `components/calendar/SyncHealthIndicator.tsx` — Sync health status dot

**Important:** The `/api/calendar/check-moments` endpoint MUST be called after `/api/calendar/sync` to convert cached calendar events into moments. The cron job handles this automatically. Client components should use the API route (not import `lib/calendar-sync.ts` directly) to avoid bundling server-only dependencies.

### Retire Flow
```
1. User clicks "Retire" on thought detail
2. Confirm action
3. Set status = 'retired', retired_at = now()
4. Thought moves to Retired page
5. User can restore later (sets status = 'active', clears retired_at)
```

### Delete Flow
```
1. User clicks "Delete" on thought detail or Retired page
2. Confirm action with warning "This cannot be undone"
3. Hard delete row from database
```

### Discovery Flow
```
1. User opens Dashboard, sees "Discover Something New!" card
2. User chooses path:
   a. Types topic → directed mode
   b. Taps context chip → curated mode (single context)
   c. Taps "Surprise Me" → curated mode (multi-context)
3. Check daily usage limits
4. If curated: get context rotation (weighted by thought count)
5. Call Gemini with grounding to search web
6. Gemini returns 8 discoveries with metadata
7. Filter out previously skipped content (by URL hash)
8. Store discoveries in database
9. Return grid of 8 cards with refresh option
10. User browses, expands cards
11. On save: create thought + optional note, link discovery
12. On skip: mark discovery skipped, add to skip list
13. Update usage counters
```

---

## 9. Security

- All tables use Row Level Security (RLS)
- Users can only access their own data
- OAuth tokens encrypted at rest
- API keys in environment variables only
- Active List limit (10 max) enforced at application level via `toggleActiveList()` in `lib/thoughts.ts`

---

## 10. Environment Variables

Required in Vercel:

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Server-side Supabase access |
| GOOGLE_AI_API_KEY | Gemini API access |
| GOOGLE_CALENDAR_CLIENT_ID | Calendar OAuth |
| GOOGLE_CALENDAR_CLIENT_SECRET | Calendar OAuth |
| GOOGLE_CALENDAR_REDIRECT_URI | OAuth callback URL |
| CRON_SECRET | Auth secret for Vercel Cron jobs (Phase 2) |

---

## 11. UI Design System

The app uses a **glassmorphism design system** with AI-forward visual design, implemented and enhanced in January 2026.

### Theme Support (16 Themes)
- **14 Dark themes:** Midnight, Obsidian, Amethyst, Ocean, Ruby, Forest, Rose, Nord, Cyber, Copper, Slate, Aurora, Ember, Onyx
- **2 Light themes:** Sunrise, Daylight
- Theme picker dropdown in header via `components/theme-picker.tsx`
- Theme persisted in localStorage via `theme-provider.tsx`
- System preference detection for initial theme
- Theme categories with preview colors in `lib/themes.ts`

### Enhanced Glassmorphism (CSS Variables)
The design system uses CSS custom properties for consistent glass effects:

```css
/* Core glass card variables */
--glass-card-bg: rgba(...)
--glass-card-border: rgba(...)
--glass-card-border-top: rgba(...)  /* Highlight effect */
--glass-card-shadow: ...            /* Layered shadows */
--glass-card-blur: 20px

/* Glass utility classes */
.glass-card      /* Primary card styling */
.glass-input     /* Input field styling */
.glass-sidebar   /* Navigation sidebar */
.glass-button-secondary  /* Secondary buttons */
```

```typescript
// Card with glassmorphism (uses CSS variables)
className="glass-card"

// Dropdown menus (solid background for legibility)
className="bg-popover border border-border rounded-md shadow-md"

// Hover states with glass effects
className="glass-card hover:shadow-lg"
```

### AI-Forward Design
Components and utilities for AI feature branding:

| Component | File | Purpose |
|-----------|------|---------|
| AIBadge | `components/ui/ai-badge.tsx` | "AI Powered" indicator badges |
| AICard | `components/ui/ai-badge.tsx` | Card wrapper with AI glow effect |
| AIThinking | `components/ui/ai-badge.tsx` | Loading state for AI operations |
| AIShimmer | `components/ui/ai-badge.tsx` | Shimmer loading effect |

```css
/* AI gradient and glow effects */
.ai-gradient     /* Purple-to-blue gradient */
.ai-glow         /* Pulsing glow shadow */
.ai-sparkle      /* Sparkle animation */
.ai-shimmer      /* Loading shimmer effect */
```

### Loading & Empty States
Consistent state handling across the app:

| Component | File | Purpose |
|-----------|------|---------|
| LoadingState | `components/ui/loading-state.tsx` | Loading with variants (default/minimal/fullscreen) |
| CardSkeleton | `components/ui/loading-state.tsx` | Skeleton for card loading |
| ListSkeleton | `components/ui/loading-state.tsx` | Skeleton for list loading |
| EmptyState | `components/ui/empty-state.tsx` | 9 variants (thoughts/notes/sources/moments/discover/search/archive/trophy/default) |
| InlineEmptyState | `components/ui/empty-state.tsx` | Compact inline empty state |

### Animations & Microinteractions
CSS animation classes for enhanced UX:

```css
/* Entry animations */
.animate-bounce-in   /* Scale bounce on appear */
.animate-slide-up    /* Slide up from below */
.animate-pop         /* Quick pop effect */

/* Interactive animations */
.animate-wiggle      /* Attention wiggle */
.animate-glow-pulse  /* Pulsing glow */

/* Microinteraction classes */
.hover-lift          /* Slight lift on hover */
.hover-scale         /* Scale up on hover */
.hover-glow          /* Add glow on hover */
.press-effect        /* Press down animation */
```

### Color Tokens (shadcn/ui)
- `bg-background` / `text-foreground` - Base colors
- `bg-card` / `text-card-foreground` - Card surfaces
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-muted` / `text-muted-foreground` - Secondary text
- `bg-accent` / `text-accent-foreground` - Highlights

### Key Components
| Component | File | Purpose |
|-----------|------|---------|
| Theme Provider | `components/theme-provider.tsx` | Theme context |
| Theme Picker | `components/theme-picker.tsx` | Header dropdown for theme selection |
| Layout Shell | `components/layout-shell.tsx` | Page wrapper with sidebar |
| Bottom Navigation | `components/layout/BottomNavigation.tsx` | Mobile tab bar |

### Navigation Labels
- Home, Library, **Check-in** (was "Active"), Moments, Discover, Trophy Case
- Icons use Phosphor icons: House, Books, CheckCircle, CalendarCheck, Compass, Trophy

---

## 12. Feature Status (January 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Core Thoughts | Complete | CRUD, contexts, Active List |
| Daily Check-in | Complete | Single daily touchpoint, thought surfacing, graduation tracking |
| Moments (Epic 8) | Complete | AI matching, calendar integration, rate limiting (20/hr) |
| Moment Intelligence (Epic 14) | Complete | Smart context prompting, learning system |
| Discovery (Epic 12) | Complete | Web search, save/skip workflow |
| Notes | Complete | Standalone notes with tags, folders, extract-to-thoughts |
| Glassmorphism UI | Complete | Dark/light theme support |
| Contexts System | Complete | 8 defaults + custom creation |
| Trophy Case | Complete | Graduated thoughts display |
| **ThoughtFolio 2.0** | Complete | PKM Pivot implementation |
| - Full-Text Search | Complete | Cmd+K modal, filters, keyboard nav, result caching |
| - Sources Entity | Complete | Types and CRUD service |
| - Note-Thought Links | Complete | Bi-directional linking service |
| - Profile Settings | Complete | Focus mode, active list limit, check-in enabled |
| - Navigation Updates | Complete | 4-tab bottom nav, sidebar Library section |
| - Unified Library | Complete | All/Thoughts/Notes/Sources/Archive tabs, lazy loading |
| - Context Chips Filter | Complete | Horizontal scrollable filter |
| - Quick Actions | Complete | AI Capture, New Moment, Discover shortcuts |
| - Floating Moment Button | Complete | Phase 5: FAB with scroll visibility, calendar picker |
| - AI Quick Capture | Complete | Phase 6: Cmd+N modal, content analysis, multi-item save |
| - Microsoft Calendar | Partial | Phase 7: Placeholder service, UI prepared, awaiting Azure AD |
| - Enhanced Discovery | Complete | Phase 8: Tabs, saved discoveries, bookmark workflow |
| - Focus Mode Settings | Complete | Phase 9: Active list limit slider, check-in toggle |
| - Polish & Launch | Complete | Phase 10: Tests, caching, performance optimizations |
| **UX Overhaul** | Complete | Major visual refresh |
| - 16-Theme System | Complete | 14 dark + 2 light themes with picker |
| - Enhanced Glassmorphism | Complete | CSS variables, layered shadows, saturation |
| - AI-Forward Components | Complete | AIBadge, AICard, AIThinking, AIShimmer |
| - Loading States | Complete | LoadingState with 3 variants, skeletons |
| - Empty States | Complete | EmptyState with 9 content-specific variants |
| - Animations | Complete | Entry animations, microinteractions |
| - Navigation Updates | Complete | Check-in label, Phosphor icons consistency |
| - Dashboard Improvements | Complete | Smart greeting, reordered cards |
| **Phase 2: Moments Improvements** | Complete | Reliable sync, smarter Apply, enhanced enrichment |
| - Server-side Cron Sync (16.1) | Complete | Vercel Cron every 10 min, admin client, all users |
| - Catch-up on App Load (16.2) | Complete | 1-hour lookback for missed events |
| - Sync Health Indicator (16.3) | Complete | Colored dot in sidebar: healthy/stale/error/syncing |
| - Calendar Events in Apply (17.1) | Complete | Un-momentified events with "Tap to prepare" |
| - Urgency Indicators (17.2) | Complete | Amber highlight + pulsing dot for <30 min |
| - Quality Badges (17.3) | Complete | Ready/count/Needs context/Tap to prepare |
| - Merge Enrichment (18.5) | Complete | Keeps existing matches, merges higher scores |
| - Always-Available Enrichment (18.1) | Complete | Persistent "Add context" link on PrepCard |
| - Manual Enrichment (18.2) | Complete | Enrichment prompt for all manual moments |
