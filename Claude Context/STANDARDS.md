# ThoughtFolio Code Standards

## Overview

This document defines coding conventions, patterns, and practices for the ThoughtFolio codebase. Claude Code should follow these standards for consistency and maintainability.

---

## Tech Stack Reference

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini API |
| Deployment | Vercel |

---

## TypeScript Standards

### Always Use Types

```typescript
// ✅ Good: Explicit types
interface Gem {
  id: string;
  content: string;
  source: string;
  sourceType: SourceType;
  isActive: boolean;
  createdAt: Date;
}

// ❌ Bad: Any types
const gem: any = fetchGem();
```

### Avoid `any`

If you're tempted to use `any`, consider:
1. Can you define an interface?
2. Can you use `unknown` and narrow the type?
3. Is this a legitimate escape hatch? (Document why)

### Type Exports

Export types from a central location:

```typescript
// types/index.ts
export type { Gem, GemNote, DailyPrompt } from './gems';
export type { User, Profile } from './users';
export type { Moment, GemSchedule } from './scheduling';
```

---

## Component Patterns

### File Structure

```
components/
├── ui/                    # shadcn/ui components
├── gems/
│   ├── GemCard.tsx
│   ├── GemList.tsx
│   ├── GemForm.tsx
│   └── index.ts          # Barrel export
├── prompts/
│   ├── DailyPrompt.tsx
│   └── PromptHistory.tsx
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### Component Size

Keep components focused. If a component exceeds ~150 lines, consider splitting:

```typescript
// ✅ Good: Focused components
<GemCard gem={gem} />
<GemActions gemId={gem.id} onArchive={handleArchive} />

// ❌ Bad: Monolithic component with everything
<GemCardWithActionsAndNotesAndScheduling gem={gem} ... />
```

### Props Interface

Define props interfaces explicitly:

```typescript
interface GemCardProps {
  gem: Gem;
  onSelect?: (gem: Gem) => void;
  showActions?: boolean;
  className?: string;
}

export function GemCard({ gem, onSelect, showActions = true, className }: GemCardProps) {
  // ...
}
```

### Server vs. Client Components

Default to Server Components. Add `'use client'` only when needed:

```typescript
// Needs 'use client':
// - useState, useEffect, other hooks
// - Event handlers (onClick, onChange)
// - Browser APIs

// Does NOT need 'use client':
// - Data fetching
// - Static rendering
// - Components that just display props
```

---

## Styling Standards

### Tailwind Conventions

Use Tailwind utilities directly. Avoid custom CSS unless absolutely necessary.

```typescript
// ✅ Good: Tailwind utilities
<div className="flex items-center gap-4 p-4 rounded-lg bg-card">

// ❌ Bad: Custom CSS for basic layout
<div className={styles.cardContainer}>
```

### Consistent Spacing

Use Tailwind's spacing scale consistently:
- `gap-2` (8px) for tight groupings
- `gap-4` (16px) for standard spacing
- `gap-6` (24px) for section separation
- `gap-8` (32px) for major sections

### Color Usage

Use semantic color tokens from shadcn/ui:

```typescript
// ✅ Good: Semantic tokens
className="bg-background text-foreground"
className="bg-card text-card-foreground"
className="bg-primary text-primary-foreground"

// ❌ Bad: Hardcoded colors
className="bg-slate-900 text-white"
```

### Responsive Design

Mobile-first approach:

```typescript
// ✅ Good: Mobile-first
className="flex flex-col md:flex-row"
className="p-4 md:p-6 lg:p-8"

// ❌ Bad: Desktop-first
className="flex flex-row md:flex-col"
```

---

## Data Fetching

### Supabase Client

Use the appropriate client for the context:

```typescript
// Server Components / Server Actions
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Client Components
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// API Routes
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
```

### Error Handling

Always handle Supabase errors:

```typescript
// ✅ Good: Error handling
const { data, error } = await supabase
  .from('gems')
  .select('*')
  .eq('user_id', userId);

if (error) {
  console.error('Failed to fetch gems:', error);
  throw new Error('Failed to load your gems');
}

return data;

// ❌ Bad: Ignoring errors
const { data } = await supabase.from('gems').select('*');
return data; // Could be null if error occurred
```

### Query Patterns

Be explicit about selected columns:

```typescript
// ✅ Good: Explicit columns
const { data } = await supabase
  .from('gems')
  .select('id, content, source, is_active, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// ❌ Bad: Select all (performance, security)
const { data } = await supabase.from('gems').select('*');
```

---

## API Routes

### Consistent Response Format

```typescript
// Success
return NextResponse.json({ data: result }, { status: 200 });

// Error
return NextResponse.json(
  { error: 'Failed to process request', details: error.message },
  { status: 500 }
);
```

### Auth Check

Always verify authentication:

```typescript
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated user
}
```

---

## Error Handling

### User-Facing Errors

Show friendly messages, log technical details:

```typescript
try {
  await saveGem(gemData);
} catch (error) {
  console.error('Failed to save gem:', error);
  toast({
    title: "Couldn't save your gem",
    description: "Please try again. If this keeps happening, contact support.",
    variant: "destructive",
  });
}
```

### Error Boundaries

Use error boundaries for component-level failures:

```typescript
// app/gems/error.tsx
'use client';

export default function GemsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2>Something went wrong loading your gems</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

---

## Testing

### Philosophy

Test behavior, not implementation. Focus on:
- Critical user flows (auth, gem capture, scheduling)
- Complex logic (AI matching, date/time handling)
- Edge cases that have caused bugs before

Don't aim for 100% coverage — aim for confidence in the code that matters.

### Test Types

| Type | Purpose | Tools |
|------|---------|-------|
| **Unit** | Pure functions, utilities, helpers | Jest or Vitest |
| **Component** | UI components in isolation | React Testing Library |
| **Integration** | Features with database/API | Testing Library + mocks |
| **E2E** | Critical user journeys | Playwright or Cypress |

### What to Test

**Always test:**
- Authentication flows
- Data mutations (create, update, delete gems)
- AI integration responses and error handling
- Form validation
- Permission/authorization logic

**Skip testing:**
- Simple presentational components
- Third-party library behavior
- Styles and layout (use visual review)

### Test File Location

Co-locate tests with the code they test:

```
components/
├── gems/
│   ├── GemCard.tsx
│   ├── GemCard.test.tsx    # Component test
│   └── GemForm.tsx
├── ...

lib/
├── utils/
│   ├── formatDate.ts
│   └── formatDate.test.ts  # Unit test
```

### Naming Conventions

```typescript
// Describe what the component/function does
describe('GemCard', () => {
  // Use "should" + expected behavior
  it('should display gem content and source', () => {});
  it('should call onSelect when clicked', () => {});
  it('should show archive button for active gems', () => {});
});

describe('formatRelativeDate', () => {
  it('should return "today" for current date', () => {});
  it('should return "yesterday" for previous day', () => {});
});
```

### Mocking Supabase

```typescript
// Mock Supabase client for tests
jest.mock('@/lib/supabase', () => ({
  createClientComponentClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockGems,
          error: null,
        })),
      })),
    })),
  }),
}));
```

### Mocking AI Responses

```typescript
// Mock Gemini API for predictable tests
jest.mock('@/lib/gemini', () => ({
  extractGems: jest.fn(() => Promise.resolve({
    gems: [
      { content: 'Test insight', confidence: 0.9 },
    ],
  })),
  matchGemsToMoment: jest.fn(() => Promise.resolve({
    matches: [
      { gemId: '123', relevance: 'High', reason: 'Test reason' },
    ],
  })),
}));
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm test -- --watch

# Run specific test file
npm test -- GemCard.test.tsx

# Run with coverage
npm test -- --coverage
```

### When to Write Tests

- **Before fixing a bug:** Write a failing test that reproduces it, then fix
- **For complex logic:** If you have to think hard about it, test it
- **For AI integrations:** Mock responses to test handling of various outputs
- **Before refactoring:** Ensure tests pass before and after changes

### CI Integration

Tests should run automatically on PR creation. If CI is set up:
- All tests must pass before merge
- Coverage reports generated for review
- Failed tests block deployment

---

## Things to Avoid

### Don't

- ❌ Use `any` types without explicit justification
- ❌ Hardcode colors or spacing values
- ❌ Write custom CSS for things Tailwind handles
- ❌ Ignore Supabase errors
- ❌ Expose sensitive data in client components
- ❌ Use `useEffect` for data fetching (use Server Components)
- ❌ Create components larger than 150 lines without splitting
- ❌ Skip TypeScript strict mode errors

### Do

- ✅ Use TypeScript interfaces for all data shapes
- ✅ Handle loading and error states
- ✅ Use semantic Tailwind tokens
- ✅ Keep components focused and composable
- ✅ Document non-obvious decisions in code comments
- ✅ Test changes in the live app before marking complete

---

## Commit Messages

Follow conventional commits:

```
feat: add gem scheduling UI
fix: correct date formatting in daily prompts
refactor: extract GemCard actions into separate component
docs: update README with deployment instructions
chore: update dependencies
```

---

## PR Guidelines

When creating PRs:

1. **Title:** Clear, concise description of the change
2. **Description:** What changed and why
3. **Testing:** What was tested and how
4. **Screenshots:** For UI changes, include before/after

Example:
```
Title: feat: add individual gem scheduling

Description:
Implements the scheduling UI from Epic 8. Users can now:
- Set check-in time per gem
- Select which days to receive reminders
- Enable/disable scheduling per gem

Testing:
- Verified schedule saves to database
- Confirmed time picker works across timezones
- Tested enable/disable toggle

Screenshots:
[attached]
```
