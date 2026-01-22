# TASKS.md - Epic 8: Individual Gem Schedules & Moment-Based Surfacing

## Overview

Enhance GemKeeper with two major features:
1. **Individual Gem Schedules** - Each gem can have custom check-in times (cron-like flexibility)
2. **Moments** - On-demand situational gem surfacing (manual + calendar-triggered)

**Linear Epic:** KAY-52
**GitHub Repo:** kayrunnings/gemkeeper
**Deployed URL:** gemkeeper.vercel.app
**Supabase Project:** GemKeeper

---

## Pre-Build Checklist

- [ ] Run `epic8-schema.sql` in Supabase SQL Editor
- [ ] Verify all 5 tables exist: `gem_schedules`, `moments`, `moment_gems`, `calendar_connections`, `calendar_events_cache`
- [ ] Verify RLS policies are active
- [ ] Google OAuth credentials available (for calendar integration)
- [ ] Microsoft OAuth credentials available (for Outlook integration)

---

## Build Order

Execute tasks in this order (dependencies noted):

1. **8.1** - Individual Gem Schedules (foundation, no dependencies)
2. **8.2** - Moment Entry Modal (UI entry point)
3. **8.4** - AI Gem Matching (core moment logic)
4. **8.5** - Prep Card Display (moment visualization)
5. **8.3** - Calendar Integration (enhancement, can be parallel with 8.4/8.5)

---

## Task 8.1: Individual Gem Check-in Schedules (KAY-53)

### 8.1.1 TypeScript Types
**File:** `types/schedules.ts`

```typescript
export interface GemSchedule {
  id: string;
  gem_id: string;
  user_id: string;
  cron_expression: string;
  human_readable: string;
  timezone: string;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week: number[] | null;  // 0=Sun, 6=Sat
  time_of_day: string | null;     // "14:00:00"
  day_of_month: number | null;
  is_active: boolean;
  next_trigger_at: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInput {
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week?: number[];
  time_of_day: string;          // "14:00"
  day_of_month?: number;
  timezone?: string;
}

export interface NLPScheduleResult {
  cron_expression: string;
  human_readable: string;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week: number[] | null;
  time_of_day: string;
  day_of_month: number | null;
  confidence: number;
}
```

### 8.1.2 Schedule Service Functions
**File:** `lib/schedules.ts`

```typescript
import { createClient } from '@/lib/supabase/client';
import type { GemSchedule, ScheduleInput } from '@/types/schedules';

// CRUD operations
export async function createGemSchedule(gemId: string, input: ScheduleInput): Promise<GemSchedule>;
export async function getGemSchedules(gemId: string): Promise<GemSchedule[]>;
export async function updateGemSchedule(scheduleId: string, updates: Partial<ScheduleInput>): Promise<GemSchedule>;
export async function deleteGemSchedule(scheduleId: string): Promise<void>;
export async function toggleScheduleActive(scheduleId: string, isActive: boolean): Promise<void>;

// Cron generation
export function generateCronExpression(input: ScheduleInput): string;
export function generateHumanReadable(input: ScheduleInput): string;
export function calculateNextTrigger(cronExpression: string, timezone: string): Date;
```

**Implementation Notes:**
- Use `cron-parser` npm package for cron validation and next trigger calculation
- Install: `npm install cron-parser`
- Store timezone per schedule (default to user's profile timezone)

### 8.1.3 NLP Schedule Parser API Route
**File:** `app/api/schedules/parse/route.ts`

```typescript
// POST /api/schedules/parse
// Body: { text: "every Tuesday at 2pm" }
// Response: { result: NLPScheduleResult }

// Use Gemini API to parse natural language into schedule components
// Prompt template provided below
```

**Gemini Prompt:**
```
Parse this natural language schedule into a structured format.

INPUT: "{user_input}"

Return JSON with:
- cron_expression: standard cron format (minute hour day month weekday)
- human_readable: friendly text like "Every Tuesday at 2:00 PM"
- schedule_type: "daily" | "weekly" | "monthly" | "custom"
- days_of_week: array of 0-6 (0=Sunday) or null
- time_of_day: "HH:MM" 24-hour format
- day_of_month: 1-31 or -1 for last day or null
- confidence: 0.0-1.0

Examples:
"every tuesday at 2pm" → {"cron_expression":"0 14 * * 2","human_readable":"Every Tuesday at 2:00 PM","schedule_type":"weekly","days_of_week":[2],"time_of_day":"14:00","day_of_month":null,"confidence":0.95}
"weekday mornings at 8" → {"cron_expression":"0 8 * * 1-5","human_readable":"Every weekday at 8:00 AM","schedule_type":"weekly","days_of_week":[1,2,3,4,5],"time_of_day":"08:00","day_of_month":null,"confidence":0.9}
```

### 8.1.4 Visual Schedule Picker Component
**File:** `components/schedules/SchedulePicker.tsx`

Props:
```typescript
interface SchedulePickerProps {
  gemId: string;
  existingSchedules: GemSchedule[];
  onScheduleCreate: (schedule: GemSchedule) => void;
  onScheduleUpdate: (schedule: GemSchedule) => void;
  onScheduleDelete: (scheduleId: string) => void;
}
```

UI Elements:
- [ ] Tabs: "Visual" | "Natural Language"
- [ ] Visual tab:
  - Frequency selector: Daily / Specific Days / Monthly
  - Day multi-select chips (Mon-Sun)
  - Time picker (15-min increments)
  - Monthly: day-of-month dropdown (1-31, Last day)
- [ ] NLP tab:
  - Large text input with placeholder
  - "Parse" button
  - Parsed result preview with confidence indicator
  - "Confirm" / "Edit Manually" actions
- [ ] Schedule preview: "Every Tuesday at 2:00 PM"
- [ ] Save button

### 8.1.5 Gem Detail View Integration
**File:** `components/gems/GemDetail.tsx` (update existing)

Add to gem detail view:
- [ ] "Schedule" accordion section
- [ ] List of active schedules as badges
- [ ] "Add Schedule" button opens SchedulePicker modal
- [ ] Each schedule has edit/delete/toggle actions
- [ ] "Next check-in" display showing soonest trigger time

### 8.1.6 Gem Card Schedule Badge
**File:** `components/gems/GemCard.tsx` (update existing)

- [ ] If gem has active schedules, show small clock icon + count
- [ ] Hover tooltip shows human-readable schedule list

### 8.1.7 Tests for Task 8.1

**File:** `__tests__/schedules/cron.test.ts`
```typescript
describe('generateCronExpression', () => {
  it('generates daily cron', () => {
    const input = { schedule_type: 'daily', time_of_day: '08:00' };
    expect(generateCronExpression(input)).toBe('0 8 * * *');
  });

  it('generates weekly cron for specific days', () => {
    const input = { schedule_type: 'weekly', days_of_week: [1, 3, 5], time_of_day: '14:00' };
    expect(generateCronExpression(input)).toBe('0 14 * * 1,3,5');
  });

  it('generates monthly cron for last day', () => {
    const input = { schedule_type: 'monthly', day_of_month: -1, time_of_day: '09:00' };
    expect(generateCronExpression(input)).toBe('0 9 L * *');
  });
});

describe('generateHumanReadable', () => {
  it('formats daily schedules', () => {
    const input = { schedule_type: 'daily', time_of_day: '08:00' };
    expect(generateHumanReadable(input)).toBe('Every day at 8:00 AM');
  });

  it('formats weekday schedules', () => {
    const input = { schedule_type: 'weekly', days_of_week: [1, 2, 3, 4, 5], time_of_day: '09:00' };
    expect(generateHumanReadable(input)).toBe('Weekdays at 9:00 AM');
  });
});
```

**File:** `__tests__/schedules/api.test.ts`
```typescript
describe('POST /api/schedules/parse', () => {
  it('parses "every tuesday at 2pm"', async () => {
    const response = await fetch('/api/schedules/parse', {
      method: 'POST',
      body: JSON.stringify({ text: 'every tuesday at 2pm' }),
    });
    const data = await response.json();
    expect(data.result.cron_expression).toBe('0 14 * * 2');
    expect(data.result.confidence).toBeGreaterThan(0.8);
  });

  it('returns low confidence for ambiguous input', async () => {
    const response = await fetch('/api/schedules/parse', {
      method: 'POST',
      body: JSON.stringify({ text: 'sometimes in the morning' }),
    });
    const data = await response.json();
    expect(data.result.confidence).toBeLessThan(0.7);
  });
});
```

**File:** `__tests__/schedules/components.test.tsx`
```typescript
describe('SchedulePicker', () => {
  it('renders visual picker by default', () => {
    render(<SchedulePicker gemId="123" existingSchedules={[]} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('switches to NLP mode', async () => {
    render(<SchedulePicker gemId="123" existingSchedules={[]} />);
    await userEvent.click(screen.getByText('Natural Language'));
    expect(screen.getByPlaceholderText(/every tuesday/i)).toBeInTheDocument();
  });

  it('calls onScheduleCreate when saving', async () => {
    const onCreate = jest.fn();
    render(<SchedulePicker gemId="123" existingSchedules={[]} onScheduleCreate={onCreate} />);
    // Fill form and submit
    await userEvent.click(screen.getByText('Save Schedule'));
    expect(onCreate).toHaveBeenCalled();
  });
});
```

---

## Task 8.2: Moment Entry Modal (KAY-54)

### 8.2.1 TypeScript Types
**File:** `types/moments.ts`

```typescript
export interface Moment {
  id: string;
  user_id: string;
  description: string;
  source: 'manual' | 'calendar';
  calendar_event_id: string | null;
  calendar_event_title: string | null;
  calendar_event_start: string | null;
  gems_matched_count: number;
  ai_processing_time_ms: number | null;
  status: 'active' | 'completed' | 'dismissed';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MomentGem {
  id: string;
  moment_id: string;
  gem_id: string;
  user_id: string;
  relevance_score: number;
  relevance_reason: string | null;
  was_helpful: boolean | null;
  was_reviewed: boolean;
  created_at: string;
  gem?: Gem;  // Joined gem data
}

export interface MomentWithGems extends Moment {
  matched_gems: MomentGem[];
}
```

### 8.2.2 Moment Service Functions
**File:** `lib/moments.ts`

```typescript
export async function createMoment(description: string, source?: 'manual' | 'calendar', calendarData?: CalendarEventData): Promise<Moment>;
export async function getMoment(momentId: string): Promise<MomentWithGems | null>;
export async function getRecentMoments(limit?: number): Promise<Moment[]>;
export async function updateMomentStatus(momentId: string, status: 'active' | 'completed' | 'dismissed'): Promise<void>;
export async function recordMomentGemFeedback(momentGemId: string, wasHelpful: boolean): Promise<void>;
export async function markGemReviewed(momentGemId: string): Promise<void>;
```

### 8.2.3 Moment Entry Modal Component
**File:** `components/moments/MomentEntryModal.tsx`

Props:
```typescript
interface MomentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMomentCreated: (moment: MomentWithGems) => void;
}
```

States:
- `idle` - Initial state, input visible
- `loading` - AI is processing
- `success` - Redirect to prep card
- `empty` - No gems matched
- `error` - AI call failed

UI Elements:
- [ ] Slide-up sheet on mobile, centered dialog on desktop
- [ ] Textarea with placeholder: "What's coming up? e.g., '1:1 with my manager about promotion'"
- [ ] Character counter (500 max)
- [ ] "Find My Gems ✨" primary button
- [ ] Loading state: "Finding your wisdom..." with shimmer animation
- [ ] Empty state: "No gems matched this moment. Your wisdom is still growing! 🌱"
- [ ] Error state with retry button

### 8.2.4 Moment Trigger Button (FAB)
**File:** `components/moments/MomentFAB.tsx`

- [ ] Floating action button visible on home and gems list
- [ ] Icon: sparkles or lightbulb
- [ ] Label: "Moment"
- [ ] Keyboard shortcut: Cmd+M / Ctrl+M
- [ ] Opens MomentEntryModal

### 8.2.5 API Route for Moment Creation
**File:** `app/api/moments/route.ts`

```typescript
// POST /api/moments
// Body: { description: string, source?: 'manual' | 'calendar', calendarData?: {...} }
// Response: { moment: MomentWithGems }

// Flow:
// 1. Validate input
// 2. Create moment record
// 3. Call AI matching (8.4) to get matched gems
// 4. Insert moment_gems records
// 5. Update moment.gems_matched_count
// 6. Return full moment with gems
```

### 8.2.6 Tests for Task 8.2

**File:** `__tests__/moments/modal.test.tsx`
```typescript
describe('MomentEntryModal', () => {
  it('renders input when open', () => {
    render(<MomentEntryModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByPlaceholderText(/what's coming up/i)).toBeInTheDocument();
  });

  it('shows character count', async () => {
    render(<MomentEntryModal isOpen={true} onClose={() => {}} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Test moment');
    expect(screen.getByText('11/500')).toBeInTheDocument();
  });

  it('disables submit when empty', () => {
    render(<MomentEntryModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Find My Gems')).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    render(<MomentEntryModal isOpen={true} onClose={() => {}} />);
    await userEvent.type(screen.getByRole('textbox'), 'Test moment');
    await userEvent.click(screen.getByText('Find My Gems'));
    expect(screen.getByText(/finding your wisdom/i)).toBeInTheDocument();
  });
});
```

**File:** `__tests__/moments/api.test.ts`
```typescript
describe('POST /api/moments', () => {
  it('creates moment and returns matched gems', async () => {
    const response = await fetch('/api/moments', {
      method: 'POST',
      body: JSON.stringify({ description: '1:1 with manager about promotion' }),
    });
    const data = await response.json();
    expect(data.moment.id).toBeDefined();
    expect(data.moment.matched_gems).toBeInstanceOf(Array);
  });

  it('validates description is required', async () => {
    const response = await fetch('/api/moments', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
  });

  it('handles AI matching errors gracefully', async () => {
    // Mock AI failure
    const response = await fetch('/api/moments', {
      method: 'POST',
      body: JSON.stringify({ description: 'test' }),
    });
    // Should still create moment with 0 matches
    expect(response.status).toBe(200);
  });
});
```

---

## Task 8.3: Calendar Integration for Auto-Moments (KAY-55)

### 8.3.1 TypeScript Types
**File:** `types/calendar.ts`

```typescript
export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: 'google' | 'outlook';
  email: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  external_event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  moment_created: boolean;
  moment_id: string | null;
}

export interface CalendarSyncResult {
  events_synced: number;
  events_added: number;
  events_updated: number;
  errors: string[];
}
```

### 8.3.2 OAuth Configuration
**Files:** 
- `app/api/auth/google-calendar/route.ts` - Google OAuth callback
- `app/api/auth/outlook-calendar/route.ts` - Outlook OAuth callback

**Environment Variables Needed:**
```
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=

OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
OUTLOOK_REDIRECT_URI=
```

**Google OAuth Scopes:**
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`

**Microsoft OAuth Scopes:**
- `Calendars.Read`
- `offline_access`

### 8.3.3 Calendar Service Functions
**File:** `lib/calendar.ts`

```typescript
// Connection management
export async function connectGoogleCalendar(code: string): Promise<CalendarConnection>;
export async function connectOutlookCalendar(code: string): Promise<CalendarConnection>;
export async function disconnectCalendar(connectionId: string): Promise<void>;
export async function getCalendarConnections(): Promise<CalendarConnection[]>;

// Sync operations
export async function syncCalendarEvents(connectionId: string): Promise<CalendarSyncResult>;
export async function getPendingEventsForMoments(): Promise<CalendarEvent[]>;

// Token management
export async function refreshGoogleToken(connectionId: string): Promise<void>;
export async function refreshOutlookToken(connectionId: string): Promise<void>;
```

**Dependencies:**
```bash
npm install googleapis @microsoft/microsoft-graph-client
```

### 8.3.4 Calendar Settings Component
**File:** `components/settings/CalendarSettings.tsx`

UI Elements:
- [ ] "Connect Google Calendar" button (if not connected)
- [ ] "Connect Outlook Calendar" button (if not connected)
- [ ] Connected calendars list with disconnect button
- [ ] Last sync timestamp
- [ ] Auto-moment toggle: "Auto-prepare for calendar events"
- [ ] Lead time dropdown: 15 min / 30 min / 1 hour / 2 hours
- [ ] Event filter: "All events" / "Meetings only" / "Custom keywords"

### 8.3.5 Auto-Moment Background Sync
**File:** `lib/calendar-sync.ts`

```typescript
// Called on app open and periodically
export async function checkForUpcomingEvents(): Promise<void> {
  // 1. Get user's lead time preference
  // 2. Get pending events within lead time window
  // 3. For each event without moment:
  //    a. Create moment with source='calendar'
  //    b. Run AI matching
  //    c. Mark event as moment_created=true
  //    d. Show in-app notification
}
```

### 8.3.6 In-App Notification Banner
**File:** `components/moments/MomentBanner.tsx`

Props:
```typescript
interface MomentBannerProps {
  moment: Moment;
  onTap: () => void;
  onDismiss: () => void;
}
```

- [ ] Sticky banner at top of app
- [ ] Text: "✨ {event_title} in {time} - Tap to prepare"
- [ ] Dismiss button
- [ ] Auto-dismiss after event start time

### 8.3.7 Tests for Task 8.3

**File:** `__tests__/calendar/oauth.test.ts`
```typescript
describe('Google Calendar OAuth', () => {
  it('exchanges code for tokens', async () => {
    const connection = await connectGoogleCalendar('mock_code');
    expect(connection.provider).toBe('google');
    expect(connection.email).toBeDefined();
  });

  it('stores refresh token securely', async () => {
    const connection = await connectGoogleCalendar('mock_code');
    // Verify token is in database (encrypted)
    const stored = await getCalendarConnections();
    expect(stored[0].id).toBe(connection.id);
  });
});

describe('Outlook Calendar OAuth', () => {
  it('exchanges code for tokens', async () => {
    const connection = await connectOutlookCalendar('mock_code');
    expect(connection.provider).toBe('outlook');
  });
});
```

**File:** `__tests__/calendar/sync.test.ts`
```typescript
describe('syncCalendarEvents', () => {
  it('syncs next 24 hours of events', async () => {
    const result = await syncCalendarEvents('connection_id');
    expect(result.events_synced).toBeGreaterThan(0);
  });

  it('does not duplicate events on re-sync', async () => {
    await syncCalendarEvents('connection_id');
    const result = await syncCalendarEvents('connection_id');
    expect(result.events_added).toBe(0);
  });
});

describe('checkForUpcomingEvents', () => {
  it('creates moments for events within lead time', async () => {
    // Setup: event starting in 25 minutes, lead time = 30 minutes
    await checkForUpcomingEvents();
    const moments = await getRecentMoments(1);
    expect(moments[0].source).toBe('calendar');
  });

  it('does not create duplicate moments', async () => {
    await checkForUpcomingEvents();
    await checkForUpcomingEvents();
    const moments = await getRecentMoments(10);
    // Should only have one moment per event
  });
});
```

---

## Task 8.4: AI-Powered Gem Matching for Moments (KAY-56)

### 8.4.1 TypeScript Types
**File:** `types/matching.ts`

```typescript
export interface GemMatch {
  gem_id: string;
  relevance_score: number;  // 0.0 to 1.0
  relevance_reason: string;
}

export interface MatchingRequest {
  moment_description: string;
  gems: Array<{
    id: string;
    content: string;
    context_tag: string;
    source: string | null;
  }>;
}

export interface MatchingResponse {
  matches: GemMatch[];
  processing_time_ms: number;
}
```

### 8.4.2 AI Matching Service
**File:** `lib/matching.ts`

```typescript
export async function matchGemsToMoment(
  momentDescription: string, 
  gems: Gem[]
): Promise<MatchingResponse>;
```

**Gemini Prompt Template:**
```
You are a wisdom matching assistant. Given a user's upcoming moment/situation and their collection of saved insights (gems), identify which gems are most relevant.

MOMENT: {moment_description}

USER'S GEMS:
{gems_list_formatted}

For each gem, consider:
1. Direct topical relevance (does the gem's advice apply to this situation?)
2. Context tag match (e.g., "meetings" tag for a meeting moment)
3. Underlying principles (even if not directly mentioned, could this wisdom help?)

Return a JSON array of relevant gems (max 5, minimum relevance 0.5):
[
  {
    "gem_id": "uuid",
    "relevance_score": 0.85,
    "relevance_reason": "Brief explanation of why this gem applies..."
  }
]

If no gems are relevant, return an empty array: []
Respond with ONLY the JSON array, no additional text.
```

### 8.4.3 API Route for Matching
**File:** `app/api/moments/match/route.ts`

```typescript
// POST /api/moments/match
// Body: { moment_id: string }
// Response: { matches: GemMatch[], processing_time_ms: number }

// Flow:
// 1. Get moment by ID
// 2. Get all active gems for user
// 3. If no gems, return empty matches
// 4. Call Gemini API with prompt
// 5. Parse response, validate scores
// 6. Return matches sorted by score DESC
```

**Error Handling:**
- AI timeout (5s): Return empty matches with error flag
- Malformed response: Parse error, return empty matches
- Rate limit: 20 moment matches per user per hour

### 8.4.4 Tests for Task 8.4

**File:** `__tests__/matching/ai.test.ts`
```typescript
describe('matchGemsToMoment', () => {
  it('returns matches above 0.5 threshold', async () => {
    const gems = [
      { id: '1', content: 'Listen more than you speak', context_tag: 'meetings', source: 'Book' },
      { id: '2', content: 'Always be learning', context_tag: 'focus', source: 'Quote' },
    ];
    const result = await matchGemsToMoment('1:1 with manager', gems);
    
    result.matches.forEach(match => {
      expect(match.relevance_score).toBeGreaterThanOrEqual(0.5);
    });
  });

  it('returns max 5 matches', async () => {
    const gems = Array(10).fill(null).map((_, i) => ({
      id: String(i),
      content: `Gem ${i}`,
      context_tag: 'meetings',
      source: null,
    }));
    const result = await matchGemsToMoment('big meeting', gems);
    expect(result.matches.length).toBeLessThanOrEqual(5);
  });

  it('returns empty array when no gems match', async () => {
    const gems = [
      { id: '1', content: 'Recipe for pasta', context_tag: 'health', source: null },
    ];
    const result = await matchGemsToMoment('quarterly business review', gems);
    expect(result.matches).toHaveLength(0);
  });

  it('handles AI timeout gracefully', async () => {
    // Mock slow response
    const result = await matchGemsToMoment('test', []);
    expect(result.matches).toEqual([]);
    expect(result.processing_time_ms).toBeDefined();
  });

  it('includes relevance reasons', async () => {
    const gems = [{ id: '1', content: 'Listen actively', context_tag: 'meetings', source: null }];
    const result = await matchGemsToMoment('feedback session', gems);
    
    if (result.matches.length > 0) {
      expect(result.matches[0].relevance_reason).toBeTruthy();
    }
  });
});
```

---

## Task 8.5: Moment Prep Card Display (KAY-57)

### 8.5.1 Prep Card Page
**File:** `app/moments/[id]/prepare/page.tsx`

Server component that:
- Fetches moment with matched gems
- Renders PrepCard component
- Handles 404 if moment not found

### 8.5.2 Prep Card Component
**File:** `components/moments/PrepCard.tsx`

Props:
```typescript
interface PrepCardProps {
  moment: MomentWithGems;
  onComplete: () => void;
}
```

UI Layout:
- [ ] Header with moment context
  - "Preparing for: {description or calendar_event_title}"
  - If calendar: "Starting in {time_until}"
  - Back button
- [ ] Matched gems list (sorted by relevance)
  - Full gem content
  - Source attribution
  - Context tag badge
  - AI relevance reason: "Why this applies: {reason}"
  - Relevance indicator (subtle visual)
  - "Got it ✓" button (marks reviewed)
  - "Not helpful" button (records feedback)
- [ ] Empty state (no matches)
  - Friendly illustration
  - "No gems matched this moment, but you've got this! 💪"
  - "Add a gem for next time" CTA
- [ ] Footer
  - "Done Preparing" primary button
  - Marks moment as completed

### 8.5.3 Recent Moments Section
**File:** `components/moments/RecentMoments.tsx`

- [ ] Section on home page showing last 10 moments
- [ ] Each moment shows: description preview, time ago, matched count
- [ ] Tapping reopens prep card (read-only mode)
- [ ] "See all" link to moments history page

### 8.5.4 Moments History Page
**File:** `app/moments/page.tsx`

- [ ] List of all moments, newest first
- [ ] Filter by source (all / manual / calendar)
- [ ] Each item: description, source badge, match count, created date
- [ ] Tapping opens prep card (read-only)

### 8.5.5 Deep Link Support
**File:** Update `next.config.js` if needed

- Route: `/moments/[id]/prepare`
- Should be shareable/bookmarkable
- Auth required (redirect to login if not authenticated)

### 8.5.6 Tests for Task 8.5

**File:** `__tests__/moments/prepcard.test.tsx`
```typescript
describe('PrepCard', () => {
  const mockMoment: MomentWithGems = {
    id: '1',
    description: '1:1 with manager',
    source: 'manual',
    gems_matched_count: 2,
    matched_gems: [
      { gem_id: '1', relevance_score: 0.9, relevance_reason: 'Listening applies to 1:1s' },
      { gem_id: '2', relevance_score: 0.7, relevance_reason: 'Feedback context matches' },
    ],
    // ... other fields
  };

  it('renders moment header', () => {
    render(<PrepCard moment={mockMoment} />);
    expect(screen.getByText(/preparing for/i)).toBeInTheDocument();
    expect(screen.getByText('1:1 with manager')).toBeInTheDocument();
  });

  it('shows gems sorted by relevance', () => {
    render(<PrepCard moment={mockMoment} />);
    const gems = screen.getAllByTestId('gem-card');
    // First gem should have higher relevance
  });

  it('shows relevance reasons', () => {
    render(<PrepCard moment={mockMoment} />);
    expect(screen.getByText(/listening applies/i)).toBeInTheDocument();
  });

  it('marks gem as reviewed on "Got it" click', async () => {
    const onReview = jest.fn();
    render(<PrepCard moment={mockMoment} />);
    await userEvent.click(screen.getAllByText('Got it')[0]);
    // Verify visual change and API call
  });

  it('records feedback on "Not helpful" click', async () => {
    render(<PrepCard moment={mockMoment} />);
    await userEvent.click(screen.getAllByText('Not helpful')[0]);
    // Verify API call with was_helpful=false
  });

  it('calls onComplete when Done Preparing clicked', async () => {
    const onComplete = jest.fn();
    render(<PrepCard moment={mockMoment} onComplete={onComplete} />);
    await userEvent.click(screen.getByText('Done Preparing'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('shows empty state when no gems matched', () => {
    const emptyMoment = { ...mockMoment, gems_matched_count: 0, matched_gems: [] };
    render(<PrepCard moment={emptyMoment} />);
    expect(screen.getByText(/no gems matched/i)).toBeInTheDocument();
    expect(screen.getByText(/add a gem/i)).toBeInTheDocument();
  });
});

describe('RecentMoments', () => {
  it('shows last 10 moments', async () => {
    render(<RecentMoments />);
    await waitFor(() => {
      expect(screen.getAllByTestId('moment-item').length).toBeLessThanOrEqual(10);
    });
  });

  it('links to prep card on click', async () => {
    render(<RecentMoments />);
    await userEvent.click(screen.getAllByTestId('moment-item')[0]);
    // Verify navigation
  });
});
```

---

## Integration Tests

**File:** `__tests__/integration/moment-flow.test.ts`

```typescript
describe('Complete Moment Flow', () => {
  it('creates moment, matches gems, shows prep card', async () => {
    // 1. User opens moment modal
    // 2. Types description
    // 3. Submits
    // 4. AI matching runs
    // 5. Navigates to prep card
    // 6. Gems are displayed
    // 7. User marks as complete
  });

  it('calendar event triggers auto-moment', async () => {
    // 1. Connect calendar
    // 2. Sync event starting in 25 min
    // 3. Background check runs
    // 4. Moment is created
    // 5. Banner appears
    // 6. User taps to see prep card
  });

  it('gem schedule triggers notification badge', async () => {
    // 1. Create gem with schedule
    // 2. Wait until trigger time
    // 3. Badge appears on gem card
    // 4. Next trigger time updates
  });
});
```

---

## File Structure Summary

```
gemkeeper/
├── types/
│   ├── schedules.ts          # 8.1.1
│   ├── moments.ts            # 8.2.1
│   ├── calendar.ts           # 8.3.1
│   └── matching.ts           # 8.4.1
├── lib/
│   ├── schedules.ts          # 8.1.2
│   ├── moments.ts            # 8.2.2
│   ├── calendar.ts           # 8.3.3
│   ├── calendar-sync.ts      # 8.3.5
│   └── matching.ts           # 8.4.2
├── app/
│   ├── api/
│   │   ├── schedules/
│   │   │   └── parse/route.ts    # 8.1.3
│   │   ├── moments/
│   │   │   ├── route.ts          # 8.2.5
│   │   │   └── match/route.ts    # 8.4.3
│   │   └── auth/
│   │       ├── google-calendar/route.ts   # 8.3.2
│   │       └── outlook-calendar/route.ts  # 8.3.2
│   └── moments/
│       ├── page.tsx              # 8.5.4
│       └── [id]/
│           └── prepare/page.tsx  # 8.5.1
├── components/
│   ├── schedules/
│   │   └── SchedulePicker.tsx    # 8.1.4
│   ├── moments/
│   │   ├── MomentEntryModal.tsx  # 8.2.3
│   │   ├── MomentFAB.tsx         # 8.2.4
│   │   ├── MomentBanner.tsx      # 8.3.6
│   │   ├── PrepCard.tsx          # 8.5.2
│   │   └── RecentMoments.tsx     # 8.5.3
│   ├── settings/
│   │   └── CalendarSettings.tsx  # 8.3.4
│   └── gems/
│       ├── GemDetail.tsx (update)    # 8.1.5
│       └── GemCard.tsx (update)      # 8.1.6
└── __tests__/
    ├── schedules/
    │   ├── cron.test.ts          # 8.1.7
    │   ├── api.test.ts           # 8.1.7
    │   └── components.test.tsx   # 8.1.7
    ├── moments/
    │   ├── modal.test.tsx        # 8.2.6
    │   ├── api.test.ts           # 8.2.6
    │   └── prepcard.test.tsx     # 8.5.6
    ├── calendar/
    │   ├── oauth.test.ts         # 8.3.7
    │   └── sync.test.ts          # 8.3.7
    ├── matching/
    │   └── ai.test.ts            # 8.4.4
    └── integration/
        └── moment-flow.test.ts
```

---

## Dependencies to Install

```bash
npm install cron-parser googleapis @microsoft/microsoft-graph-client
```

---

## Environment Variables

Add to `.env.local` and Vercel:

```
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=

# New for Epic 8
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=https://gemkeeper.vercel.app/api/auth/google-calendar

OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
OUTLOOK_REDIRECT_URI=https://gemkeeper.vercel.app/api/auth/outlook-calendar
```

---

## Completion Checklist

### Task 8.1: Individual Gem Schedules
- [ ] Types created
- [ ] Service functions implemented
- [ ] NLP parse API route working
- [ ] Visual scheduler component built
- [ ] Gem detail view updated
- [ ] Gem card badge added
- [ ] All tests passing

### Task 8.2: Moment Entry Modal
- [ ] Types created
- [ ] Service functions implemented
- [ ] Modal component built
- [ ] FAB trigger added
- [ ] API route working
- [ ] All tests passing

### Task 8.3: Calendar Integration
- [ ] Types created
- [ ] OAuth routes implemented
- [ ] Service functions working
- [ ] Settings component built
- [ ] Background sync working
- [ ] Banner component built
- [ ] All tests passing

### Task 8.4: AI Gem Matching
- [ ] Types created
- [ ] Matching service implemented
- [ ] API route working
- [ ] All tests passing

### Task 8.5: Prep Card Display
- [ ] Prep card page created
- [ ] PrepCard component built
- [ ] Recent moments section added
- [ ] Moments history page built
- [ ] Deep links working
- [ ] All tests passing

### Integration
- [ ] E2E moment flow tested
- [ ] Calendar auto-moment tested
- [ ] Schedule notification tested
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Vercel deployment successful
