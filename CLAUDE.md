# Notekeeper - Project Instructions for Claude Code

## Project Overview

Notekeeper is a personal notes application with authentication, tags, search, and favorites.

- **Live URL:** https://notekeeper-neon.vercel.app
- **GitHub:** https://github.com/kayrunnings/notekeeper
- **Linear Project:** Notekeeper (in Kay's Personal Playground workspace)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |

## Project Structure

```
notekeeper/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main app after login
│   ├── folders/            # Folder-related server actions
│   │   └── actions.ts      # Folder CRUD operations
│   ├── auth/               # Auth pages (login, signup)
│   └── layout.tsx          # Root layout
├── components/             # React components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities and helpers
│   ├── supabase/           # Supabase client setup
│   │   ├── client.ts       # Browser client
│   │   └── server.ts       # Server client
│   └── types.ts            # TypeScript interfaces
├── public/                 # Static assets
└── middleware.ts           # Auth middleware
```

## Key Patterns

### Server Actions
- Located in `app/[feature]/actions.ts`
- Use `"use server"` directive
- Always check authentication first
- Return `{ data, error }` objects (don't throw)
- Call `revalidatePath("/dashboard")` after mutations

### Database Access
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return { error: "Not authenticated", data: null }
}
// Always filter by user_id for security
```

### Types
- Defined in `lib/types.ts`
- Main types: `Note`, `Folder`, `User`, `NoteInput`

## Linear Integration

Tasks are tracked in Linear under the **Notekeeper** project.

### Task Format
- **KAY-XX** is the issue identifier
- Parent issues are user stories
- Sub-issues are implementation tasks

### When Starting a Task
1. Note the KAY-XX identifier
2. Create a branch: `claude/[short-description]-[random]`
3. Reference the task in commit messages

### Commit Message Format
```
feat: [description] (KAY-XX)

- Detail 1
- Detail 2
```

### When Completing a Task
1. Create a PR with title: `feat: [description] (KAY-XX)`
2. Include task acceptance criteria in PR description
3. Request review before merging

## Current Feature: Folders

We're implementing folders/notebooks to organize notes.

### Database Schema (Already Created)
- `folders` table: id, user_id, name, created_at, updated_at
- `notes.folder_id` column: references folders(id), ON DELETE SET NULL

### Completed Tasks
- ✅ KAY-10: Database schema
- ✅ KAY-11: Folder service functions

### Remaining Tasks
- ⬜ KAY-12: Build folder sidebar component
- ⬜ KAY-13: Add folder rename functionality
- ⬜ KAY-14: Connect sidebar to notes list filtering
- ⬜ KAY-15: Add "Move to folder" functionality on notes
- ⬜ KAY-16: End-to-end testing

## Coding Standards

### TypeScript
- Use strict types, avoid `any`
- Define interfaces for all data shapes
- Use `string | null` for optional foreign keys

### React/Next.js
- Use Server Components by default
- Add `"use client"` only when needed (hooks, interactivity)
- Use shadcn/ui components for consistency

### Styling
- Use Tailwind CSS classes
- Follow existing color scheme
- Mobile-first responsive design

### Security
- Always verify `user_id` ownership in queries
- Use Supabase RLS as backup
- Never expose sensitive data in client code

## How to Work on Tasks

When the user says "work on KAY-XX" or "next task":

1. **Read the task** - Check Linear or ask for details
2. **Explore first** - Look at existing code patterns
3. **Plan the approach** - Explain what you'll do
4. **Implement** - Write the code following patterns above
5. **Test** - Verify it works (run dev server if possible)
6. **Create PR** - With clear description referencing the task

## Useful Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Build for production
npm run lint         # Run ESLint

# Git
git checkout -b claude/feature-name
git add .
git commit -m "feat: description (KAY-XX)"
git push -u origin HEAD
```

## Questions?

If unclear about:
- **Project structure** → Explore the codebase first
- **Task requirements** → Ask the user or check Linear
- **Existing patterns** → Look at similar features already implemented
- **Database schema** → Check `supabase-schema.sql` or Supabase dashboard
