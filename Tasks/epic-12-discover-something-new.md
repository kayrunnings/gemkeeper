# Epic 12: Discover Something New!

## Overview

Add AI-powered content discovery to ThoughtFolio. Users can discover new knowledge from the web based on their contexts and interests, with three discovery paths: free-text search, context selection, or curated "Surprise Me" mix.

**Linear Epic:** KAY-91
**Branch:** `karanvaish93/kay-91-epic-12-discover-something-new`

---

## Current State

- ❌ Database tables not created
- ❌ API routes not implemented
- ❌ Discovery service not implemented
- ❌ Dashboard card not added
- ❌ Discovery grid not implemented
- ❌ Save/skip flows not implemented

---

## Phase 1: Foundation (Database + Types + Service)

### 1.0 Database Migration (Kay runs in Supabase)
- [ ] Run SQL migration to create tables:
  - `discoveries` - stores generated discoveries
  - `discovery_usage` - tracks daily limits
  - `discovery_skips` - tracks skipped content
- [ ] Verify RLS policies are active
- [ ] Test `get_context_discovery_weights` function

### 2.0 TypeScript Types (KAY-92)
- [ ] 2.1 Create `lib/types/discovery.ts`:
  ```typescript
  export interface Discovery {
    id: string;
    user_id: string;
    session_type: 'curated' | 'directed';
    query: string | null;
    context_id: string | null;
    thought_content: string;
    source_title: string;
    source_url: string;
    source_type: 'article' | 'video' | 'research' | 'blog';
    article_summary: string;
    relevance_reason: string;
    content_type: 'trending' | 'evergreen';
    suggested_context_id: string | null;
    suggested_context_name?: string;
    status: 'pending' | 'saved' | 'skipped';
    saved_gem_id: string | null;
    created_at: string;
    updated_at: string;
  }

  export interface DiscoveryUsage {
    curated_used: boolean;
    directed_used: boolean;
    curated_remaining: number;
    directed_remaining: number;
  }

  export interface GenerateDiscoveriesInput {
    mode: 'curated' | 'directed';
    query?: string;
    context_id?: string;
  }

  export interface SaveDiscoveryInput {
    discovery_id: string;
    thought_content: string;
    context_id: string;
    is_on_active_list?: boolean;
    save_article_as_note?: boolean;
  }

  export interface ContextWeight {
    context_id: string;
    context_name: string;
    thought_count: number;
    weight: number;
  }
  ```
- [ ] 2.2 Export types from `lib/types/index.ts`

### 3.0 Discovery Service (KAY-92)
- [ ] 3.1 Create `lib/discovery.ts` with functions:
  - `getDiscoveryUsage(userId)` - check daily limits
  - `getContextWeights(userId)` - get weighted context list
  - `checkContentSkipped(userId, url)` - check if URL was skipped
  - `createDiscoveries(userId, discoveries[])` - store discoveries
  - `updateDiscoveryStatus(id, status, savedGemId?)` - update status
  - `addSkippedContent(userId, url)` - add to skip list
  - `incrementUsage(userId, sessionType)` - update counters
- [ ] 3.2 Add hash utility for URL deduplication

### 4.0 Gemini Discovery Integration (KAY-92)
- [ ] 4.1 Add `generateDiscoveries` function to `lib/ai/gemini.ts`:
  - Accept mode, query, contexts, existing thoughts
  - Use Gemini grounding for web search
  - Return structured discovery objects
  - Handle trending vs evergreen classification
- [ ] 4.2 Create discovery prompt template:
  ```
  You are helping a user discover new knowledge and insights.
  
  User's contexts: {contexts}
  User's existing thoughts in this area: {sample_thoughts}
  
  {mode_specific_instructions}
  
  Find 4 high-quality articles or content pieces. For each:
  1. Extract a key insight (max 200 characters)
  2. Provide the source title and URL
  3. Write a 2-3 sentence summary
  4. Explain why this is relevant to the user
  5. Classify as "trending" (published recently) or "evergreen" (timeless)
  6. Suggest which context it fits best
  
  Return as JSON array.
  ```

---

## Phase 2: API Routes

### 5.0 Discovery API Routes (KAY-93)
- [ ] 5.1 Create `app/api/discover/route.ts` (POST):
  - Validate request (mode, optional query/context_id)
  - Check usage limits
  - Get context weights for curated mode
  - Call Gemini to generate discoveries
  - Filter out skipped content
  - Store discoveries in database
  - Increment usage counter
  - Return discoveries + remaining counts
- [ ] 5.2 Create `app/api/discover/save/route.ts` (POST):
  - Validate discovery exists and belongs to user
  - Create thought with source info
  - Optionally create note with article summary
  - Update discovery status to 'saved'
  - Link saved_gem_id
  - Return created thought
- [ ] 5.3 Create `app/api/discover/skip/route.ts` (POST):
  - Update discovery status to 'skipped'
  - Add URL hash to discovery_skips
  - Return success
- [ ] 5.4 Create `app/api/discover/usage/route.ts` (GET):
  - Return current day's usage status

---

## Phase 3: Dashboard Card

### 6.0 Discovery Card Component (KAY-94)
- [ ] 6.1 Create `components/discover/DiscoverCard.tsx`:
  - Text input for free-form query
  - Context chips (from user's contexts)
  - "Surprise Me" button
  - Loading state
  - Disabled state when both sessions used
- [ ] 6.2 Create `components/discover/ContextChip.tsx`:
  - Display context name + color
  - Clickable to trigger discovery
  - Show thought count badge
- [ ] 6.3 Add DiscoverCard to Dashboard page
- [ ] 6.4 Style with glassmorphism (match existing UI)

---

## Phase 4: Discovery Grid & Detail

### 7.0 Discovery Grid Component (KAY-95)
- [ ] 7.1 Create `components/discover/DiscoveryGrid.tsx`:
  - 2x2 grid of discovery cards
  - Header showing query/context
  - "Done" button to exit
  - Tip about adding thoughts for better results
- [ ] 7.2 Create `components/discover/DiscoveryCard.tsx`:
  - Context icon + name
  - Thought preview (truncated)
  - Source name
  - Trending/Evergreen badge
  - "View & Save" button
  - Saved/Skipped state display
- [ ] 7.3 Create `components/discover/DiscoveryDetail.tsx`:
  - Full thought content
  - Source title + link
  - Content type badge
  - "Why this for you" section
  - Article summary
  - "Read full article" link
  - "Not for me" / "Save This Thought" buttons

### 8.0 Save Discovery Flow (KAY-95)
- [ ] 8.1 Create `components/discover/SaveDiscoveryModal.tsx`:
  - Editable thought text
  - Context dropdown (pre-filled)
  - "Create new context" option
  - "Add to Active List" checkbox
  - "Save article as Note" checkbox
  - Save button
- [ ] 8.2 Wire up save API call
- [ ] 8.3 Update grid card to show "Saved" state
- [ ] 8.4 Show success toast

### 9.0 Skip Discovery Flow (KAY-95)
- [ ] 9.1 Wire up skip API call from detail view
- [ ] 9.2 Update grid card to show "Skipped" state (greyed out)
- [ ] 9.3 No confirmation needed (lightweight)

---

## Phase 5: States & Polish

### 10.0 Empty & Limit States (KAY-96)
- [ ] 10.1 Create "Both sessions used" state:
  - "You've explored all your discoveries for today! 🎉"
  - Show count of saved thoughts today
  - "Come back tomorrow" message
- [ ] 10.2 Create "Curated used, directed available" state:
  - Grey out context chips + Surprise Me
  - Highlight text input
  - "You can still search for a specific topic!"
- [ ] 10.3 Create "Directed used, curated available" state:
  - Grey out text input
  - Highlight context chips + Surprise Me

### 11.0 Bootstrap State (KAY-96)
- [ ] 11.1 Create state for users with few contexts/thoughts:
  - "To get personalized discoveries..."
  - Show current context/thought counts
  - CTAs: "Add a Context", "Capture a Thought"
  - "Or try a generic discovery anyway" link
- [ ] 11.2 Determine threshold (e.g., <2 contexts or <3 thoughts)

### 12.0 Error Handling (KAY-96)
- [ ] 12.1 Handle Gemini API errors gracefully
- [ ] 12.2 Handle "no results" for obscure queries
- [ ] 12.3 Add retry option on failure
- [ ] 12.4 Log errors for debugging

### 13.0 Polish & Testing (KAY-96)
- [ ] 13.1 Add loading skeletons for grid
- [ ] 13.2 Add animations for card state changes
- [ ] 13.3 Test on mobile (responsive grid)
- [ ] 13.4 Test daily limit reset
- [ ] 13.5 Verify skip tracking works across days
- [ ] 13.6 Update CLAUDE.md with new feature
- [ ] 13.7 Update Linear issues to Done

---

## Relevant Files

### New Files to Create
- `lib/types/discovery.ts` — Discovery types
- `lib/discovery.ts` — Discovery service
- `app/api/discover/route.ts` — Generate discoveries
- `app/api/discover/save/route.ts` — Save discovery
- `app/api/discover/skip/route.ts` — Skip discovery
- `app/api/discover/usage/route.ts` — Get usage
- `components/discover/DiscoverCard.tsx` — Dashboard entry point
- `components/discover/ContextChip.tsx` — Context selector
- `components/discover/DiscoveryGrid.tsx` — Grid view
- `components/discover/DiscoveryCard.tsx` — Individual card
- `components/discover/DiscoveryDetail.tsx` — Expanded view
- `components/discover/SaveDiscoveryModal.tsx` — Save flow

### Files to Modify
- `lib/ai/gemini.ts` — Add discovery generation
- `app/dashboard/page.tsx` — Add DiscoverCard
- `lib/types/index.ts` — Export new types

---

## Acceptance Criteria

- [ ] Dashboard shows "Discover Something New!" card
- [ ] Three paths work: free-text, context chips, surprise me
- [ ] Grid shows 4 discoveries per session
- [ ] Expanded view shows full detail + summary
- [ ] Save flow allows editing thought + changing context
- [ ] Skip flow is lightweight (single click)
- [ ] Daily limits enforced (4 curated + 4 directed)
- [ ] Skipped content doesn't reappear
- [ ] States handle: both used, one used, bootstrap
- [ ] Mobile responsive
- [ ] Glassmorphism styling matches app
- [ ] Linear issues updated
- [ ] Documentation updated

---

## Definition of Done

- [ ] All tasks marked complete
- [ ] All PRs merged to main
- [ ] Feature works in production (gemkeeper.vercel.app)
- [ ] Linear issues marked Done
- [ ] CLAUDE.md updated
- [ ] No console errors
