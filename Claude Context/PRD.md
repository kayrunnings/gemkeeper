# ThoughtFolio Product Requirements Document

## Product Summary

ThoughtFolio is a knowledge accountability partner that helps users capture insights from books, podcasts, articles, videos, and life experiences, then proactively surfaces them for daily application. It combines the capture capabilities of Readwise with contextual surfacing and accountability mechanisms that existing tools lack.

**Tagline:** Thoughts that find you

**Primary URL:** https://gemkeeper.vercel.app (rebrand pending)

**Last Updated:** January 2026

**Feature Status:** All core features complete (Contexts, Active List, Daily Check-in, Moments, Discovery, Calendar Integration, Graduation System)

---

## Target User

### Primary Persona: The Intentional Learner

**Demographics:**
- 25-45 years old
- Knowledge workers, entrepreneurs, lifelong learners
- Consumes books, podcasts, articles regularly
- Values personal growth and self-improvement

**Pain Points:**
- "I highlight books but never revisit the highlights"
- "I have great insights but forget them when I need them"
- "Note apps become graveyards of good intentions"
- "I want my knowledge to change my behavior, not just sit in a database"
- "I have insights for different life areas but they all get mixed together"

**Goals:**
- Apply what they learn, not just consume
- Remember insights at moments they're relevant
- Organize knowledge by life domain
- Build better habits through repeated exposure
- Feel like captured knowledge is "working for them"

---

## Core Concepts

### Contexts
User-defined life areas for organizing thoughts. Eight defaults provided (Meetings, Feedback, Conflict, Focus, Health, Relationships, Parenting, Other). Users can create unlimited custom contexts. Each context has a configurable thought limit (default: 20, range: 5-100).

### Thoughts
Captured insights/knowledge. Each thought belongs to one context. Thoughts have a status:

| Status | Description | Visible In |
|--------|-------------|------------|
| `active` | Available for use | Thoughts page |
| `passive` | Available but dormant | Thoughts page (filtered) |
| `retired` | Archived, kept for historical record | Retired page |
| `graduated` | Applied 5+ times, mastered | ThoughtBank |

### Active List
Curated subset of up to 10 thoughts (fixed limit) that are surfaced in the Daily Check-in. Controlled by `is_on_active_list` boolean, separate from status. Only thoughts with `status IN ('active', 'passive')` can be on the Active List. Represents "what I'm working on applying right now."

### Passive Thoughts
Thoughts with `is_on_active_list = false`. Still searchable, still available for Moments, but excluded from Daily Check-in. This is the "knowledge library" — always there when needed.

### Retired Thoughts
Thoughts the user has archived. Kept for historical reference but excluded from Thoughts page, Moments, and Daily Check-in. Visible on dedicated Retired page. Can be restored to active status.

### Graduated Thoughts
Thoughts applied 5+ times. Automatically moved to ThoughtBank as "mastered knowledge." Excluded from Daily Check-in but celebrated as achievements.

### Moments
User-described upcoming situations that trigger AI matching against ALL thoughts with `status IN ('active', 'passive')` across ALL contexts. Returns the most relevant thoughts with explanations.

---

## Core Features

### 1. Custom Contexts

**Description:** Users can create and manage contexts to organize thoughts by life area.

**User Story:** As a user, I want to create custom contexts so I can organize thoughts by my own life areas.

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-1.1 | System shall provide 8 default contexts | On new user signup, 8 contexts exist |
| FR-1.2 | User shall be able to create custom contexts | POST creates new context record |
| FR-1.3 | User shall be able to edit context name and color | PUT updates context record |
| FR-1.4 | User shall be able to delete custom contexts | DELETE removes context, thoughts move to "Other" |
| FR-1.5 | System shall prevent deletion of default contexts | DELETE on default returns 403 |
| FR-1.6 | Context names shall be unique per user | Duplicate name returns error |
| FR-1.7 | Context names shall be max 50 characters | Longer names rejected |
| FR-1.8 | Each context shall have configurable thought limit | Default 20, range 5-100 |

**Acceptance Criteria:**
- [ ] User can view all contexts in Settings
- [ ] Default contexts are pre-populated for new users
- [ ] User can add custom contexts (name required, optional color)
- [ ] User can edit context name/color/limit
- [ ] User can delete custom contexts (thoughts move to "Other")
- [ ] User cannot delete default contexts
- [ ] Context appears on thought cards and in dropdowns
- [ ] Context color on cards matches color in Settings

---

### 2. Thought Capture

**Description:** Users can capture knowledge from various sources.

**Methods:**
- Manual text entry
- AI-assisted extraction from pasted content
- AI-assisted extraction from URLs (articles, YouTube)
- Source attribution (book, podcast, article, video, conversation, experience)

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-2.1 | User can add thought via text input | Form submission creates thought |
| FR-2.2 | User can paste content and extract via AI | AI returns extracted insights |
| FR-2.3 | User can extract from URL | URL parsed, content extracted |
| FR-2.4 | User can specify source and context | Fields saved to database |
| FR-2.5 | System enforces per-context limits | Error when context is full |
| FR-2.6 | New thoughts default to Passive | `is_on_active_list = false`, `status = 'active'` |
| FR-2.7 | AI auto-suggests context based on content | Context pre-populated in form |

**Acceptance Criteria:**
- [ ] User can add thought via text input
- [ ] User can paste content and extract thoughts via AI
- [ ] User can paste URL and extract thoughts (From URL tab)
- [ ] User can paste YouTube URL and extract from transcript
- [ ] User can specify source and source type
- [ ] User can select context from dropdown (shows count)
- [ ] User is blocked when context is at limit
- [ ] New thoughts are Passive by default (not on Active List)

---

### 3. Active List Management

**Description:** Users curate up to 10 thoughts (configurable via Focus Mode) for Daily Check-in surfacing.

**User Story:** As a user, I want to mark specific thoughts as "Active" so they appear in my Daily Check-in while keeping other thoughts available for Moments.

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-3.1 | Thoughts have `is_on_active_list` boolean | Column exists, default false |
| FR-3.2 | Maximum thoughts on Active List (default 10, configurable 10-25) | Toggle returns error at limit |
| FR-3.3 | User can toggle Active status from card | Toggle updates database |
| FR-3.4 | User can toggle Active status from detail page | Toggle updates database |
| FR-3.5 | Active status visually distinct | Star/badge indicator on cards |
| FR-3.6 | Filter by Active/Passive available | Filter tabs work in UI |
| FR-3.7 | Only active/passive thoughts can be on Active List | Retired/graduated excluded |
| FR-3.8 | Focus Mode enables expanded Active List limit | Profile setting controls limit |
| FR-3.9 | Active List limit configurable between 10-25 | Slider in Settings controls limit |

**Acceptance Criteria:**
- [x] User can toggle any thought's Active status from card (star icon)
- [x] User can toggle Active status from thought detail page
- [x] Maximum Active thoughts enforced with error toast
- [x] Active status has visual indicator (filled star = active)
- [x] Filter tabs: All / Active List / Passive
- [x] Active count shown in header ("Active: 7/10")
- [x] Cannot add retired/graduated thoughts to Active List
- [x] Focus Mode toggle in Settings to enable expanded limit
- [x] Active List limit slider (10-25) when Focus Mode enabled

---

### 4. Thought Management

**Description:** Users can organize, retire, and revisit their thoughts.

**Features:**
- View thoughts by context or all
- Filter by Active/Passive status
- Retire thoughts (move to Retired page)
- Restore retired thoughts
- Delete thoughts permanently
- Edit thought content and source
- Move thoughts between contexts

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-4.1 | User can filter thoughts by context | Filter shows only matching thoughts |
| FR-4.2 | User can filter thoughts by Active/Passive | Filter tabs work |
| FR-4.3 | User can retire thought | Status set to 'retired', retired_at set |
| FR-4.4 | User can permanently delete thought | Row removed from database |
| FR-4.5 | User can view retired thoughts | Retired page shows retired thoughts |
| FR-4.6 | User can restore retired thought | Status set to 'active', retired_at cleared |
| FR-4.7 | User can edit thought content | Content updated in database |
| FR-4.8 | User can change thought context | Context updated in database |

**Acceptance Criteria:**
- [ ] User can view thoughts filtered by context
- [ ] User can view thoughts filtered by Active/Passive
- [ ] User can retire thought (moves to Retired page)
- [ ] User can delete thought permanently (with confirmation)
- [ ] Retired page accessible from navigation
- [ ] User can restore retired thoughts
- [ ] User can edit thought content
- [ ] User can change thought's context

---

### 5. Daily Check-in

**Description:** System surfaces one Active List thought per day. User checks in once to reflect on whether they applied it.

**User Story:** As a user, I want to check in once daily on a surfaced thought so I can track my progress in applying knowledge without unnecessary friction.

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-5.1 | Daily check-in only surfaces Active thoughts | Query filters `is_on_active_list = true` AND `status IN ('active', 'passive')` |
| FR-5.2 | Selection based on recency | Least recently surfaced prioritized |
| FR-5.3 | User can mark as "applied" (Yes) | Increments `application_count`, updates `last_applied_at` |
| FR-5.4 | User can mark as "not applied" (No) | Increments `skip_count` |
| FR-5.5 | User can add optional reflection | Note saved with check-in record |
| FR-5.6 | One check-in per day enforced | Subsequent visits show "already checked in" state |
| FR-5.7 | User can disable daily check-in card | Profile setting `checkin_enabled` hides dashboard card |

**Acceptance Criteria:**
- [x] User sees daily thought on dashboard with "Check In" button
- [x] User can check in once per day (Yes/No)
- [x] User can add optional reflection note
- [x] "Yes" increments application count toward graduation
- [x] "No" increments skip count (21+ skips triggers stale prompt)
- [x] After check-in, dashboard shows "completed" state
- [ ] User can view check-in history

**Dashboard "Today's Thought" Card States:**

| State | Condition | Display |
|-------|-----------|---------|
| Thought available | Active List thought found | Shows thought with context badge, content, source, "Check In" button |
| Already checked in | User completed check-in today | "You've completed your check-in for today!" |
| No Active thoughts | Active List is empty | "No thoughts on your Active List yet" + add button |

**Check-in Page (`/checkin`) States:**

| State | Condition | Display |
|-------|-----------|---------|
| Prompt | Thought ready for check-in | Shows thought, Yes/No buttons, optional reflection |
| Stale | Thought skipped 21+ times | "Keep or Release?" prompt |
| Success | User answered Yes | Celebration, application count |
| Skip | User answered No | Encouragement, "tomorrow is another chance" |
| Already done | Already checked in today | "All done for today!" |

**Note:** The previous two-step design (morning "Daily Prompt" + evening "Check-in") has been simplified to this single interaction. See DECISIONS.md for rationale.

---

### 6. AI Thought Extraction

**Description:** Extract knowledge from user-provided content using AI.

**Features:**
- Paste text from books, articles, transcripts
- Paste URL for automatic extraction (articles, YouTube)
- AI identifies key insights (3-7 per extraction)
- AI suggests context based on content
- User reviews and selects which to save
- Batch addition to thought collection

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-6.1 | Accept text content 100-10,000 chars | Validation enforced |
| FR-6.2 | Accept URLs for extraction | URL input tab exists |
| FR-6.3 | Detect URL type (article vs YouTube) | Different handlers triggered |
| FR-6.4 | Parse article content with Readability | Text extracted from HTML |
| FR-6.5 | Fetch YouTube transcripts when available | Transcript API returns text |
| FR-6.6 | Show error for inaccessible content | Error message displayed |
| FR-6.7 | Provide manual paste fallback | Text input shown on error |
| FR-6.8 | AI suggests context | Context field pre-populated |
| FR-6.9 | Extraction completes within 10 seconds | Timeout with error |
| FR-6.10 | Rate limit: 10 extractions/day | Usage tracked and enforced |

**Acceptance Criteria:**
- [ ] User can paste long-form content (Paste Text tab)
- [ ] User can paste URL (From URL tab)
- [ ] User can paste YouTube URL
- [ ] AI returns list of extracted insights
- [ ] AI suggests context for each insight
- [ ] User can select/deselect individual insights
- [ ] Selected insights saved as thoughts
- [ ] Source URL preserved
- [ ] Graceful error for paywalled content
- [ ] Manual paste fallback when extraction fails

---

### 7. Thought Reflections

**Description:** Users can add personal reflections to individual thoughts (attached notes).

**Features:**
- Add reflections to any thought
- Multiple reflections per thought (threaded)
- Timestamped entries
- Reflections visible on thought detail view

**Acceptance Criteria:**
- [x] User can add reflection to thought
- [x] User can view all reflections on a thought
- [x] Reflections show timestamp
- [x] User can delete reflections

**Note:** This is different from the standalone Notes feature (Section 7.5). Thought reflections are attached to specific thoughts, while Notes are independent long-form documents.

---

### 7.5. Notes System

**Description:** Standalone long-form notes for capturing detailed content, separate from atomic thoughts.

**User Story:** As a user, I want to write longer notes that aren't limited to 200 characters so I can capture detailed information and later extract key thoughts from them.

**Features:**
- Create, read, update, delete notes
- Markdown content support (no character limit)
- Tag notes for organization
- Mark notes as favorites
- Organize notes into folders
- Extract thoughts from notes (AI-powered)

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-7.5.1 | User can create notes with title and content | Note saved to database |
| FR-7.5.2 | User can add tags to notes | Tags saved as TEXT[] |
| FR-7.5.3 | User can mark notes as favorites | is_favorite toggle works |
| FR-7.5.4 | User can organize notes into folders | Folder assignment persists |
| FR-7.5.5 | User can extract thoughts from notes | AI returns extracted insights |
| FR-7.5.6 | Extracted thoughts can be saved to thought library | Thoughts created with note as source |

**Acceptance Criteria:**
- [x] User can create note with title and markdown content
- [x] User can edit existing notes
- [x] User can delete notes
- [x] User can tag notes
- [x] User can mark notes as favorites
- [x] User can organize notes into folders
- [x] User can extract thoughts from note content via AI
- [x] Extracted thoughts preserve note as source

**Relationship to Thoughts:**
- Notes are standalone documents (unlimited length)
- Thoughts are atomic insights (max 200 chars)
- Users can extract multiple thoughts from a single note
- This creates a "note → thoughts" workflow complementing "content → thoughts"

---

### 8. Individual Thought Scheduling (Epic 8)

**Description:** Users can set custom check-in times per thought.

**Features:**
- Set preferred time for thought surfacing
- Select days of week
- Enable/disable scheduling per thought
- Override global preferences

**Acceptance Criteria:**
- [ ] User can set check-in time per thought
- [ ] User can select specific days
- [ ] User can enable/disable per thought
- [ ] Scheduled thoughts surface at designated times

---

### 9. Moments (Epic 8)

**Description:** On-demand thought matching for upcoming situations.

**User Story:** As a user, I want to describe an upcoming situation so I can receive relevant thoughts to prepare for it.

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-9.1 | User can describe moment via text | Text field accepts input (max 500 chars) |
| FR-9.2 | AI searches thoughts with status IN ('active', 'passive') | Query includes active and passive only |
| FR-9.3 | AI searches ALL contexts | No context filter applied |
| FR-9.4 | AI returns ranked relevant thoughts | Top 5 max with scores ≥ 0.5 |
| FR-9.5 | Each match includes explanation | Relevance reason provided |
| FR-9.6 | Matching completes within 5 seconds | Timeout enforced |
| FR-9.7 | Rate limiting enforced | 20 matches per hour per user |
| FR-9.8 | Keyboard shortcut available | Cmd+M / Ctrl+M opens modal |

**Implementation Constants:**
- `MAX_MOMENT_DESCRIPTION_LENGTH = 500`
- `MAX_GEMS_TO_MATCH = 5`
- `MIN_RELEVANCE_SCORE = 0.5`
- `MATCHING_TIMEOUT_MS = 5000`
- Rate limit: 20 matches/hour/user

**Acceptance Criteria:**
- [x] User can describe moment via text (max 500 chars)
- [x] User can set when moment will occur (calendar integration)
- [x] AI returns ranked relevant thoughts from ALL contexts
- [x] AI searches both Active and Passive thoughts (not retired/graduated)
- [x] Each match includes relevance explanation
- [x] User can log reflection after moment
- [x] Keyboard shortcut (Cmd+M / Ctrl+M) opens moment modal
- [x] Moments history page with filter by source (all/manual/calendar)
- [x] User can give feedback on matched thoughts (helpful/not helpful)

**UI States:**
- `idle` — Ready for input
- `loading` — AI matching in progress (shimmer animation)
- `success` — Matches found, redirect to prep card
- `empty` — No matches found, encouraging message
- `error` — Error occurred, retry option

---

### 10. Google Calendar Integration (Epic 8)

**Description:** Connect calendar for context-aware thought surfacing.

**Features:**
- OAuth connection to Google Calendar
- Event syncing for proactive suggestions
- Calendar-aware moment suggestions
- Privacy controls for sync scope

**Acceptance Criteria:**
- [ ] User can connect Google Calendar
- [ ] User can select which calendar(s) to sync
- [ ] Events cached for matching
- [ ] User can disconnect calendar
- [ ] Thoughts suggested based on upcoming events

---

### 11. Discover Something New! (Epic 12)

**Description:** AI-powered content discovery that finds relevant knowledge from the web based on user's contexts and interests, helping users expand their thought library with curated external content.

**User Story:** As a user, I want ThoughtFolio to discover new insights for me based on my contexts and interests so I can expand my knowledge library without having to search manually.

**Core Concept:**
- Dashboard card offers three discovery paths: free-text search, context selection, or "Surprise Me"
- Gemini searches the web for relevant articles/insights
- Returns 4 discoveries per session as a browsable grid
- User can save discoveries as thoughts (with source) or skip
- Two daily sessions: 4 curated + 4 directed = 8 max discoveries per day

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-11.1 | Dashboard displays "Discover Something New!" card | Card visible on dashboard |
| FR-11.2 | User can enter free-text topic for discovery | Text input accepts query, triggers search |
| FR-11.3 | User can select context chip for focused discovery | Context chip triggers context-specific search |
| FR-11.4 | User can click "Surprise Me" for curated mix | Button triggers multi-context discovery |
| FR-11.5 | System returns 4 discoveries per session | Grid displays 4 cards |
| FR-11.6 | Each discovery includes: thought, source, summary, relevance | All fields populated in response |
| FR-11.7 | Discoveries labeled as "Trending" or "Evergreen" | Badge displayed on each card |
| FR-11.8 | User can view expanded discovery detail | Click opens detail view |
| FR-11.9 | User can save discovery as thought | Creates thought record with source |
| FR-11.10 | User can edit thought text before saving | Text field is editable |
| FR-11.11 | User can change suggested context before saving | Context dropdown available |
| FR-11.12 | User can create new context during save | "Create context" option available |
| FR-11.13 | User can optionally add to Active List on save | Checkbox available |
| FR-11.14 | User can optionally save article as Note | Checkbox available |
| FR-11.15 | User can skip discovery ("Not for me") | Card greys out, no penalty |
| FR-11.16 | Skipped content tracked to avoid similar suggestions | Hash stored in database |
| FR-11.17 | Curated session limit: 4 discoveries/day | Counter enforced server-side |
| FR-11.18 | Directed session limit: 4 discoveries/day | Counter enforced server-side |
| FR-11.19 | Limits reset at midnight user's timezone | Reset logic uses profile timezone |
| FR-11.20 | Context rotation prioritizes sparse contexts | Algorithm weights by thought count |
| FR-11.21 | 0-thought contexts occasionally included | Exploration slot in rotation |
| FR-11.22 | Fresh discoveries generated daily | No persistence of unseen discoveries |
| FR-11.23 | Empty state shown when both sessions used | Message with "come back tomorrow" |
| FR-11.24 | Bootstrap state guides new users | Prompts to add contexts/thoughts |
| FR-11.25 | User can bookmark discovery for later | Bookmark icon saves to reading list |
| FR-11.26 | Saved discoveries accessible via Saved tab | Tab shows bookmarked discoveries |
| FR-11.27 | User can remove discovery from saved list | Remove button unsaves discovery |
| FR-11.28 | Tabbed interface: For You, Explore, Saved | Navigation between discovery modes |

**Discovery Response Schema:**

```typescript
interface Discovery {
  id: string;
  thought_content: string;        // Extracted insight (≤200 chars)
  source_title: string;           // Article/video name
  source_url: string;             // Link to original
  source_type: 'article' | 'video' | 'research' | 'blog';
  article_summary: string;        // 2-3 sentence summary
  relevance_reason: string;       // Why this for user's context
  content_type: 'trending' | 'evergreen';
  suggested_context_id: string;   // Best-fit context
  suggested_context_name: string;
}
```

**Acceptance Criteria:**
- [x] Dashboard shows "Discover Something New!" card
- [x] User can type any topic and get 4 relevant discoveries
- [x] User can tap context chip and get 4 discoveries for that context
- [x] User can tap "Surprise Me" and get 4 curated discoveries
- [x] Grid displays 4 discovery cards with preview info
- [x] Tapping card opens expanded view with full detail
- [x] User can save discovery with editable thought text
- [x] User can change context before saving
- [x] User can create new context during save flow
- [x] User can skip discoveries without penalty
- [x] Skipped discoveries don't reappear
- [x] Daily limits enforced (4 curated + 4 directed)
- [x] Used sessions show "come back tomorrow" state
- [x] New users see bootstrap guidance
- [x] Mix of trending and evergreen content shown
- [x] Tabbed interface with For You, Explore, Saved tabs
- [x] User can bookmark discoveries for later processing
- [x] User can view saved discoveries in Saved tab
- [x] User can remove discoveries from saved list

---

## Future Features (Not in Current Scope)

### Multi-Theme System
- Thought-inspired color palettes
- User-selectable themes
- Consistent design system

### Push Notifications
- Scheduled thought delivery
- Moment reminders
- Requires iOS/Android app

### Sharing & Social
- Share individual thoughts
- Public knowledge profiles
- Collaborative collections

### Analytics
- Thought application tracking
- Insight patterns over time
- Source effectiveness

### Additional Integrations
- Browser extension for capture
- Kindle highlights import
- Podcast app integration

---

## Success Metrics

### Engagement
- Daily active users
- Thoughts captured per user per week
- Prompts marked as "applied"
- Contexts created per user (target: >2 custom)
- URL extractions per user
- Discoveries saved per user (target: >2/week)

### Retention
- Day 7 / Day 30 retention
- Active List utilization (target: >80% have 5+ Active)
- Return visits per week
- Discovery feature engagement (target: >50% try within first week)

### Quality
- Time to first thought capture
- AI extraction acceptance rate (target: >70%)
- URL extraction success rate (target: >85%)
- Moment match relevance ratings
- Discovery save rate (target: >25% of shown discoveries)

---

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- AI extraction < 5 seconds (text), < 10 seconds (URL)
- Search results instant (< 200ms)
- URL fetch < 5 seconds
- Discovery generation < 8 seconds

### Security
- All data isolated by user (RLS)
- OAuth tokens encrypted
- No data shared between users
- API keys in environment variables only

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatible

### Mobile
- Fully responsive design
- Touch-optimized interactions
- Works offline for viewing (future)

---

## Technical Constraints

### Rate Limits
- AI extractions: 10 per day per user
- AI tokens: 50,000 per day per user
- Moment matches: 20 per hour per user
- Discoveries: 4 curated + 4 directed per day per user

### Content Limits
- Thought content: max 200 characters
- Context name: max 50 characters
- Extraction input: 100-10,000 characters
- Notes: max 2,000 characters

### External Dependencies
- Google Gemini API for AI features
- Google Calendar API for calendar integration
- Mozilla Readability for article parsing
- youtube-transcript for YouTube content
- Gemini grounding for discovery web search
