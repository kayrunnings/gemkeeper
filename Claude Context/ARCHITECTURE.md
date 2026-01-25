# ThoughtFolio Architecture

## System Overview

ThoughtFolio is a Next.js application deployed on Vercel, using Supabase for authentication, database, and real-time features. The app integrates with Google Gemini for AI-powered gem extraction and Google Calendar for contextual scheduling.

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

## Database Schema

### Core Tables

#### `profiles`
User profile information, extends Supabase auth.users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| email | text | User email |
| full_name | text | Display name |
| avatar_url | text | Profile image URL |
| created_at | timestamptz | Account creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### `gems`
Core wisdom storage — the heart of ThoughtFolio.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| content | text | The wisdom/insight text |
| source | text | Where it came from (book, podcast, etc.) |
| source_type | text | Category: book, podcast, conversation, experience, other |
| is_active | boolean | Active gems count toward 10-gem limit |
| is_favorite | boolean | Starred for quick access |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### `gem_notes`
User reflections and notes attached to gems.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| gem_id | uuid | Foreign key to gems |
| user_id | uuid | Foreign key to profiles |
| content | text | Note content |
| created_at | timestamptz | Creation timestamp |

#### `daily_prompts`
System-generated prompts for daily wisdom application.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| gem_id | uuid | Foreign key to gems (which gem was surfaced) |
| prompt_text | text | The generated prompt |
| prompt_date | date | Date the prompt is for |
| is_completed | boolean | User marked as applied |
| created_at | timestamptz | Creation timestamp |

### Epic 8 Tables (Scheduling & Moments)

#### `gem_schedules`
Individual scheduling preferences per gem.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| gem_id | uuid | Foreign key to gems |
| user_id | uuid | Foreign key to profiles |
| check_in_time | time | Preferred daily check-in time |
| check_in_days | text[] | Days of week for check-ins |
| is_enabled | boolean | Whether scheduling is active |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### `moments`
User-described upcoming situations for AI matching.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| description | text | User's description of the upcoming situation |
| scheduled_for | timestamptz | When the moment will occur |
| matched_gem_ids | uuid[] | AI-matched relevant gems |
| is_completed | boolean | Moment has passed |
| created_at | timestamptz | Creation timestamp |

#### `calendar_connections`
Google Calendar OAuth connections.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| provider | text | 'google_calendar' |
| access_token | text | Encrypted OAuth access token |
| refresh_token | text | Encrypted OAuth refresh token |
| token_expires_at | timestamptz | Token expiration |
| calendar_id | text | Selected calendar ID |
| is_active | boolean | Connection enabled |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### `calendar_event_cache`
Cached calendar events for matching.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| connection_id | uuid | Foreign key to calendar_connections |
| event_id | text | External calendar event ID |
| title | text | Event title |
| description | text | Event description |
| start_time | timestamptz | Event start |
| end_time | timestamptz | Event end |
| synced_at | timestamptz | Last sync timestamp |

## External Integrations

### Google Gemini API

**Purpose:** AI-powered gem extraction and matching

**Usage:**
- Extract gems from user-provided text (books, articles, notes)
- Match gems to moments based on semantic relevance
- Generate contextual daily prompts

**Configuration:**
- API key stored in Vercel environment variables
- Billing enabled on Google Cloud project (required for quota)

### Google Calendar API

**Purpose:** Calendar-aware gem surfacing

**Usage:**
- OAuth connection for calendar access
- Event syncing for proactive gem suggestions
- Context for moment matching

**Configuration:**
- OAuth credentials in Vercel environment variables
- Callback URL configured in Google Cloud Console

### Supabase Auth

**Purpose:** User authentication

**Features Used:**
- Email/password authentication
- OAuth providers (if enabled)
- Session management
- Row Level Security (RLS) for data isolation

## Data Flows

### Gem Capture Flow

```
1. User enters content (text, URL, or describes experience)
2. If AI extraction enabled:
   a. Content sent to Gemini API
   b. API returns extracted insights
   c. User reviews and selects gems to save
3. Gems saved to database
4. If user has 10+ active gems, prompt to archive
```

### Daily Prompt Flow

```
1. Scheduled job runs (or user opens app)
2. System selects gem based on:
   a. Gems not recently surfaced
   b. User's scheduled check-in preferences
   c. Calendar context (if connected)
3. Gemini generates contextual prompt
4. User receives notification/sees prompt in app
5. User can mark as "applied" with optional reflection
```

### Moment Matching Flow

```
1. User describes upcoming situation (e.g., "difficult conversation with manager")
2. Description sent to Gemini with user's active gems
3. Gemini returns ranked relevant gems with reasoning
4. User sees "prep card" with matched gems
5. After moment, user can log reflection
```

## Security Considerations

- All database tables use Row Level Security (RLS)
- Users can only access their own data
- OAuth tokens encrypted at rest
- API keys stored in environment variables, never in code
- Supabase API keys need periodic rotation (noted as reminder)

## Environment Variables

Required in Vercel:

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Server-side Supabase access |
| GOOGLE_GEMINI_API_KEY | Gemini API access |
| GOOGLE_CLIENT_ID | Calendar OAuth |
| GOOGLE_CLIENT_SECRET | Calendar OAuth |
