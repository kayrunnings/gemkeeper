# ThoughtFolio Product Requirements Document

## Product Summary

ThoughtFolio is a wisdom accountability partner that helps users capture insights from books, podcasts, articles, videos, and life experiences, then proactively surfaces them for daily application. It combines the capture capabilities of Readwise with contextual surfacing and accountability mechanisms that existing tools lack.

**Tagline:** Thoughts that find you

**Primary URL:** https://gemkeeper.vercel.app (rebrand pending)

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
- "I want wisdom to change my behavior, not just sit in a database"
- "I have insights for different life areas but they all get mixed together"

**Goals:**
- Apply what they learn, not just consume
- Remember insights at moments they're relevant
- Organize wisdom by life domain
- Build better habits through repeated exposure
- Feel like captured wisdom is "working for them"

---

## Core Concepts

### Contexts
User-defined life areas for organizing thoughts. Eight defaults provided (Meetings, Feedback, Conflict, Focus, Health, Relationships, Parenting, Other). Users can create unlimited custom contexts. Each context has a configurable thought limit (default: 20, range: 5-100).

### Thoughts
Captured insights/wisdom. Each thought belongs to one context. Thoughts have a status (active, retired, graduated) and can be on the Active List or Passive.

### Active List
Curated subset of up to 10 thoughts (fixed limit) that appear in daily prompts. Represents "what I'm working on applying right now." Preserves constraint-based accountability while allowing unlimited total thoughts.

### Passive Thoughts
Thoughts not on the Active List. Still searchable, still available for Moments, but excluded from daily prompts. This is the "wisdom library" — always there when needed.

### Moments
User-described upcoming situations that trigger AI matching against ALL thoughts (Active + Passive, all contexts). Returns the most relevant thoughts with explanations.

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

---

### 2. Thought Capture

**Description:** Users can capture wisdom from various sources.

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
| FR-2.6 | New thoughts default to Passive | `is_on_active_list = false` |
| FR-2.7 | AI auto-suggests context based on content | Context pre-populated in form |

**Acceptance Criteria:**
- [ ] User can add thought via text input
- [ ] User can paste content and extract thoughts via AI
- [ ] User can paste URL and extract thoughts
- [ ] User can specify source and source type
- [ ] User can select context from dropdown (shows count)
- [ ] User is blocked when context is at limit
- [ ] New thoughts are Passive by default

---

### 3. Active List Management

**Description:** Users curate up to 10 thoughts for daily prompt surfacing.

**User Story:** As a user, I want to mark specific thoughts as "Active" so they appear in my daily prompts while keeping other thoughts available for Moments.

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-3.1 | Thoughts have `is_on_active_list` boolean | Column exists, default false |
| FR-3.2 | Maximum 10 thoughts on Active List | 11th toggle returns error |
| FR-3.3 | User can toggle Active status | Toggle updates database |
| FR-3.4 | Active status visually distinct | Badge/indicator on cards |
| FR-3.5 | Filter by Active/Passive available | Filter works in UI |

**Acceptance Criteria:**
- [ ] User can toggle any thought's Active status
- [ ] Maximum 10 Active thoughts enforced
- [ ] When at limit, toggling shows error
- [ ] Active status has visual indicator
- [ ] Filter option: All / Active / Passive
- [ ] Active count shown in header ("Active: 7/10")

---

### 4. Thought Management

**Description:** Users can organize, archive, and revisit their thoughts.

**Features:**
- View thoughts by context or all
- Filter by Active/Passive status
- Archive/unarchive thoughts
- Favorite thoughts for quick access
- Edit thought content and source
- Delete thoughts
- Move thoughts between contexts

**Acceptance Criteria:**
- [ ] User can view thoughts filtered by context
- [ ] User can view thoughts filtered by Active/Passive
- [ ] User can toggle archive status
- [ ] User can favorite/unfavorite thoughts
- [ ] User can edit thought content
- [ ] User can change thought's context
- [ ] User can delete thoughts (with confirmation)

---

### 5. Daily Prompts

**Description:** System surfaces Active List thoughts with contextual prompts.

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-5.1 | Daily prompts only surface Active thoughts | Query filters `is_on_active_list = true` |
| FR-5.2 | Selection based on relevance and recency | Least recently surfaced prioritized |
| FR-5.3 | AI generates contextual prompt | Prompt includes actionable suggestion |
| FR-5.4 | User can mark as "applied" | Updates application count |
| FR-5.5 | User can add reflection | Note saved to thought |

**Acceptance Criteria:**
- [ ] User receives daily prompt with Active thought only
- [ ] Prompt includes actionable suggestion
- [ ] User can mark prompt as completed
- [ ] User can add reflection note
- [ ] User can view prompt history

---

### 6. AI Thought Extraction

**Description:** Extract wisdom from user-provided content using AI.

**Features:**
- Paste text from books, articles, transcripts
- Paste URL for automatic extraction
- AI identifies key insights (3-7 per extraction)
- AI suggests context based on content
- User reviews and selects which to save
- Batch addition to thought collection

**Functional Requirements:**

| ID | Requirement | Testable Criteria |
|----|-------------|-------------------|
| FR-6.1 | Accept text content 100-10,000 chars | Validation enforced |
| FR-6.2 | Accept URLs for extraction | URL input field exists |
| FR-6.3 | Detect URL type (article vs YouTube) | Different handlers triggered |
| FR-6.4 | Parse article content with Readability | Text extracted from HTML |
| FR-6.5 | Fetch YouTube transcripts when available | Transcript API returns text |
| FR-6.6 | Show error for inaccessible content | Error message displayed |
| FR-6.7 | Provide manual paste fallback | Text input shown on error |
| FR-6.8 | AI suggests context | Context field pre-populated |
| FR-6.9 | Extraction completes within 10 seconds | Timeout with error |
| FR-6.10 | Rate limit: 10 extractions/day | Usage tracked and enforced |

**Acceptance Criteria:**
- [ ] User can paste long-form content
- [ ] User can paste URL (Substack, Medium, blogs)
- [ ] User can paste YouTube URL
- [ ] AI returns list of extracted insights
- [ ] AI suggests context for each insight
- [ ] User can select/deselect individual insights
- [ ] Selected insights saved as thoughts
- [ ] Source URL preserved
- [ ] Graceful error for paywalled content
- [ ] Manual paste fallback when extraction fails

---

### 7. Thought Notes

**Description:** Users can add personal notes and reflections to thoughts.

**Features:**
- Add notes to any thought
- Multiple notes per thought (threaded)
- Timestamped entries
- Notes visible on thought detail view

**Acceptance Criteria:**
- [ ] User can add note to thought
- [ ] User can view all notes on a thought
- [ ] Notes show timestamp
- [ ] User can delete notes

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
| FR-9.1 | User can describe moment via text | Text field accepts input |
| FR-9.2 | AI searches ALL thoughts (Active + Passive) | Query includes all statuses |
| FR-9.3 | AI searches ALL contexts | No context filter applied |
| FR-9.4 | AI returns ranked relevant thoughts | Top 3-5 with scores |
| FR-9.5 | Each match includes explanation | Relevance reason provided |
| FR-9.6 | Matching completes within 5 seconds | Timeout enforced |

**Acceptance Criteria:**
- [ ] User can describe moment via text
- [ ] User can set when moment will occur
- [ ] AI returns ranked relevant thoughts from ALL contexts
- [ ] AI searches both Active and Passive thoughts
- [ ] Each match includes relevance explanation
- [ ] User can log reflection after moment

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
- Public wisdom profiles
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

### Retention
- Day 7 / Day 30 retention
- Active List utilization (target: >80% have 5+ Active)
- Return visits per week

### Quality
- Time to first thought capture
- AI extraction acceptance rate (target: >70%)
- URL extraction success rate (target: >85%)
- Moment match relevance ratings

---

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- AI extraction < 5 seconds (text), < 10 seconds (URL)
- Search results instant (< 200ms)
- URL fetch < 5 seconds

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
