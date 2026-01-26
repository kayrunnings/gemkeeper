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
│   │   │   └── match/            # AI thought matching
│   │   └── auth/                 # OAuth callbacks
│   │       └── google-calendar/  # Google Calendar OAuth
│   ├── auth/                     # Auth actions
│   ├── checkin/                  # Evening check-in page
│   ├── daily/                    # Daily prompt page
│   ├── dashboard/                # Main dashboard
│   ├── thoughts/                 # Thought management (alias: gems/)
│   │   └── [id]/                 # Thought detail page
│   ├── retired/                  # Retired thoughts page
│   ├── moments/                  # Moments feature
│   │   ├── page.tsx              # Moments history
│   │   └── [id]/prepare/         # Moment prep card
│   ├── login/                    # Authentication
│   ├── onboarding/               # First-time setup
│   ├── settings/                 # User preferences + contexts
│   ├── trophy-case/              # Graduated thoughts (ThoughtBank)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── gems/                     # Thought-related components
│   ├── contexts/                 # Context management components
│   ├── discover/                 # Discovery components
│   │   ├── DiscoverCard.tsx      # Dashboard entry point
│   │   ├── ContextChip.tsx       # Context selector chip
│   │   ├── DiscoveryGrid.tsx     # 2x2 grid of discoveries
│   │   ├── DiscoveryCard.tsx     # Individual discovery card
│   │   ├── DiscoveryDetail.tsx   # Expanded discovery view
│   │   └── SaveDiscoveryModal.tsx # Save flow modal
│   ├── schedules/                # Schedule components
│   ├── moments/                  # Moment components
│   ├── settings/                 # Settings components
│   └── ...                       # Other components
├── lib/                          # Utilities and services
│   ├── ai/                       # AI/Gemini integration
│   │   ├── gemini.ts             # Gemini API logic
│   │   └── rate-limit.ts         # Rate limiting & caching
│   ├── supabase/                 # Database clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── types/                    # Type definitions
│   │   ├── thought.ts            # Thought types
│   │   ├── context.ts            # Context types
│   │   ├── discovery.ts          # Discovery types
│   │   └── ...                   # Other types
│   ├── contexts.ts               # Context service functions
│   ├── thoughts.ts               # Thought service functions
│   ├── discovery.ts              # Discovery service functions
│   ├── schedules.ts              # Schedule service functions
│   ├── moments.ts                # Moment service functions
│   ├── calendar.ts               # Calendar service functions
│   ├── url-extractor.ts          # URL content extraction
│   ├── matching.ts               # AI thought matching
│   └── utils.ts                  # Utility helpers
├── types/                        # Additional type definitions
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
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| UI Components | shadcn/ui + Radix UI | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | Latest |
| AI/ML | Google Gemini API | 2.0 Flash |
| Calendar | Google Calendar API | v3 |
| URL Parsing | Mozilla Readability | Latest |
| YouTube | youtube-transcript | Latest |
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
| content | TEXT | Thought text (max 200 chars) |
| source | TEXT | Book/podcast/article name |
| source_url | TEXT | URL to source |
| context_tag | ENUM | Legacy field (deprecated) |
| custom_context | TEXT | Legacy field (deprecated) |
| is_on_active_list | BOOLEAN | On Active List for daily prompts (max 10) |
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

**Active List:** Controlled by `is_on_active_list` boolean. Maximum 10 thoughts with `is_on_active_list = true` (enforced by trigger). Only thoughts with `status IN ('active', 'passive')` can be on the Active List.

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
| gems_matched_count | INTEGER | Number of thoughts matched |
| ai_processing_time_ms | INTEGER | AI matching duration |
| status | VARCHAR(20) | active/completed/dismissed |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

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

#### `calendar_connections`
OAuth tokens for connected calendars.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → auth.users |
| provider | VARCHAR(20) | 'google' |
| email | VARCHAR(255) | Calendar account email |
| access_token | TEXT | OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| token_expires_at | TIMESTAMPTZ | Token expiration |
| is_active | BOOLEAN | Connection active |
| auto_moment_enabled | BOOLEAN | Auto-create moments |
| lead_time_minutes | INTEGER | Minutes before event |
| last_sync_at | TIMESTAMPTZ | Last sync time |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

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

#### DELETE `/api/contexts/[id]`
Delete custom context (thoughts move to "Other").

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

#### GET `/api/gems`
List user's thoughts.

**Query Parameters:**
- `status`: Filter by status (`active`, `passive`, `retired`, `graduated`)
- `context_id`: Filter by context
- `is_on_active_list`: Filter by Active List status

**Note:** By default, only returns thoughts with `status IN ('active', 'passive')`. Retired and graduated thoughts require explicit status filter.

#### POST `/api/gems/bulk`
Create multiple thoughts at once.

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

#### PATCH `/api/gems/[id]`
Update a thought.

**Request:**
```typescript
{
  content?: string;
  context_id?: string;
  is_on_active_list?: boolean;
  status?: 'active' | 'passive' | 'retired' | 'graduated';
}
```

#### DELETE `/api/gems/[id]`
Permanently delete a thought (hard delete).

### Moments

#### POST `/api/moments`
Create moment and trigger AI matching.

#### POST `/api/moments/match`
Match thoughts to moment using AI. Searches ALL thoughts with `status IN ('active', 'passive')` across ALL contexts.

### Calendar

#### GET `/api/auth/google-calendar`
OAuth callback for Google Calendar.

#### POST `/api/calendar/sync`
Sync calendar events.

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
| Context Badge | `components/contexts/ContextBadge.tsx` | Display context on cards |
| Context Dropdown | `components/contexts/ContextDropdown.tsx` | Context selection |

### Thought Components
| Component | File | Purpose |
|-----------|------|---------|
| Thought Detail | `components/gems/gem-detail.tsx` | Display with actions |
| Thought Form | `components/gems/gem-form.tsx` | Manual creation |
| Thought Card | `components/gems/gem-card.tsx` | List item display |
| Extract Modal | `components/extract-gems-modal.tsx` | AI extraction wizard |
| Active Badge | `components/gems/ActiveBadge.tsx` | Active List indicator |

### Moment Components
| Component | File | Purpose |
|-----------|------|---------|
| Moment Entry | `components/moments/MomentEntryModal.tsx` | Quick creation |
| Prep Card | `components/moments/PrepCard.tsx` | Matched thoughts display |

### Discovery Components
| Component | File | Purpose |
|-----------|------|---------|
| Discover Card | `components/discover/DiscoverCard.tsx` | Dashboard entry point |
| Context Chip | `components/discover/ContextChip.tsx` | Context selector |
| Discovery Grid | `components/discover/DiscoveryGrid.tsx` | 2x2 grid view |
| Discovery Card | `components/discover/DiscoveryCard.tsx` | Individual card |
| Discovery Detail | `components/discover/DiscoveryDetail.tsx` | Expanded view |
| Save Modal | `components/discover/SaveDiscoveryModal.tsx` | Save flow |

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
getDailyThought(): Promise<Thought | null>  // Only Active List (is_on_active_list = true AND status IN ('active', 'passive'))
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
```

### URL Extractor Service (`lib/url-extractor.ts`)
```typescript
detectUrlType(url: string): 'article' | 'youtube' | 'unknown'
extractArticleContent(url: string): Promise<ExtractedContent>
extractYouTubeTranscript(url: string): Promise<ExtractedContent>
```

### AI Service (`lib/ai/gemini.ts`)
```typescript
extractThoughtsFromContent(content: string, source?: string): Promise<ExtractionResult>
extractThoughtsFromMultimedia(text: string, media: MediaInput[]): Promise<ExtractionResult>
parseScheduleNLP(text: string): Promise<NLPScheduleResult>
matchThoughtsToMoment(description: string, thoughts: Thought[]): Promise<MatchingResponse>
generateDiscoveries(mode: 'curated' | 'directed', contexts: Context[], existingThoughts: Thought[], query?: string): Promise<Discovery[]>
```

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

### Daily Prompt Flow
```
1. Query thoughts with:
   - is_on_active_list = true
   - status IN ('active', 'passive')
2. Select least recently surfaced
3. Generate contextual prompt via AI
4. User marks as applied (optional)
5. Update application_count
6. If application_count >= 5, prompt for graduation
```

### Moment Matching Flow
```
1. User describes upcoming situation
2. Fetch ALL user's thoughts where status IN ('active', 'passive')
3. Send to Gemini for matching
4. Return top 3-5 with relevance scores
5. Display prep card
6. User can mark as helpful after moment
```

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
6. Gemini returns 4 discoveries with metadata
7. Filter out previously skipped content (by URL hash)
8. Store discoveries in database
9. Return grid of 4 cards
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
- Active List limit enforced at database level via trigger

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
