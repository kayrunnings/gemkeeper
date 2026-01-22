# Notekeeper Tasks

> **Auto-synced with Linear** — Last updated: 2026-01-22
> 
> Linear Project: [Notekeeper](https://linear.app/kays-personal-playground/project/notekeeper-85802f05b21d)

---

## 🎯 Current Status

**No active tasks** — Ready to plan the next feature!

---

## ✅ Completed Features

### Folders/Notebooks (KAY-9) — Completed 2026-01-22

Organize notes into flat folders with full CRUD operations.

| Task | Title | Status |
|------|-------|--------|
| KAY-10 | 🗄️ DB: Create folders table and update notes schema | ✅ Done |
| KAY-11 | 🔌 API: Create folder service functions | ✅ Done |
| KAY-12 | 🎨 UI: Build folder sidebar component | ✅ Done |
| KAY-13 | 🎨 UI: Add folder rename functionality | ✅ Done |
| KAY-14 | 🔌 Integration: Connect sidebar to notes list filtering | ✅ Done |
| KAY-15 | 🎨 UI: Add "Move to folder" functionality on notes | ✅ Done |
| KAY-16 | 🧪 Test: End-to-end testing of folders feature | ✅ Done |

**What was built:**
- Sidebar with All Notes, Favorites, Folders, Unfiled navigation
- Create folders via inline input (Enter/blur to save, Escape to cancel)
- Rename folders via double-click or context menu
- Delete folders with confirmation (notes become Unfiled)
- Move notes between folders via dropdown on note cards
- Loading states and input validation (maxLength=100, trim whitespace)

---

## 🔮 Future Ideas (Not Yet in Linear)

These are potential improvements to prioritize next:

### High Value
- **Dark Mode** — Toggle between light and dark themes
- **Search** — Full-text search across all notes
- **Tags** — Add multiple tags to notes for cross-cutting organization

### Medium Value
- **Rich Text Editor** — Bold, italic, headers, lists
- **Markdown Support** — Write in markdown with preview
- **Archive Notes** — Soft-delete instead of permanent delete

### Nice to Have
- **Export Notes** — Download as markdown or JSON
- **Keyboard Shortcuts** — Cmd+N for new note, Cmd+K for search
- **Nested Folders** — Folders within folders (v2)
- **Drag and Drop** — Reorder notes, drag to folders

---

## How to Use This File

**For Claude Code:**
1. Read this file to understand current priorities
2. If no "Next Task" section exists, check Linear or ask the user
3. After completing work, note what was done

**For the human:**
1. This file is synced with Linear by Claude (in chat)
2. After tasks are completed, ask Claude to update this file
3. Add new ideas to "Future Ideas" section

**Sync command (in Claude.ai chat):**
> "Please sync TASKS.md with Linear"

---

## Project Stats

- **Total commits:** 10 (after folders merge)
- **Contributors:** 2 (you + Claude)
- **Live URL:** https://notekeeper-neon.vercel.app
- **Features shipped:** 1 (Folders)
