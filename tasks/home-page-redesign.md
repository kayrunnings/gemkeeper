# Home Page Redesign - Four Quadrants Dashboard

## Overview

A redesigned home page built around four core pillars of knowledge management:

1. **Capture** - Capture knowledge found
2. **Grow** - Find ways to grow knowledge
3. **Apply** - Find ways to apply knowledge
4. **Track** - See historical progress

## Mockup

Interactive HTML mockup with theme switching:
- **Location:** [`/mockup-home-redesign.html`](../mockup-home-redesign.html)
- Open in browser to see the full design with all five themes

---

## Quadrant Details

### 1. Capture Quadrant
Smart AI-powered capture that "just figures it out."

**Features:**
- Smart AI input: Paste anything (quotes, URLs, screenshots, meeting notes) and AI extracts thoughts, notes, and sources automatically
- Quick action buttons: "New Note" and "Quick Thought" for manual entry
- Recent captures list showing recent thoughts and notes with context badges

**Implementation reference:**
- Uses same pattern as `AICaptureModal.tsx` for AI-powered extraction

### 2. Grow Quadrant
AI-powered discovery for expanding knowledge.

**Features:**
- Topic search with AI "Discover" button
- Context chips for quick filtering by existing contexts (Leadership, Focus, Meetings, etc.)
- AI-suggested content (articles, podcasts) based on user's interests
- "Surprise me" button for serendipitous discovery

### 3. Apply Quadrant
Help users actively apply their knowledge.

**Features:**
- **Today's Thought:** Featured thought for the day with graduation progress bar
- Action buttons: "Check In" (apply the thought) and "Shuffle" (get a different one)
- Upcoming moments: Calendar integration showing meetings with relevant gems attached

### 4. Track Quadrant
Visualize progress and motivate continued engagement.

**Features:**
- Streak banner with fire icon and weekly activity dots
- Week stats: Applications count and new captures with trend indicators
- Graduation callout: Thoughts close to graduating (with "1 more!" highlight)
- Compact stats footer: Active gems, graduated gems, total applications

---

## TF Thinks - AI Personal Insights

An AI-powered feature that analyzes user behavior and provides personalized observations.

**Location in UI:** Right below the greeting ("Good afternoon, Sarah")

**Features:**
- AI-generated insights about user patterns and behaviors
- Contextual suggestions linking to relevant thoughts in Active List
- Refresh and dismiss buttons
- Carousel dots for multiple insights (optional - can show single rotating insight instead)

### AI Prompt for TF Thinks

```
You are TF (ThoughtFlow), an AI companion that helps users understand their own thinking and behavior patterns. Analyze the user's data and generate insightful, personalized observations.

## Available Data Sources
- Captured thoughts, notes, and sources (content, contexts, timestamps)
- Application history (when thoughts were applied, to what events)
- Graduation data (which thoughts graduated, how long it took)
- Calendar events (meeting types, frequency, attendees)
- Usage patterns (time of day, frequency, streaks)
- Context preferences (most used contexts, context combinations)

## Insight Categories

### Behavioral Patterns
- When they're most active (time of day, day of week)
- How they prefer to capture (quick thoughts vs long notes)
- Application patterns (which contexts get applied most)

### Psyche & Personality Insights
- What types of content they gravitate toward (leadership, relationships, productivity)
- Learning style indicators (visual, auditory, reading preferences)
- Depth vs breadth tendencies (few deep contexts vs many varied ones)
- Consistency patterns (steady vs burst activity)
- Growth areas they're drawn to vs avoiding

### Forward-Looking Predictions
- Upcoming busy days based on calendar
- Thoughts that might be relevant for scheduled events
- Suggestions based on past patterns
- Graduation predictions

### Content-Based Insights
- Themes emerging across recent captures
- Connections between seemingly unrelated thoughts
- Evolution of thinking over time
- Frequency and depth of engagement with specific topics

## Output Format
Generate 3-5 insights per session, varying between categories. Each insight should:
1. Be conversational and warm, not clinical
2. Reference specific data points when possible
3. Include an actionable element or relevant thought suggestion
4. Be concise (1-2 sentences max)

## Tone
- Observational, not prescriptive ("I noticed..." not "You should...")
- Curious and supportive
- Occasionally playful
- Never judgmental about gaps or inconsistencies

## Example Outputs
- "Tomorrow looks busy — 4 meetings on your calendar. You tend to apply 'Meetings' thoughts 2x more on days like this."
- "You've been capturing a lot about leadership lately. Your 'Relationships' context hasn't seen action in 2 weeks — missing it?"
- "3 of your last 5 captures were late-night saves. Night owl mode activated?"
- "Your 'Focus' thoughts graduate faster than any other context. Something about deep work really clicks for you."
- "You save a lot of quotes but rarely save your own original thoughts. Your insights matter too!"
```

---

## Design System Compliance

The mockup uses CSS variables from `globals.css` to ensure theme compatibility:

- Colors: `--primary`, `--foreground`, `--muted-foreground`, `--success`, `--warning`, `--highlight`
- Glassmorphism: `--glass-card-bg`, `--glass-card-border`, `--glass-card-blur`, `--glass-card-shadow`
- AI gradient: `--ai-gradient-start`, `--ai-gradient-end`, `--ai-glow`

**Supported themes:** Midnight, Obsidian, Amethyst, Cyber, Aurora

---

## Open Questions

1. **TF Thinks carousel:** Do we show multiple insights with dots, or a single insight that rotates/refreshes?
2. **Suggestion card (bulb icon):** Do we show a related thought from Active List alongside the insight, or keep TF thinks cleaner?
3. **Calendar integration:** How deep should the Apply quadrant integrate with external calendars?

---

## Implementation Notes

### Components to Create
- `HomeQuadrant.tsx` - Reusable quadrant container with glassmorphism
- `TFInsight.tsx` - The TF thinks card component
- `SmartCaptureInput.tsx` - The AI-powered paste/capture input
- `StreakBanner.tsx` - Streak display with weekly dots
- `GraduationCallout.tsx` - Thoughts close to graduation

### API Endpoints Needed
- `GET /api/tf/insights` - Generate TF thinks insights
- `GET /api/home/stats` - Aggregated stats for Track quadrant
- `GET /api/calendar/upcoming` - Calendar events for Apply quadrant

### Data Requirements
- User's recent captures (last 30 days)
- Application history
- Streak data
- Calendar integration (if available)
- Graduation progress for active thoughts
