# Epic 13: Onboarding - Your Knowledge Bank for Life

## Overview

Redesign the onboarding experience to reduce barriers to entry and establish ThoughtFolio as "your knowledge bank for all of life." The new onboarding merges education with action — users learn features by using them, and leave with a populated knowledge bank ready for daily use.

**Branch:** `claude/preload-templates-onboarding-wfTNU`

---

## Vision

**ThoughtFolio is where you:**
1. **CAPTURE** everything — insights, lessons, ideas from anywhere
2. **RETRIEVE** anything — organized, searchable, surfaced when needed
3. **APPLY** knowledge — daily accountability to put insights into action

The onboarding should teach all three pillars while giving users a hands-on taste of each.

---

## Current State

- Onboarding is a 9-step educational carousel (passive, read-only)
- Users finish onboarding with 8 default contexts but **zero thoughts**
- Cold-start problem: can't experience Daily Check-in without content
- Re-launching onboarding just replays the same slides
- No personalization based on user's life/roles

---

## Target State

- Onboarding is interactive — users learn by doing
- Users finish with **5-15 thoughts** in their knowledge bank
- Personalized to user's roles (Manager, Parent, Student, etc.)
- Three pillars (Capture → Retrieve → Apply) taught through action
- Re-launch offers "App Tour" or "Get More Starters" separately
- Discover moved to end as optional exploration

---

## The Three Pillars Framework

| Pillar | Promise | Features Covered |
|--------|---------|------------------|
| **CAPTURE** | "Store everything" | Manual entry, Starter Pack, Notes, AI extraction |
| **RETRIEVE** | "Find everything" | Contexts, Search, Moments (Cmd+M) |
| **APPLY** | "Get reminded to use it" | Active List, Daily Check-in, Calendar |
| **EXPLORE** | "Discover new knowledge" | Discover feature (optional, end of flow) |

---

## Onboarding Flow (12 Steps)

### Act 1: CAPTURE (Steps 1-6)
> "This is where everything goes. Your insights, lessons, ideas — from your head, from books, from anywhere."

| Step | Name | Purpose | User Action | Data Collected/Created |
|------|------|---------|-------------|------------------------|
| 1 | Welcome | Set the vision | Read + Continue | — |
| 2 | Your Roles | Establish breadth | Select 2-4 roles | `selected_roles[]` stored in profile |
| 3 | Your Sources | Understand input types | Select knowledge sources | `knowledge_sources[]` stored in profile |
| 4 | Your First Thought | Learn capture | Write one thought (free text) | Creates first thought |
| 5 | Starter Pack | Seed knowledge bank | Review & select from suggestions | Creates 5-10 thoughts based on roles |
| 6 | Notes | Introduce long-form | See example note → extracted thought | Educational only |

### Act 2: RETRIEVE (Steps 7-8)
> "Everything organized. Everything findable. The right thought at the right moment."

| Step | Name | Purpose | User Action | Data Collected/Created |
|------|------|---------|-------------|------------------------|
| 7 | Contexts | Show organization | See thoughts auto-organized by context | Educational (contexts exist) |
| 8 | Moments | Teach on-demand retrieval | Try Cmd+M with sample situation | Educational + interactive demo |

### Act 3: APPLY (Steps 9-11)
> "Knowledge isn't useful until you use it. We make sure you do."

| Step | Name | Purpose | User Action | Data Collected/Created |
|------|------|---------|-------------|------------------------|
| 9 | Active List | Explain curation | See their Active List populated | Auto-populate Active List |
| 10 | Daily Check-in | Show accountability | Preview check-in experience | Educational |
| 11 | Calendar | Introduce prep | Optional: connect Google Calendar | Calendar integration (optional) |

### Finale (Step 12)
> "You're ready. Your knowledge bank is waiting."

| Step | Name | Purpose | User Action | Data Collected/Created |
|------|------|---------|-------------|------------------------|
| 12 | Ready + Discover | Celebrate + optional explore | CTA: "Go to Dashboard" or "Try Discover" | Optional Discover session |

---

## Detailed Step Specifications

### Step 1: Welcome

**Headline:** "Welcome to your knowledge bank"

**Subtext:** "ThoughtFolio helps you capture insights from everywhere, find them when you need them, and actually apply them in your life."

**Visual:** Abstract illustration showing the three pillars (Capture → Retrieve → Apply)

**CTA:** "Let's set up your knowledge bank" → Step 2

---

### Step 2: Your Roles

**Headline:** "What roles do you play in life?"

**Subtext:** "ThoughtFolio helps you be better at all of them. Select 2-4 that matter most right now."

**Options (multi-select, 2-4 required):**
| Role | Icon | Maps to Contexts |
|------|------|------------------|
| Manager / Leader | 👔 | Meetings, Feedback |
| Individual Contributor | 💻 | Focus, Productivity |
| Parent | 👶 | Parenting |
| Partner / Spouse | 💑 | Relationships |
| Student / Learner | 📚 | Learning, Growth |
| Creator / Builder | 🎨 | Creativity, Projects |
| Entrepreneur | 🚀 | Business, Strategy |
| Health-Focused | 🏃 | Health, Wellness |
| Friend / Community Member | 🤝 | Relationships, Community |

**Validation:** Must select 2-4 roles

**Data stored:** `profile.selected_roles` (string array)

**CTA:** "Continue" → Step 3

---

### Step 3: Your Sources

**Headline:** "Where do you learn from?"

**Subtext:** "Understanding your sources helps us personalize your experience."

**Options (multi-select, 1+ required):**
- 📚 Books
- 🎧 Podcasts
- 📰 Articles & Blogs
- 🎓 Courses & Classes
- 👥 Mentors & Coaches
- 💬 Conversations
- 🧠 Life Experience
- 🎬 Videos & Documentaries

**Data stored:** `profile.knowledge_sources` (string array)

**CTA:** "Continue" → Step 4

---

### Step 4: Your First Thought

**Headline:** "Capture your first thought"

**Subtext:** "What's one insight, lesson, or idea you don't want to forget? It can be something you read, heard, or learned from experience."

**Input:**
- Large text area (max 500 chars)
- Placeholder: "e.g., 'The best time to plant a tree was 20 years ago. The second best time is now.'"
- Character counter

**Context assignment:** Auto-detect from content using AI, or default to "Other"

**Validation:** Required, min 10 characters

**Data created:** One thought with `status: 'active'`, `is_on_active_list: true`

**CTA:** "Save & Continue" → Step 5

---

### Step 5: Starter Pack

**Headline:** "Here are some thoughts to get you started"

**Subtext:** "Based on your roles, we've selected these. Keep the ones that resonate — you can always remove them later."

**Display:**
- 8-12 suggested thoughts based on selected roles
- Each shows: thought content, suggested context, checkbox (default checked for top 5)
- Thoughts grouped by role/context

**Selection rules:**
- Pre-select top 5 by relevance score
- User can check/uncheck any
- Minimum 3 required, maximum 10

**Data created:** Selected thoughts with `status: 'active'`, `is_on_active_list: true`

**CTA:** "Add X thoughts to my knowledge bank" → Step 6

---

### Step 6: Notes

**Headline:** "For bigger ideas, there's Notes"

**Subtext:** "Notes let you capture longer content — book summaries, meeting notes, reflections. Then extract the key thoughts later."

**Visual:**
- Show example note (book summary)
- Animated highlight of "Extract to Thoughts" feature
- Show extracted thought appearing

**Educational only:** No user action required

**CTA:** "Got it" → Step 7

---

### Step 7: Contexts

**Headline:** "Your thoughts, organized by life area"

**Subtext:** "Every thought belongs to a context. We've set up defaults based on your roles — you can customize these anytime."

**Visual:**
- Show their actual contexts (the 8 defaults)
- Highlight which contexts have thoughts (from Steps 4-5)
- Show thought counts per context

**Educational only:** No user action required

**CTA:** "Continue" → Step 8

---

### Step 8: Moments

**Headline:** "The right thought at the right moment"

**Subtext:** "Heading into a tough conversation? Preparing for a meeting? Press Cmd+M (or Ctrl+M) and describe the situation. We'll find the most relevant thought."

**Interactive demo:**
- Show Moments input field
- Pre-filled example: "I have a difficult feedback conversation with a team member"
- Show AI matching animation
- Display matched thought from their library (or starter pack)

**User action:** Optional — can try it or skip

**CTA:** "Continue" → Step 9

---

### Step 9: Active List

**Headline:** "Your Active List: 10 thoughts, front and center"

**Subtext:** "These are the thoughts you're focusing on right now. They'll be surfaced in your Daily Check-in."

**Visual:**
- Show their Active List (populated from Steps 4-5)
- Explain the 10-thought limit
- Show "applied X times" and graduation path

**Display:** Their actual Active List with real thoughts

**CTA:** "Continue" → Step 10

---

### Step 10: Daily Check-in

**Headline:** "Each day, one question: Did you apply this?"

**Subtext:** "The Daily Check-in surfaces one thought from your Active List and asks if you used it. Simple accountability that drives real change."

**Visual:**
- Mock Daily Check-in card with one of their thoughts
- Show Yes/No buttons
- Explain: "Yes" = progress toward graduation, "No" = that's okay, try tomorrow

**Educational only:** Preview experience

**CTA:** "Continue" → Step 11

---

### Step 11: Calendar (Optional)

**Headline:** "Prepare for what's ahead"

**Subtext:** "Connect your calendar to get thought suggestions before important meetings and events."

**Options:**
- "Connect Google Calendar" → OAuth flow
- "Skip for now" → Continue without calendar

**If connected:** Show preview of upcoming events with "Get thoughts for this" option

**CTA:** "Continue" or "Skip for now" → Step 12

---

### Step 12: Ready + Discover

**Headline:** "Your knowledge bank is ready"

**Subtext:** "You have X thoughts ready to help you. Start using them, or explore new ideas with Discover."

**Stats display:**
- "X thoughts in your knowledge bank"
- "X contexts set up"
- "X thoughts on your Active List"

**Two CTAs:**
1. **Primary:** "Go to Dashboard" → `/home`
2. **Secondary:** "Try Discover first" → Inline Discover experience

**If "Try Discover":**
- Show simplified Discover interface
- One search or "Surprise Me"
- Save 1-2 discoveries
- Then → Dashboard

---

## Template Thought Library

### Requirements
- 80-120 curated thoughts across all roles/contexts
- Each thought tagged with: `roles[]`, `contexts[]`, `sources[]`
- Quality bar: universal insights that work for most people
- Mix of: quotes, principles, frameworks, mental models

### Template Structure
```typescript
interface TemplateThought {
  id: string;
  content: string;
  roles: Role[];           // Which roles this applies to
  contexts: ContextSlug[]; // Which contexts this fits
  sources: Source[];       // What type of source this sounds like
  relevance_score: number; // 1-10, used for default selection
}
```

### Sample Templates by Role

**Manager / Leader:**
- "Clarity is kindness — ambiguity creates anxiety for your team"
- "Praise in public, coach in private"
- "Your job isn't to have all the answers; it's to ask the right questions"
- "The speed of the leader determines the speed of the team"
- "Delegate outcomes, not tasks"

**Parent:**
- "Connection before correction"
- "Children need to feel heard before they can hear you"
- "The days are long but the years are short"
- "Model the behavior you want to see"
- "Quality time isn't about quantity — it's about presence"

**Health-Focused:**
- "You can't pour from an empty cup"
- "Sleep is the foundation — everything else is downstream"
- "Motion is lotion — movement cures most stiffness"
- "Discipline is choosing between what you want now and what you want most"
- "Your body keeps the score — stress shows up physically"

**Student / Learner:**
- "Teaching something is the fastest way to learn it"
- "Spaced repetition beats cramming every time"
- "The best learning happens at the edge of your comfort zone"
- "Take notes by hand — it forces you to synthesize"
- "Learn the principles, not just the procedures"

**Individual Contributor:**
- "Protect your maker hours — context switching has a 23-minute recovery cost"
- "Done is better than perfect"
- "Work expands to fill the time available (Parkinson's Law)"
- "Eat the frog first — do the hardest task when energy is highest"
- "Document your decisions — future you will thank present you"

**Entrepreneur:**
- "Revenue solves all problems"
- "Talk to customers before building features"
- "Your first idea is probably wrong — iterate fast"
- "Saying no is a superpower — focus beats diversification"
- "Cash flow is oxygen — profitability is optional, solvency isn't"

**Partner / Spouse:**
- "Assume positive intent"
- "The grass is greener where you water it"
- "Arguments aren't you vs. them — it's both of you vs. the problem"
- "Small gestures compound over time"
- "Listen to understand, not to respond"

**Creator / Builder:**
- "Ship early, ship often"
- "Constraints breed creativity"
- "Steal like an artist — originality is just hidden influences"
- "The work is never as good or bad as you think in the moment"
- "Create for yourself first — if you love it, others might too"

### Database Storage

Create `template_thoughts` table:
```sql
CREATE TABLE template_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  contexts TEXT[] NOT NULL,
  sources TEXT[] NOT NULL,
  relevance_score INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Or store as JSON file: `lib/data/template-thoughts.json`

---

## Re-launch Behavior (Settings Page)

### For Returning Users

Add two options in Settings under "Help & Support":

**1. "Retake App Tour"**
- Condensed educational flow (Steps 6-11 content only)
- No data collection
- Shows features with their actual data
- ~5 screens

**2. "Get More Starter Thoughts"**
- Shows roles they haven't explored yet
- "Want to add thoughts for these areas?"
- Select new roles → Get new suggestions
- Additive to existing library (doesn't overwrite)
- Can run multiple times

### Implementation

Profile tracks:
```typescript
interface Profile {
  // ... existing fields
  selected_roles: string[];
  knowledge_sources: string[];
  onboarding_completed: boolean;
  onboarding_completed_at: string;
  starter_roles_used: string[]; // Track which roles already have starters
}
```

---

## Phase 1: Foundation

### 1.1 Database Changes (Kay runs in Supabase)
- [ ] Add `selected_roles` column to profiles (TEXT[])
- [ ] Add `knowledge_sources` column to profiles (TEXT[])
- [ ] Add `starter_roles_used` column to profiles (TEXT[])
- [ ] Add `onboarding_completed_at` column to profiles (TIMESTAMPTZ)
- [ ] Create `template_thoughts` table OR create JSON data file

### 1.2 TypeScript Types
- [ ] Create `lib/types/onboarding.ts`:
  ```typescript
  export type Role =
    | 'manager'
    | 'individual_contributor'
    | 'parent'
    | 'partner'
    | 'student'
    | 'creator'
    | 'entrepreneur'
    | 'health_focused'
    | 'friend';

  export type KnowledgeSource =
    | 'books'
    | 'podcasts'
    | 'articles'
    | 'courses'
    | 'mentors'
    | 'conversations'
    | 'life_experience'
    | 'videos';

  export interface OnboardingState {
    currentStep: number;
    selectedRoles: Role[];
    knowledgeSources: KnowledgeSource[];
    firstThought: string | null;
    selectedStarterIds: string[];
    calendarConnected: boolean;
  }

  export interface TemplateThought {
    id: string;
    content: string;
    roles: Role[];
    contexts: string[];
    sources: KnowledgeSource[];
    relevance_score: number;
  }

  export interface StarterPackSuggestion extends TemplateThought {
    isSelected: boolean;
    suggestedContext: string;
  }
  ```
- [ ] Export from `lib/types/index.ts`

### 1.3 Template Thoughts Data
- [ ] Create `lib/data/template-thoughts.ts` with 80-120 curated thoughts
- [ ] Organize by role with proper tagging
- [ ] Include relevance scores

---

## Phase 2: Onboarding Components

### 2.1 Onboarding Container
- [ ] Refactor `components/onboarding.tsx` to support new flow
- [ ] Add step progress indicator (12 steps, grouped by Act)
- [ ] Add state management for onboarding data
- [ ] Add navigation (back/next/skip where appropriate)

### 2.2 Step Components
- [ ] Create `components/onboarding/WelcomeStep.tsx` (Step 1)
- [ ] Create `components/onboarding/RolesStep.tsx` (Step 2)
- [ ] Create `components/onboarding/SourcesStep.tsx` (Step 3)
- [ ] Create `components/onboarding/FirstThoughtStep.tsx` (Step 4)
- [ ] Create `components/onboarding/StarterPackStep.tsx` (Step 5)
- [ ] Create `components/onboarding/NotesStep.tsx` (Step 6)
- [ ] Create `components/onboarding/ContextsStep.tsx` (Step 7)
- [ ] Create `components/onboarding/MomentsStep.tsx` (Step 8)
- [ ] Create `components/onboarding/ActiveListStep.tsx` (Step 9)
- [ ] Create `components/onboarding/CheckinStep.tsx` (Step 10)
- [ ] Create `components/onboarding/CalendarStep.tsx` (Step 11)
- [ ] Create `components/onboarding/ReadyStep.tsx` (Step 12)

### 2.3 Shared Components
- [ ] Create `components/onboarding/StepProgress.tsx` (progress bar with acts)
- [ ] Create `components/onboarding/RoleCard.tsx` (selectable role card)
- [ ] Create `components/onboarding/SourceChip.tsx` (selectable source chip)
- [ ] Create `components/onboarding/StarterThoughtCard.tsx` (selectable thought)

---

## Phase 3: API Routes

### 3.1 Onboarding API
- [ ] Create `app/api/onboarding/starter-thoughts/route.ts` (GET):
  - Accept `roles[]` query param
  - Return filtered & ranked template thoughts
  - Include suggested context for each
- [ ] Create `app/api/onboarding/complete/route.ts` (POST):
  - Save selected roles to profile
  - Save knowledge sources to profile
  - Create first thought
  - Create selected starter thoughts
  - Add thoughts to Active List
  - Set `onboarding_completed = true`
  - Set `onboarding_completed_at = now()`
  - Update `starter_roles_used`

### 3.2 Profile Updates
- [ ] Update `app/settings/actions.ts` to handle new profile fields
- [ ] Add `getStarterRolesUsed()` function
- [ ] Add `addStarterRolesUsed(roles[])` function

---

## Phase 4: Settings Integration

### 4.1 Re-launch Options
- [ ] Add "Help & Support" section to Settings page
- [ ] Add "Retake App Tour" button
- [ ] Add "Get More Starter Thoughts" button

### 4.2 App Tour (Returning Users)
- [ ] Create `components/onboarding/AppTour.tsx`
- [ ] Condensed 5-step educational flow
- [ ] Uses user's actual data in examples
- [ ] No data collection

### 4.3 More Starters Flow
- [ ] Create `components/onboarding/MoreStartersModal.tsx`
- [ ] Show roles not in `starter_roles_used`
- [ ] Let user select new roles
- [ ] Show suggestions for selected roles
- [ ] Add to existing library (not replace)

---

## Phase 5: Polish & Testing

### 5.1 Animations & Transitions
- [ ] Add smooth transitions between steps
- [ ] Add micro-animations for selections
- [ ] Add celebration animation on completion

### 5.2 Responsive Design
- [ ] Test all steps on mobile
- [ ] Ensure touch targets are adequate
- [ ] Test keyboard navigation

### 5.3 Edge Cases
- [ ] Handle users who skip to end
- [ ] Handle users who go back and change selections
- [ ] Handle API failures gracefully
- [ ] Test with slow connections

### 5.4 Analytics (Optional)
- [ ] Track step completion rates
- [ ] Track drop-off points
- [ ] Track starter thought selection patterns

---

## Files to Create

```
lib/types/onboarding.ts
lib/data/template-thoughts.ts
components/onboarding/WelcomeStep.tsx
components/onboarding/RolesStep.tsx
components/onboarding/SourcesStep.tsx
components/onboarding/FirstThoughtStep.tsx
components/onboarding/StarterPackStep.tsx
components/onboarding/NotesStep.tsx
components/onboarding/ContextsStep.tsx
components/onboarding/MomentsStep.tsx
components/onboarding/ActiveListStep.tsx
components/onboarding/CheckinStep.tsx
components/onboarding/CalendarStep.tsx
components/onboarding/ReadyStep.tsx
components/onboarding/StepProgress.tsx
components/onboarding/RoleCard.tsx
components/onboarding/SourceChip.tsx
components/onboarding/StarterThoughtCard.tsx
components/onboarding/AppTour.tsx
components/onboarding/MoreStartersModal.tsx
app/api/onboarding/starter-thoughts/route.ts
app/api/onboarding/complete/route.ts
```

## Files to Modify

```
components/onboarding.tsx (major refactor)
app/settings/actions.ts (new profile fields)
app/settings/page.tsx (add re-launch options)
lib/types/index.ts (export new types)
```

---

## Acceptance Criteria

- [ ] New users complete onboarding with 5-15 thoughts
- [ ] Roles selection works (2-4 required)
- [ ] Knowledge sources selection works (1+ required)
- [ ] First thought creation works
- [ ] Starter pack shows role-relevant suggestions
- [ ] Starter pack selection works (3-10 thoughts)
- [ ] Notes educational step displays correctly
- [ ] Contexts step shows actual user contexts
- [ ] Moments demo is interactive
- [ ] Active List shows populated thoughts
- [ ] Daily Check-in preview works
- [ ] Calendar connection is optional and works
- [ ] Final step shows stats and Discover option
- [ ] "Retake App Tour" works from Settings
- [ ] "Get More Starters" works from Settings
- [ ] Mobile responsive throughout
- [ ] Glassmorphism styling consistent

---

## Definition of Done

- [ ] All tasks marked complete
- [ ] PR merged to main
- [ ] Feature works in production
- [ ] Documentation updated (CLAUDE.md, DECISIONS.md)
- [ ] No console errors
- [ ] Tested on desktop and mobile
