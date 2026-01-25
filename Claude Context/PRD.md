# ThoughtFolio Product Requirements Document

## Product Summary

ThoughtFolio is a wisdom accountability partner that helps users capture insights from books, podcasts, and life experiences, then proactively surfaces them for daily application. It combines the capture capabilities of Readwise with contextual surfacing and accountability mechanisms that existing tools lack.

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

**Goals:**
- Apply what they learn, not just consume
- Remember insights at moments they're relevant
- Build better habits through repeated exposure
- Feel like captured wisdom is "working for them"

---

## Core Features

### 1. Gem Capture

**Description:** Users can capture wisdom from various sources.

**Methods:**
- Manual text entry
- AI-assisted extraction from pasted content
- Source attribution (book, podcast, conversation, experience)

**Constraints:**
- Maximum 10 active gems (constraint-based design)
- Must archive to make room for new active gems

**Acceptance Criteria:**
- [ ] User can add gem via text input
- [ ] User can paste content and extract gems via AI
- [ ] User can specify source and source type
- [ ] User sees count of active gems (X/10)
- [ ] User is prompted to archive when at limit

### 2. Gem Management

**Description:** Users can organize, archive, and revisit their gems.

**Features:**
- View all gems (active and archived)
- Archive/unarchive gems
- Favorite gems for quick access
- Edit gem content and source
- Delete gems

**Acceptance Criteria:**
- [ ] User can view active gems separately from archived
- [ ] User can toggle archive status
- [ ] User can favorite/unfavorite gems
- [ ] User can edit gem content
- [ ] User can delete gems (with confirmation)

### 3. Daily Prompts

**Description:** System surfaces gems with contextual prompts for application.

**Features:**
- Daily gem selection based on relevance and recency
- AI-generated contextual prompt
- Mark as "applied" with optional reflection
- History of past prompts

**Acceptance Criteria:**
- [ ] User receives daily prompt with relevant gem
- [ ] Prompt includes actionable suggestion
- [ ] User can mark prompt as completed
- [ ] User can add reflection note
- [ ] User can view prompt history

### 4. AI Gem Extraction (Epic 6)

**Description:** Extract wisdom from user-provided content using AI.

**Features:**
- Paste text from books, articles, transcripts
- AI identifies key insights
- User reviews and selects which to save
- Batch addition to gem collection

**Acceptance Criteria:**
- [ ] User can paste long-form content
- [ ] AI returns list of extracted insights
- [ ] User can select/deselect individual insights
- [ ] Selected insights saved as gems
- [ ] Source attribution preserved

### 5. Gem Notes (Epic 6)

**Description:** Users can add personal notes and reflections to gems.

**Features:**
- Add notes to any gem
- Multiple notes per gem (threaded)
- Timestamped entries
- Notes visible on gem detail view

**Acceptance Criteria:**
- [ ] User can add note to gem
- [ ] User can view all notes on a gem
- [ ] Notes show timestamp
- [ ] User can delete notes

### 6. Individual Gem Scheduling (Epic 8)

**Description:** Users can set custom check-in times per gem.

**Features:**
- Set preferred time for gem surfacing
- Select days of week
- Enable/disable scheduling per gem
- Override global preferences

**Acceptance Criteria:**
- [ ] User can set check-in time per gem
- [ ] User can select specific days
- [ ] User can enable/disable per gem
- [ ] Scheduled gems surface at designated times

### 7. Moments (Epic 8)

**Description:** On-demand gem matching for upcoming situations.

**Features:**
- User describes upcoming situation
- AI matches relevant gems from their collection
- Displays "prep card" with matched gems and reasoning
- Post-moment reflection logging

**Acceptance Criteria:**
- [ ] User can describe moment via text
- [ ] User can set when moment will occur
- [ ] AI returns ranked relevant gems
- [ ] Each match includes relevance explanation
- [ ] User can log reflection after moment

### 8. Google Calendar Integration (Epic 8)

**Description:** Connect calendar for context-aware gem surfacing.

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
- [ ] Gems suggested based on upcoming events

---

## Future Features (Not in Current Scope)

### Multi-Theme System
- Gem-inspired color palettes (Midnight, Obsidian, Amethyst, Ocean, Ruby, Sunrise)
- User-selectable themes
- Consistent design system

### Push Notifications
- Scheduled gem delivery
- Moment reminders
- Requires iOS/Android app

### Sharing & Social
- Share individual gems
- Public wisdom profiles
- Collaborative collections

### Analytics
- Gem application tracking
- Insight patterns over time
- Source effectiveness

---

## Success Metrics

### Engagement
- Daily active users
- Gems captured per user per week
- Prompts marked as "applied"

### Retention
- Day 7 / Day 30 retention
- Active gem count over time
- Return visits per week

### Quality
- Time to first gem capture
- AI extraction acceptance rate
- Moment match relevance ratings

---

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- AI extraction < 5 seconds
- Search results instant (< 200ms)

### Security
- All data isolated by user (RLS)
- OAuth tokens encrypted
- No data shared between users

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatible

### Mobile
- Fully responsive design
- Touch-optimized interactions
- Works offline for viewing (future)
