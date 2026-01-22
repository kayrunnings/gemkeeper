# GemKeeper - Epic 6: AI-Powered Features

## Overview

Leverage AI to enhance gem capture by extracting insights from long-form content automatically.

**Tech Stack:** Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Google Gemini

**Repo:** github.com/kayrunnings/gemkeeper

**Linear Issues:** KAY-41 (Epic), KAY-42 (US-6.1)

## Current State

- ✅ Epics 1-4 complete (Auth, Gem Capture, Gem Management, Proactive Surfacing)
- ✅ Database tables created: `ai_extractions`, `ai_usage`
- ✅ Profile columns added: `ai_consent_given`, `ai_consent_date`
- ✅ Gemini API key configured in Vercel

---

## Task 6.1: AI Privacy Consent Modal

**Create:** `components/ai-consent-modal.tsx`

**Requirements:**
- Modal shown ONCE before first AI extraction
- Clear disclosure text:
  ```
  AI-Powered Gem Extraction

  When you use this feature, your pasted content will be sent to 
  Google's Gemini AI to extract key insights.

  • Your content is processed but not stored by Google
  • Extracted gems are saved to your GemKeeper account
  • You can review and edit all extracted gems before saving
  
  You can disable AI features anytime in Settings.
  ```
- Two buttons: "I Understand, Continue" / "Cancel"
- On consent: update `profiles.ai_consent_given = true` and `profiles.ai_consent_date`

**Add to Settings page:**
- Toggle: "Enable AI features" (shows consent status)
- If enabled, show consent date
- Can revoke consent (sets `ai_consent_given = false`)

**Commit:** `feat(ai): Add AI privacy consent modal and settings`

---

## Task 6.2: Gemini API Integration

**Create:** `lib/ai/gemini.ts`

**Install dependency:**
```bash
npm install @google/generative-ai
```

**Requirements:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface ExtractedGem {
  content: string;        // The extracted insight (max 200 chars)
  context_tag: ContextTag;
  source_quote?: string;  // Original text this was derived from
}

export interface ExtractionResult {
  gems: ExtractedGem[];
  tokens_used: number;
}

export async function extractGemsFromContent(
  content: string,
  source?: string
): Promise<ExtractionResult>
```

**System prompt for extraction:**
```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are a wisdom extractor for GemKeeper, an app that helps users capture and apply insights.

Given text content, identify 3-7 key insights that would be valuable to remember and apply in daily life.

For each insight:
1. Extract a concise, memorable phrase (under 200 characters)
2. Focus on actionable wisdom, not facts or summaries
3. Prefer direct quotes when they're powerful, otherwise paraphrase
4. Suggest the most appropriate context tag

Context tags (pick the best fit):
- meetings: Insights for professional meetings, 1:1s, standups
- feedback: Giving or receiving feedback, performance conversations
- conflict: Handling disagreements, difficult conversations
- focus: Productivity, deep work, concentration
- health: Physical/mental wellness, self-care
- relationships: Personal relationships, communication
- parenting: Child-rearing, family dynamics
- other: Doesn't fit above categories

Return valid JSON only, no markdown code blocks:
{
  "gems": [
    {
      "content": "The extracted insight text",
      "context_tag": "feedback",
      "source_quote": "Original text this came from (if applicable)"
    }
  ]
}`;
```

**API call implementation:**
```typescript
export async function extractGemsFromContent(
  content: string,
  source?: string
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  });

  const userPrompt = source 
    ? `Source: ${source}\n\nContent:\n${content}`
    : content;

  const result = await model.generateContent([
    { text: EXTRACTION_SYSTEM_PROMPT },
    { text: userPrompt },
  ]);

  const response = result.response;
  const text = response.text();
  const parsed = JSON.parse(text);

  const usage = response.usageMetadata;
  const tokensUsed = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0);

  return {
    gems: parsed.gems,
    tokens_used: tokensUsed,
  };
}
```

**Commit:** `feat(ai): Add Gemini API integration for gem extraction`

---

## Task 6.3: Rate Limiting Service

**Create:** `lib/ai/rate-limit.ts`

**Requirements:**
```typescript
const DAILY_EXTRACTION_LIMIT = 10;
const DAILY_TOKEN_LIMIT = 50000;

export interface UsageStatus {
  extractionsToday: number;
  extractionsRemaining: number;
  tokensToday: number;
  canExtract: boolean;
  resetTime: Date;
}

export async function checkUsageLimit(userId: string): Promise<UsageStatus>

export async function recordUsage(
  userId: string, 
  tokensUsed: number
): Promise<void>

export async function getCachedExtraction(
  userId: string, 
  contentHash: string
): Promise<ExtractionResult | null>

export async function cacheExtraction(
  userId: string,
  contentHash: string,
  content: string,
  source: string | null,
  result: ExtractionResult
): Promise<void>
```

**Hash function for caching:**
```typescript
import { createHash } from 'crypto';

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
```

**Commit:** `feat(ai): Add rate limiting and caching for AI extractions`

---

## Task 6.4: Extract Gems API Route

**Create:** `app/api/ai/extract/route.ts`

**Requirements:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractGemsFromContent } from '@/lib/ai/gemini';
import { checkUsageLimit, recordUsage, getCachedExtraction, cacheExtraction, hashContent } from '@/lib/ai/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check AI consent
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_consent_given')
    .eq('id', user.id)
    .single();
  
  if (!profile?.ai_consent_given) {
    return NextResponse.json({ error: 'AI consent required' }, { status: 403 });
  }

  // 3. Parse request
  const { content, source } = await request.json();
  
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }
  
  if (content.length > 10000) {
    return NextResponse.json({ error: 'Content exceeds 10,000 character limit' }, { status: 400 });
  }

  // 4. Check rate limit
  const usage = await checkUsageLimit(user.id);
  if (!usage.canExtract) {
    return NextResponse.json({ 
      error: 'Daily limit reached',
      usage,
    }, { status: 429 });
  }

  // 5. Check cache
  const contentHash = hashContent(content);
  const cached = await getCachedExtraction(user.id, contentHash);
  if (cached) {
    return NextResponse.json({ 
      gems: cached.gems,
      cached: true,
      usage,
    });
  }

  // 6. Call Gemini API
  try {
    const result = await extractGemsFromContent(content, source);
    
    // 7. Record usage and cache result
    await recordUsage(user.id, result.tokens_used);
    await cacheExtraction(user.id, contentHash, content, source ?? null, result);

    // 8. Return extracted gems
    const updatedUsage = await checkUsageLimit(user.id);
    return NextResponse.json({
      gems: result.gems,
      cached: false,
      usage: updatedUsage,
    });
  } catch (error) {
    console.error('AI extraction error:', error);
    return NextResponse.json({ 
      error: 'Failed to extract gems. Please try again.' 
    }, { status: 500 });
  }
}
```

**Commit:** `feat(ai): Add gem extraction API endpoint`

---

## Task 6.5: Extract Gems UI - Entry Point

**Update:** Gem capture UI (add tab or button)

**Requirements:**
- Add "Extract from Content" option to gem capture flow
- Can be a tab toggle: "Manual" | "Extract from Content"
- Or an "Extract Gems" button in the gems page header that opens a modal

**Commit:** `feat(ai): Add extract gems entry point to capture UI`

---

## Task 6.6: Extract Gems UI - Extraction Modal

**Create:** `components/extract-gems-modal.tsx`

**Requirements:**

**Step 1 - Input:**
- Large textarea: "Paste article, book notes, or transcript..."
- Character count: "X / 10,000 characters"
- Optional source field: "Source (e.g., book title, article name)"
- "Extract Gems" button (disabled if empty or over limit)
- Usage indicator: "X extractions remaining today"

**Step 2 - Loading:**
- Spinner with message: "Analyzing content..."
- Estimated time: "This usually takes 5-10 seconds"

**Step 3 - Review & Select:**
- Header: "Found X potential gems"
- List of extracted gems, each with:
  - Checkbox (default checked)
  - Gem content (editable inline or via edit icon)
  - Context tag badge (editable via dropdown)
  - Source quote preview (collapsed, expandable)
- Active gem count warning: "You have Y/10 active gems. You can save up to Z more."
- If selection would exceed 10: disable save, show message
- Buttons: "Save Selected (N)" / "Try Again" / "Cancel"

**Step 4 - Confirmation:**
- Success message: "Added N gems to your collection!"
- "View Gems" button → navigate to `/gems`

**Commit:** `feat(ai): Add extract gems modal with review flow`

---

## Task 6.7: Extracted Gem Preview Card

**Create:** `components/extracted-gem-card.tsx`

**Requirements:**
- Checkbox for selection
- Gem content (truncated to 2 lines with "..." if longer)
- Editable: click to expand/edit full content
- Context tag dropdown (pre-selected with AI suggestion)
- Optional: "Source quote" accordion/collapsible

```typescript
interface ExtractedGemCardProps {
  gem: ExtractedGem;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: (gem: ExtractedGem) => void;
}
```

**Commit:** `feat(ai): Add extracted gem preview card component`

---

## Task 6.8: Save Extracted Gems

**Add to:** `lib/gems.ts`

```typescript
export async function createMultipleGems(
  gems: Array<{
    content: string;
    context_tag: ContextTag;
    source?: string;
    source_url?: string;
  }>
): Promise<Gem[]>
```

**Requirements:**
- Validate total active gems won't exceed 10
- Insert all gems in a single transaction if possible
- Return created gems with IDs
- Handle partial failures gracefully

**Create or update:** `app/api/gems/bulk/route.ts`
- POST endpoint that accepts array of gems
- Returns created gems

**Commit:** `feat(ai): Add bulk gem creation for extracted gems`

---

## Task 6.9: Usage Display in Settings

**Update:** `app/settings/page.tsx`

**Add AI section:**
- "AI Features" heading
- Consent status: "Enabled on [date]" or "Not enabled"
- If enabled:
  - Toggle to disable AI features
  - Today's usage: "X/10 extractions used"
  - Token usage: "~X tokens used today"
  - Reset time: "Resets at midnight"
- If not enabled:
  - "Enable AI Features" button → shows consent modal

**Commit:** `feat(ai): Add AI usage display to settings`

---

## Task 6.10: Error Handling & Edge Cases

**Update:** All AI components

**Handle these cases:**
1. **AI returns invalid JSON:** Show error, offer "Try Again"
2. **AI returns 0 gems:** "No actionable insights found. Try pasting different content."
3. **Rate limit hit:** Show usage stats, time until reset
4. **Network error:** "Connection failed. Check your internet and try again."
5. **Content too short:** "Please paste at least 100 characters for extraction."
6. **All gems already at limit:** "You have 10 active gems. Retire some before extracting more."

**Create:** `components/extraction-error.tsx`
- Reusable error display component
- Shows appropriate message based on error type
- "Try Again" or "Go to Gems" actions

**Commit:** `feat(ai): Add comprehensive error handling for extraction`

---

## Database Reference

### Existing Tables

**profiles** - added columns:
```sql
ai_consent_given BOOLEAN DEFAULT false
ai_consent_date TIMESTAMPTZ
```

**gems:**
```sql
id, user_id, content, source, source_url, context_tag, custom_context,
status ('active'|'retired'|'graduated'), application_count, skip_count,
last_surfaced_at, last_applied_at, retired_at, graduated_at, created_at, updated_at
```

### New Tables

**ai_extractions:**
```sql
id, user_id, input_content, input_hash, source, extracted_gems (JSONB),
tokens_used, created_at
```

**ai_usage:**
```sql
id, user_id, usage_date, extraction_count, tokens_used, created_at, updated_at
```

---

## Commit Order

1. `feat(ai): Add AI privacy consent modal and settings`
2. `feat(ai): Add Gemini API integration for gem extraction`
3. `feat(ai): Add rate limiting and caching for AI extractions`
4. `feat(ai): Add gem extraction API endpoint`
5. `feat(ai): Add extract gems entry point to capture UI`
6. `feat(ai): Add extract gems modal with review flow`
7. `feat(ai): Add extracted gem preview card component`
8. `feat(ai): Add bulk gem creation for extracted gems`
9. `feat(ai): Add AI usage display to settings`
10. `feat(ai): Add comprehensive error handling for extraction`

---

## Testing Checklist

- [ ] AI consent modal appears on first extraction attempt
- [ ] Can accept or decline AI consent
- [ ] AI consent status shown in settings
- [ ] Can revoke AI consent in settings
- [ ] "Extract Gems" option visible in gem capture UI
- [ ] Can paste content up to 10,000 characters
- [ ] Character count updates in real-time
- [ ] Loading state shows during extraction
- [ ] Extracted gems display with checkboxes
- [ ] Can edit extracted gem content before saving
- [ ] Can change suggested context tags
- [ ] Cannot save more gems than remaining slots (10 - active)
- [ ] Bulk save creates all selected gems
- [ ] Rate limit warning shows when approaching limit
- [ ] Rate limit block shows when limit reached
- [ ] Cached extractions return immediately (same content)
- [ ] Error messages display appropriately for each error type
- [ ] Usage stats accurate in settings page
- [ ] "Try Again" re-runs extraction with same content

---

## Environment Variables

```
GOOGLE_AI_API_KEY=your_gemini_api_key
```

## Dependencies

```bash
npm install @google/generative-ai
```
