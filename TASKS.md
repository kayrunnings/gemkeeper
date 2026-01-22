# GemKeeper - Epic 6: AI-Powered Features + Notes System

## Overview

Leverage AI to enhance gem capture by extracting insights from long-form content and media. Build out a full Notes system that serves as a staging area for ideas before they become gems.

**Tech Stack:** Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Google Gemini

**Repo:** github.com/kayrunnings/gemkeeper

**Deployed:** gemkeeper.vercel.app

**Linear Issues:** KAY-41 (Epic), KAY-42 (US-6.1)

---

## Current State

- ✅ Epics 1-4 complete (Auth, Gem Capture, Gem Management, Proactive Surfacing)
- ✅ Database tables created: `ai_extractions`, `ai_usage`, `notes`, `note_attachments`
- ✅ Profile columns added: `ai_consent_given`, `ai_consent_date`
- ✅ Gemini API key configured in Vercel (`GOOGLE_AI_API_KEY`)
- ✅ Supabase Storage bucket: `note-attachments` with RLS policies
- ✅ Task 6.1 complete (AI Privacy Consent Modal)
- ✅ Task 6.9 complete (Usage Display in Settings)

---

## Environment Variables

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For Epic 6
GOOGLE_AI_API_KEY=your_gemini_api_key
```

---

## Dependencies to Install

```bash
npm install @google/generative-ai
```

---

## Database Schema Reference

### Existing Tables (already created)

**ai_extractions** - Caches AI extraction results
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| input_content | TEXT | Original content submitted |
| input_hash | VARCHAR(64) | SHA-256 hash for caching |
| source | TEXT | User-provided source attribution |
| extracted_gems | JSONB | Array of extracted gems |
| tokens_used | INTEGER | Tokens consumed |
| created_at | TIMESTAMPTZ | Creation timestamp |

**ai_usage** - Daily rate limiting
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| usage_date | DATE | Date of usage |
| extraction_count | INTEGER | Extractions today |
| tokens_used | INTEGER | Tokens used today |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update |

**notes** - User notes (staging area for gems)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| title | TEXT | Optional note title |
| content | TEXT | Note content |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update |

**note_attachments** - Media files attached to notes
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| note_id | UUID | References notes |
| user_id | UUID | References auth.users |
| file_name | TEXT | Original filename |
| file_type | TEXT | MIME type (image/png, etc.) |
| file_size | INTEGER | Size in bytes |
| storage_path | TEXT | Path in Supabase Storage |
| created_at | TIMESTAMPTZ | Creation timestamp |

**profiles** - Additional columns for AI
| Column | Type | Description |
|--------|------|-------------|
| ai_consent_given | BOOLEAN | User consented to AI |
| ai_consent_date | TIMESTAMPTZ | When consent was given |

---

## PART 1: Text-Based AI Extraction (Tasks 6.2 - 6.8, 6.10)

### Task 6.2: Gemini API Integration ⬜

**Create:** `lib/ai/gemini.ts`

**Requirements:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface ExtractedGem {
  content: string;        // The extracted insight (max 200 chars)
  context_tag: ContextTag;
  source_quote?: string;  // Original text this was derived from
  confidence?: number;    // 0-1 confidence score (optional)
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
4. Assign a context tag from: meetings, feedback, conflict, focus, health, relationships, parenting, other
5. Include the source_quote if directly quoting

Respond ONLY with valid JSON in this format:
{
  "gems": [
    {
      "content": "The insight text",
      "context_tag": "meetings",
      "source_quote": "Original quote if applicable"
    }
  ]
}`;
```

**Implementation:**
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

### Task 6.3: Rate Limiting Service ⬜

**Create:** `lib/ai/rate-limit.ts`

**Requirements:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

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

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
```

**Implementation details:**
- Query `ai_usage` table for today's usage
- Upsert usage record after each extraction
- Check `ai_extractions` table for cached results by hash
- Reset time is midnight UTC

**Commit:** `feat(ai): Add rate limiting and caching for AI extractions`

---

### Task 6.4: Extract Gems API Route ⬜

**Create:** `app/api/ai/extract/route.ts`

**Requirements:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractGemsFromContent } from '@/lib/ai/gemini';
import { 
  checkUsageLimit, 
  recordUsage, 
  getCachedExtraction, 
  cacheExtraction, 
  hashContent 
} from '@/lib/ai/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();
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

  // 3. Parse request body
  const { content, source } = await request.json();
  
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > 10000) {
    return NextResponse.json({ error: 'Content too long (max 10,000 chars)' }, { status: 400 });
  }

  // 4. Check rate limit
  const usage = await checkUsageLimit(user.id);
  if (!usage.canExtract) {
    return NextResponse.json({ 
      error: 'Daily limit reached',
      usage 
    }, { status: 429 });
  }

  // 5. Check cache
  const contentHash = hashContent(content);
  const cached = await getCachedExtraction(user.id, contentHash);
  if (cached) {
    return NextResponse.json({ 
      gems: cached.gems,
      cached: true,
      usage 
    });
  }

  // 6. Call Gemini API
  try {
    const result = await extractGemsFromContent(content, source);

    // 7. Record usage and cache result
    await recordUsage(user.id, result.tokens_used);
    await cacheExtraction(user.id, contentHash, content, source || null, result);

    // 8. Return extracted gems
    const updatedUsage = await checkUsageLimit(user.id);
    return NextResponse.json({
      gems: result.gems,
      cached: false,
      usage: updatedUsage
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
```

**Commit:** `feat(ai): Add extract gems API route with rate limiting`

---

### Task 6.5: Extract Gems UI - Entry Point ⬜

**Modify:** `app/(protected)/gems/page.tsx` or wherever the gem creation UI lives

**Requirements:**
- Add "Extract from Content" button/tab alongside manual gem entry
- Button shows sparkle/AI icon to indicate AI feature
- Clicking opens the extraction modal (Task 6.6)
- If user hasn't given AI consent, show consent modal first (already built in 6.1)

**UI mockup:**
```
[+ Add Gem]  [✨ Extract from Content]
```

**Commit:** `feat(ai): Add extract gems entry point to gem creation UI`

---

### Task 6.6: Extract Gems UI - Extraction Modal ⬜

**Create:** `components/extract-gems-modal.tsx`

**Requirements:**
- Full-screen modal or slide-over panel
- Two-step flow:
  1. **Input step:** Textarea for pasting content + optional source field
  2. **Review step:** Show extracted gems with checkboxes

**Input step UI:**
```
┌─────────────────────────────────────────────┐
│  ✨ Extract Gems from Content               │
│                                             │
│  Source (optional):                         │
│  ┌─────────────────────────────────────┐   │
│  │ e.g., "Atomic Habits by James Clear"│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Paste your content:                        │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│  0 / 10,000 characters                      │
│                                             │
│  [Cancel]              [Extract Gems ✨]    │
└─────────────────────────────────────────────┘
```

**Review step UI:**
```
┌─────────────────────────────────────────────┐
│  ✨ Review Extracted Gems                   │
│                                             │
│  We found 5 gems. Select which to save:     │
│                                             │
│  ☑ "Start with the end in mind"             │
│    Tag: [Focus ▼]                [Edit]     │
│                                             │
│  ☑ "Be proactive, not reactive"             │
│    Tag: [Meetings ▼]             [Edit]     │
│                                             │
│  ☐ "Seek first to understand"               │
│    Tag: [Feedback ▼]             [Edit]     │
│                                             │
│  ⚠️ You have 8/10 active gems.              │
│     You can save up to 2 more.              │
│                                             │
│  [Back]           [Save 2 Selected Gems]    │
└─────────────────────────────────────────────┘
```

**State management:**
- Track loading state during API call
- Show skeleton/shimmer while extracting
- Track selected gems and edits
- Validate against 10-gem limit

**Commit:** `feat(ai): Add extraction modal with input and review steps`

---

### Task 6.7: Extracted Gem Preview Card ⬜

**Create:** `components/extracted-gem-card.tsx`

**Requirements:**
- Checkbox for selection
- Gem content (editable inline or via modal)
- Context tag dropdown (editable)
- Source quote if present (collapsible)
- Visual indicator if edited from original

**Props:**
```typescript
interface ExtractedGemCardProps {
  gem: ExtractedGem;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: (updates: Partial<ExtractedGem>) => void;
  disabled?: boolean; // When at gem limit
}
```

**Commit:** `feat(ai): Add extracted gem preview card component`

---

### Task 6.8: Save Extracted Gems (Bulk) ⬜

**Create:** `lib/gems.ts` - add bulk save function (or add to existing)

**Requirements:**
```typescript
export async function saveExtractedGems(
  gems: Array<{
    content: string;
    context_tag: ContextTag;
    source?: string;
    source_url?: string;
  }>
): Promise<{ saved: number; errors: string[] }>
```

**Implementation:**
- Validate total won't exceed 10-gem limit
- Insert all gems in a transaction
- Return count of saved gems and any errors

**Update extraction modal:**
- Call this function when user clicks "Save Selected Gems"
- Show success toast with count
- Close modal and refresh gems list
- Handle partial failures gracefully

**Commit:** `feat(ai): Add bulk save for extracted gems`

---

### Task 6.10: Error Handling & Edge Cases ⬜

**Requirements:**

1. **Empty extraction result:**
   - If AI returns 0 gems, show friendly message
   - "We couldn't find any clear insights in this content. Try pasting content with more actionable advice or quotes."

2. **API errors:**
   - Network failure: "Connection failed. Please try again."
   - Rate limit (429): Show usage stats and reset time
   - Server error (500): "Something went wrong. Please try again later."

3. **Content validation:**
   - Too short (< 100 chars): "Content is too short. Please paste more text."
   - Too long (> 10,000 chars): Show character count and trim warning

4. **Gem limit handling:**
   - At limit (10/10): Disable extraction, show retirement prompt
   - Near limit: Show warning with count
   - Selection exceeds remaining: Disable save, show warning

5. **Consent revoked mid-session:**
   - If user revokes consent in another tab, handle gracefully
   - Re-check consent on each extraction attempt

**Commit:** `feat(ai): Add comprehensive error handling for AI extraction`

---

## PART 2: Notes System (Tasks 6.11 - 6.15)

### Task 6.11: Notes Service Functions ⬜

**Create:** `lib/notes.ts`

**Requirements:**
```typescript
import { createClient } from '@/lib/supabase/server';

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  attachments?: NoteAttachment[];
}

export interface NoteAttachment {
  id: string;
  note_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

// CRUD operations
export async function getNotes(): Promise<Note[]>
export async function getNote(id: string): Promise<Note | null>
export async function createNote(data: { title?: string; content?: string }): Promise<Note>
export async function updateNote(id: string, data: { title?: string; content?: string }): Promise<Note>
export async function deleteNote(id: string): Promise<void>

// Attachment operations
export async function addAttachment(
  noteId: string, 
  file: File
): Promise<NoteAttachment>

export async function deleteAttachment(attachmentId: string): Promise<void>

export async function getAttachmentUrl(storagePath: string): Promise<string>
```

**Implementation notes:**
- Use Supabase Storage for file uploads
- Store files as `{user_id}/{note_id}/{filename}`
- Generate signed URLs for viewing attachments
- Delete storage files when attachment record is deleted

**Commit:** `feat(notes): Add notes service with CRUD and attachment operations`

---

### Task 6.12: Notes List UI ⬜

**Create:** `app/(protected)/notes/page.tsx`

**Requirements:**
- List all user's notes, sorted by updated_at desc
- Each note card shows:
  - Title (or "Untitled Note")
  - Content preview (first 100 chars)
  - Attachment count badge if has attachments
  - Updated date
- "New Note" button
- Empty state: "Capture ideas before they become gems"

**Commit:** `feat(notes): Add notes list page`

---

### Task 6.13: Note Editor UI ⬜

**Create:** `app/(protected)/notes/[id]/page.tsx` and `components/note-editor.tsx`

**Requirements:**
- Full-page editor with:
  - Title input (optional)
  - Content textarea (auto-expanding)
  - Auto-save on blur or after 2 seconds of no typing
- Attachment section:
  - Grid of attachment thumbnails
  - "+ Add Image" button
  - Click to view full size
  - Delete button on each attachment
- Actions:
  - "✨ Extract Gems" button (opens extraction flow with note content + images)
  - "Delete Note" button (with confirmation)
  - Back to notes list

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│  ← Notes                    [✨ Extract] 🗑️ │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Note title...                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │ Write your thoughts here...         │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Attachments (2)                            │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ 📷    │ │ 📷    │ │  +    │            │
│  │ img1  │ │ img2  │ │ Add   │            │
│  └───────┘ └───────┘ └───────┘            │
│                                             │
└─────────────────────────────────────────────┘
```

**Commit:** `feat(notes): Add note editor with attachments`

---

### Task 6.14: Image Upload Component ⬜

**Create:** `components/image-upload.tsx`

**Requirements:**
- Drag-and-drop zone
- Click to open file picker
- Accept: image/png, image/jpeg, image/gif, image/webp
- Max file size: 5MB
- Show upload progress
- Show error states (file too large, wrong type)
- Preview before upload completes

**Props:**
```typescript
interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  maxSize?: number; // bytes, default 5MB
  accept?: string[]; // MIME types
  disabled?: boolean;
}
```

**Commit:** `feat(notes): Add image upload component with drag-and-drop`

---

### Task 6.15: AI Extraction from Notes (Text + Images) ⬜

**Modify:** `lib/ai/gemini.ts` - add multimodal extraction

**Requirements:**
```typescript
export async function extractGemsFromNote(
  content: string,
  images: Array<{ data: string; mimeType: string }>, // base64 encoded
  source?: string
): Promise<ExtractionResult>
```

**Implementation:**
```typescript
export async function extractGemsFromNote(
  content: string,
  images: Array<{ data: string; mimeType: string }>,
  source?: string
): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  });

  const parts: Part[] = [
    { text: EXTRACTION_SYSTEM_PROMPT },
  ];

  // Add images
  for (const image of images) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data, // base64
      },
    });
  }

  // Add text content
  const userPrompt = source 
    ? `Source: ${source}\n\nContent:\n${content}`
    : content || 'Extract insights from the images above.';
  
  parts.push({ text: userPrompt });

  const result = await model.generateContent(parts);
  // ... rest of implementation
}
```

**Update API route:** `app/api/ai/extract/route.ts`
- Accept optional `images` array in request body
- Fetch images from Supabase Storage if note attachments provided
- Convert to base64 for Gemini API

**Update extraction modal:**
- When triggered from a note, include note content and attachment images
- Show which images are being analyzed

**Commit:** `feat(ai): Add multimodal extraction from notes with images`

---

## PART 3: Navigation & Polish

### Task 6.16: Update Navigation ⬜

**Modify:** Sidebar/navigation component

**Requirements:**
- Add "Notes" link to main navigation
- Icon: 📝 or similar
- Position: Between Gems and Settings
- Active state highlighting

**Navigation structure:**
```
💎 Gems (home)
📝 Notes
🏆 Trophy Case
⚙️ Settings
```

**Commit:** `feat(nav): Add Notes to main navigation`

---

### Task 6.17: Connect Notes UI to Existing "Notes" Section ⬜

**Requirements:**
- If there's existing Notes UI that's non-functional, wire it up to the new system
- Remove any legacy Notekeeper code that's no longer needed
- Ensure consistent styling with the rest of the app

**Commit:** `refactor: Connect Notes section to new notes system`

---

## Commit Sequence

1. `feat(ai): Add Gemini API integration for gem extraction`
2. `feat(ai): Add rate limiting and caching for AI extractions`
3. `feat(ai): Add extract gems API route with rate limiting`
4. `feat(ai): Add extract gems entry point to gem creation UI`
5. `feat(ai): Add extraction modal with input and review steps`
6. `feat(ai): Add extracted gem preview card component`
7. `feat(ai): Add bulk save for extracted gems`
8. `feat(ai): Add comprehensive error handling for AI extraction`
9. `feat(notes): Add notes service with CRUD and attachment operations`
10. `feat(notes): Add notes list page`
11. `feat(notes): Add note editor with attachments`
12. `feat(notes): Add image upload component with drag-and-drop`
13. `feat(ai): Add multimodal extraction from notes with images`
14. `feat(nav): Add Notes to main navigation`
15. `refactor: Connect Notes section to new notes system`

---

## Testing Checklist

### Text Extraction
- [ ] Can paste content and extract gems
- [ ] Rate limiting works (10/day limit)
- [ ] Caching works (same content returns cached result)
- [ ] Can edit extracted gems before saving
- [ ] Can change context tags
- [ ] 10-gem limit is enforced
- [ ] Error states display correctly

### Notes System
- [ ] Can create, edit, delete notes
- [ ] Auto-save works
- [ ] Can upload images (drag-drop and click)
- [ ] File size limit enforced (5MB)
- [ ] Can view attachment thumbnails
- [ ] Can delete attachments
- [ ] Can extract gems from note content
- [ ] Can extract gems from note images
- [ ] Navigation to Notes works

---

## Notes for Claude Code

- Always check for AI consent before making extraction API calls
- Use the existing UI patterns from gem creation for consistency
- The Supabase Storage bucket is called `note-attachments`
- Files should be stored as `{user_id}/{note_id}/{filename}`
- Gemini 1.5 Flash supports up to 16 images per request
- Keep the extraction prompt focused on actionable wisdom, not summaries
