# Epic 9: Custom Contexts, Configurable Limits & URL Extraction

## Overview

Expand ThoughtFolio from global 10-thought limit to contextual organization with Active List. Add URL-based thought extraction.

**PRD:** See `Claude Context/PRD.md`
**Database:** Migration SQL has been run in Supabase

## Current State

- [x] Database migration complete (contexts table, gems columns, triggers)
- [x] Types updated
- [x] API routes created
- [x] UI updated (Context Settings)
- [ ] URL extraction not implemented

## Tasks

### Phase 1: Foundation (Types & API)

#### 1.0 Update Type Definitions (traces to: FR-1.1, FR-3.1)
- [x] 1.1 Create `lib/types/context.ts` with Context interface
- [x] 1.2 Update `lib/types/thought.ts` to include `context_id`, `is_on_active_list`
- [x] 1.3 Keep `ContextTag` as deprecated alias for backwards compat
- [x] 1.4 Add `MAX_ACTIVE_LIST = 10` constant
- [x] 1.5 Update imports across codebase

#### 2.0 Create Context Service (traces to: FR-1.1 through FR-1.8)
- [x] 2.1 Create `lib/contexts.ts` with CRUD functions:
  - `getContexts()` - list with thought counts
  - `getContextBySlug(slug)` - single context
  - `createContext(input)` - create custom
  - `updateContext(id, input)` - update name/color/limit
  - `deleteContext(id)` - delete, move thoughts to "Other"
  - `getContextThoughtCount(contextId)` - count
- [x] 2.2 Add validation: unique names, max 50 chars, can't delete defaults
- [x] 2.3 Write unit tests

#### 3.0 Create Context API Routes (traces to: FR-1.1 through FR-1.8)
- [x] 3.1 Create `app/api/contexts/route.ts` (GET, POST)
- [x] 3.2 Create `app/api/contexts/[id]/route.ts` (GET, PUT, DELETE)
- [x] 3.3 Add error handling and validation
- [x] 3.4 Test API routes (TypeScript compilation verified)

#### 4.0 Update Thought Service for Active List (traces to: FR-3.1 through FR-3.5)
- [x] 4.1 Update `lib/thoughts.ts` for `context_id` and `is_on_active_list`
- [x] 4.2 Add `toggleActiveList(thoughtId)` with limit check
- [x] 4.3 Add `getActiveListCount()` function
- [x] 4.4 Update `createMultipleThoughts()` for `context_id`
- [x] 4.5 Update daily prompt query: filter `is_on_active_list = true`
- [x] 4.6 Verify Moments queries ALL thoughts (added `getAllThoughtsForMoments()`)

### Phase 2: Settings UI

#### 5.0 Context Management UI (traces to: US-1)
- [x] 5.1 Create `components/settings/ContextSettings.tsx`
  - List contexts with counts
  - Add/edit/delete actions
- [x] 5.2 Create `components/settings/ContextForm.tsx`
- [x] 5.3 Add color picker (preset colors)
- [x] 5.4 Integrate into `app/settings/page.tsx`
- [ ] 5.5 Test CRUD in UI

### Phase 3: Thought UI Updates

#### 6.0 Update Thought Creation (traces to: FR-2.4, FR-2.5)
- [x] 6.1 Update `components/gems/gem-form.tsx` - context dropdown from API
- [x] 6.2 Update `components/extract-gems-modal.tsx` - context dropdown
- [x] 6.3 Show per-context limit ("Coding: 12/20")
- [x] 6.4 Block creation if context full

#### 7.0 Update Thought Cards & List (traces to: FR-3.3, FR-3.4, FR-3.5)
- [x] 7.1 Add Active badge to gem cards (in page.tsx)
- [x] 7.2 Add toggle Active action button
- [x] 7.3 Show context badge (colored)
- [x] 7.4 Add filter tabs: All / Active / Passive
- [x] 7.5 Add context filter dropdown
- [x] 7.6 Show Active count ("Active: 7/10")

#### 8.0 Update Thought Detail (traces to: US-1, FR-3.3)
- [x] 8.1 Show context on detail page
- [x] 8.2 Add Active toggle
- [x] 8.3 Allow changing context

### Phase 4: URL Extraction

#### 9.0 Article Extraction Backend (traces to: FR-6.2 through FR-6.9)
- [x] 9.1 Install `@mozilla/readability` and `jsdom`
- [x] 9.2 Create `lib/url-extractor.ts`:
  - `detectUrlType(url)` - 'article' | 'youtube' | 'unknown'
  - `extractArticleContent(url)` - fetch + Readability
  - (YouTube transcript handled in Task 10.0)
- [x] 9.3 Create `app/api/extract/url/route.ts`
- [x] 9.4 Add 10 second timeout
- [x] 9.5 Error handling for paywalls, 404s
- [ ] 9.6 Write tests (deferred to Phase 5)

#### 10.0 YouTube Extraction (traces to: FR-6.5)
- [x] 10.1 Install `youtube-transcript`
- [x] 10.2 Implement transcript extraction
- [x] 10.3 Handle "no transcript" gracefully
- [x] 10.4 Extract video title for source (via oEmbed API)
- [ ] 10.5 Test with various URLs (deferred to Phase 5)

#### 11.0 URL Extraction UI (traces to: FR-6.2, FR-6.6, FR-6.7)
- [ ] 11.1 Update `components/extract-gems-modal.tsx`:
  - Tab 1: "Paste Text" (existing)
  - Tab 2: "From URL" (new)
- [ ] 11.2 URL input with Extract button
- [ ] 11.3 Loading state
- [ ] 11.4 Error with manual paste fallback
- [ ] 11.5 Pre-populate suggested context
- [ ] 11.6 End-to-end test

### Phase 5: Polish

#### 12.0 Update AI Prompts (traces to: FR-6.8)
- [ ] 12.1 Update extraction prompt to suggest context
- [ ] 12.2 Add context to response type
- [ ] 12.3 Test suggestions

#### 13.0 Documentation
- [ ] 13.1 Update ARCHITECTURE.md (done via this epic)
- [ ] 13.2 Update type definitions in docs

#### 14.0 Testing & Verification
- [ ] 14.1 Test context CRUD
- [ ] 14.2 Test Active List limit (10)
- [ ] 14.3 Test per-context limit
- [ ] 14.4 Test URL extraction (Substack, Medium, blogs)
- [ ] 14.5 Test YouTube extraction
- [ ] 14.6 Test daily prompts = Active only
- [ ] 14.7 Test Moments = all thoughts
- [ ] 14.8 Verify migration data correct

## Relevant Files

### Types
- `lib/types/thought.ts` - updated
- `lib/types/context.ts` - created
- `lib/types/index.ts` - created

### Services
- `lib/contexts.ts` - created
- `lib/thoughts.ts` - updated (Active List support)
- `lib/url-extractor.ts` - create
- `lib/ai/gemini.ts` - update prompts

### API Routes
- `app/api/contexts/route.ts` - created
- `app/api/contexts/[id]/route.ts` - created
- `app/api/extract/url/route.ts` - create

### Components
- `components/settings/ContextSettings.tsx` - create
- `components/settings/ContextForm.tsx` - create
- `components/gems/gem-card.tsx` - update
- `components/gems/gem-form.tsx` - update
- `components/extract-gems-modal.tsx` - update

### Pages
- `app/settings/page.tsx` - update
- `app/gems/page.tsx` - update
- `app/gems/[id]/page.tsx` - update

## Acceptance Criteria

- [ ] User can create, edit, delete custom contexts
- [ ] Default contexts cannot be deleted
- [ ] Each context shows thought count vs limit
- [ ] User can toggle thoughts on/off Active List
- [ ] Active List capped at 10 (enforced)
- [ ] Daily prompts only show Active thoughts
- [ ] Moments searches all thoughts, all contexts
- [ ] User can extract from article URLs
- [ ] User can extract from YouTube (when transcript available)
- [ ] Graceful fallback when extraction fails
- [ ] All existing data works after migration

## Notes for Claude Code

1. **Database migration already done** - use new columns, don't create migration
2. **Backwards compatibility** - keep `context_tag` working during transition
3. **Active List != status** - thought can be `status: active` but `is_on_active_list: false`
4. **Test with real URLs** - Substack, Medium, dev.to, YouTube
5. **Check Linear** - create issues for phases if needed
