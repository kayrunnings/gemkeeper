# ThoughtFolio - Epic 11: Glassmorphism UI Overhaul

## Overview

Major UI update to add glassmorphism design language across ThoughtFolio. Creates a modern, premium feel with frosted glass effects, subtle gradients, and enhanced visual depth.

**Linear Epic:** KAY-80  
**Branch:** `karanvaish93/kay-80-epic-11-glassmorphism-ui-overhaul`

---

## Current State

- ❌ Not started

---

## Design Principles

Based on [Webflow glassmorphism article](https://webflow.com/blog/glassmorphism):

| Principle | Implementation |
|-----------|----------------|
| **Transparency** | Semi-transparent backgrounds (`bg-white/5`) with `backdrop-filter: blur()` |
| **Borders** | Thin white/light borders (`border-white/10`) for definition |
| **Shadows** | Subtle drop shadows for depth |
| **Background** | Subtle dark gradient (top to bottom) to make glass visible |
| **Colors** | Muted/pastel context badges, glass-tinted buttons |

---

## Tasks

### Phase 1: Foundation (KAY-81)

**Goal:** Set up CSS variables, Tailwind utilities, and background gradient.

- [ ] 1.0 Update Tailwind Config (traces to: KAY-81)
  - [ ] 1.1 Add glass-related background colors (`bg-glass: rgba(255,255,255,0.05)`)
  - [ ] 1.2 Add glass border colors (`border-glass: rgba(255,255,255,0.1)`)
  - [ ] 1.3 Add backdrop blur variants if missing

- [ ] 2.0 Update CSS Variables (traces to: KAY-81)
  - [ ] 2.1 Add `--glass-bg`, `--glass-border`, `--glass-shadow` to `globals.css`
  - [ ] 2.2 Add gradient variables (`--gradient-start: #0f0a1a`, `--gradient-end: #1a1025`)

- [ ] 3.0 Add Background Gradient (traces to: KAY-81)
  - [ ] 3.1 Update `body` in `globals.css` with subtle gradient
  - [ ] 3.2 Verify gradient is visible but subtle
  - [ ] 3.3 Test on different screen sizes

- [ ] 4.0 Create Glass Utility Classes (traces to: KAY-81)
  - [ ] 4.1 Add `.glass` class with blur + border + background
  - [ ] 4.2 Add `.glass-card` class extending glass
  - [ ] 4.3 Include `-webkit-backdrop-filter` for Safari

**Files:**
- `tailwind.config.js`
- `app/globals.css`

---

### Phase 2: Sidebar & Layout (KAY-82)

**Goal:** Apply glass treatment to sidebar and main layout shell.

- [ ] 5.0 Update Sidebar Component (traces to: KAY-82)
  - [ ] 5.1 Replace solid background with glass effect
  - [ ] 5.2 Update border to `border-white/10`
  - [ ] 5.3 Test collapse/expand functionality

- [ ] 6.0 Update Navigation Items (traces to: KAY-82)
  - [ ] 6.1 Update hover states to `hover:bg-white/10`
  - [ ] 6.2 Update active state styling
  - [ ] 6.3 Add transition effects

- [ ] 7.0 Update Header (if exists) (traces to: KAY-82)
  - [ ] 7.1 Apply glass effect to sticky header
  - [ ] 7.2 Ensure z-index works with glass

**Files:**
- `components/layout-shell.tsx`
- `components/app-sidebar.tsx` (use this, NOT `gems/` folder)

---

### Phase 3: Cards (KAY-83)

**Goal:** Update all card components with frosted glass effect.

- [ ] 8.0 Update shadcn/ui Card Component (traces to: KAY-83)
  - [ ] 8.1 Replace `bg-card` with `bg-white/5 backdrop-blur-xl`
  - [ ] 8.2 Update border to `border-white/10`
  - [ ] 8.3 Increase border-radius to `rounded-xl`
  - [ ] 8.4 Add shadow (`shadow-lg`)

- [ ] 9.0 Verify Card Propagation (traces to: KAY-83)
  - [ ] 9.1 Check Dashboard cards (Quick Actions, Progress, Upcoming Moments)
  - [ ] 9.2 Check Thought cards on Thoughts page
  - [ ] 9.3 Check Today's Thought card on Home
  - [ ] 9.4 Check Settings page cards

**Files:**
- `components/ui/card.tsx`

---

### Phase 4: Modals & Dialogs (KAY-84)

**Goal:** Apply glass treatment to all modal/dialog components.

- [ ] 10.0 Update Dialog Component (traces to: KAY-84)
  - [ ] 10.1 Update DialogContent with glass styling
  - [ ] 10.2 Update DialogOverlay with blur (`bg-black/60 backdrop-blur-sm`)
  - [ ] 10.3 Increase border-radius to `rounded-2xl`

- [ ] 11.0 Update AlertDialog Component (traces to: KAY-84)
  - [ ] 11.1 Apply same glass treatment as Dialog

- [ ] 12.0 Update Sheet Component (if exists) (traces to: KAY-84)
  - [ ] 12.1 Apply glass treatment to slide-out panels

- [ ] 13.0 Verify Modal Propagation (traces to: KAY-84)
  - [ ] 13.1 Test Extract Thoughts modal
  - [ ] 13.2 Test Add Thought modal
  - [ ] 13.3 Test New Moment modal
  - [ ] 13.4 Test confirmation dialogs

**Files:**
- `components/ui/dialog.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/sheet.tsx`

---

### Phase 5: Buttons & Inputs (KAY-85)

**Goal:** Update buttons with glass tints and inputs with glass backgrounds.

- [ ] 14.0 Update Button Component (traces to: KAY-85)
  - [ ] 14.1 Update `default` variant: `bg-orange-500/80 backdrop-blur-sm border-orange-400/30`
  - [ ] 14.2 Update `secondary` variant: `bg-white/10 backdrop-blur-sm border-white/15`
  - [ ] 14.3 Update `ghost` variant: `hover:bg-white/10`
  - [ ] 14.4 Update `outline` variant: `border-white/20 hover:bg-white/10`
  - [ ] 14.5 Update `destructive` variant: `bg-red-500/80 backdrop-blur-sm`
  - [ ] 14.6 Add shadow to primary buttons (`shadow-lg shadow-orange-500/20`)

- [ ] 15.0 Update Input Component (traces to: KAY-85)
  - [ ] 15.1 Add glass background (`bg-white/5 backdrop-blur-sm`)
  - [ ] 15.2 Update border to `border-white/10`
  - [ ] 15.3 Update focus ring to orange

- [ ] 16.0 Update Textarea Component (traces to: KAY-85)
  - [ ] 16.1 Apply same glass treatment as Input

- [ ] 17.0 Update Select Component (traces to: KAY-85)
  - [ ] 17.1 Update SelectTrigger with glass
  - [ ] 17.2 Update SelectContent with glass

**Files:**
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`

---

### Phase 6: Context Badges (KAY-86)

**Goal:** Update context badges with muted/pastel colors for glass compatibility.

- [ ] 18.0 Define Muted Color Palette (traces to: KAY-86)
  - [ ] 18.1 Update default context colors to softer versions
  - [ ] 18.2 Document new color values

- [ ] 19.0 Update Badge Styling (traces to: KAY-86)
  - [ ] 19.1 Use 20% opacity for badge background
  - [ ] 19.2 Use 40% opacity for badge border
  - [ ] 19.3 Use full color for text
  - [ ] 19.4 Add subtle backdrop blur

- [ ] 20.0 Update ContextBadge Component (traces to: KAY-86)
  - [ ] 20.1 Apply dynamic glass styling based on context color

**Files:**
- `components/ui/badge.tsx`
- `components/contexts/ContextBadge.tsx` (or equivalent)
- `lib/contexts.ts` (if default colors defined here)

**New Color Palette:**
```
Meetings:      #60A5FA (softer blue)
Feedback:      #FB923C (softer orange)
Conflict:      #F87171 (softer red)
Focus:         #A78BFA (softer purple)
Health:        #4ADE80 (softer green)
Relationships: #F472B6 (softer pink)
Parenting:     #FACC15 (softer yellow)
Other:         #9CA3AF (softer gray)
```

---

### Phase 7: Polish & Accessibility (KAY-87)

**Goal:** Add transitions, verify accessibility, and fix inconsistencies.

- [ ] 21.0 Add Transitions (traces to: KAY-87)
  - [ ] 21.1 Add `transition-all duration-200` to glass elements
  - [ ] 21.2 Ensure hover states have smooth transitions

- [ ] 22.0 Update Hover States (traces to: KAY-87)
  - [ ] 22.1 Cards: `hover:bg-white/8 hover:border-white/15`
  - [ ] 22.2 Nav items: consistent `hover:bg-white/10`

- [ ] 23.0 Update Loading States (traces to: KAY-87)
  - [ ] 23.1 Update Skeleton component with glass styling
  - [ ] 23.2 Update any spinners/loaders

- [ ] 24.0 Update Toast/Notifications (traces to: KAY-87)
  - [ ] 24.1 Apply glass treatment to toasts

- [ ] 25.0 Accessibility Audit (traces to: KAY-87)
  - [ ] 25.1 Run Lighthouse accessibility audit
  - [ ] 25.2 Check contrast ratios (WCAG AA: 4.5:1)
  - [ ] 25.3 Verify focus indicators are visible
  - [ ] 25.4 Test keyboard navigation

- [ ] 26.0 Performance Check (traces to: KAY-87)
  - [ ] 26.1 Test on mobile Safari
  - [ ] 26.2 Test on Chrome Android
  - [ ] 26.3 Check for scroll jank

- [ ] 27.0 Fix Visual Inconsistencies (traces to: KAY-87)
  - [ ] 27.1 Check for mismatched border radii
  - [ ] 27.2 Check for z-index issues
  - [ ] 27.3 Verify all pages have glass treatment

**Files:**
- `app/globals.css`
- `components/ui/skeleton.tsx`
- `components/ui/toast.tsx`
- Various components for hover states

---

## Relevant Files

### Core Styling
- `tailwind.config.js` — Tailwind configuration
- `app/globals.css` — Global CSS variables and styles
- `app/layout.tsx` — Root layout

### Theme System (Phase 8)
- `lib/ui-theme-context.tsx` — Theme context provider (new)

### shadcn/ui Components (Update these)
- `components/ui/card.tsx` — Card component
- `components/ui/button.tsx` — Button variants
- `components/ui/dialog.tsx` — Modal dialogs
- `components/ui/alert-dialog.tsx` — Alert dialogs
- `components/ui/input.tsx` — Text inputs
- `components/ui/textarea.tsx` — Textareas
- `components/ui/select.tsx` — Dropdowns
- `components/ui/badge.tsx` — Badges
- `components/ui/skeleton.tsx` — Loading skeletons
- `components/ui/toast.tsx` — Notifications

### Layout Components
- `components/layout-shell.tsx` — Main layout (USE THIS)
- `components/app-sidebar.tsx` — Sidebar navigation (USE THIS, not gems/)

### Feature Components (Verify propagation)
- `components/thoughts/thought-card.tsx` — Thought cards
- `components/contexts/ContextBadge.tsx` — Context badges

---

## CSS Reference

### Glass Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Glass Modal
```css
.glass-modal {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}
```

### Glass Button (Primary)
```css
.glass-button-primary {
  background: rgba(249, 115, 22, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(249, 115, 22, 0.3);
  box-shadow: 0 8px 16px rgba(249, 115, 22, 0.2);
}
```

### Background Gradient
```css
body {
  background: linear-gradient(
    to bottom,
    #0f0a1a,
    #1a1025
  );
  min-height: 100vh;
}
```

---

### Phase 8: Theme Toggle (KAY-88)

**Goal:** Add toggle in Settings to switch between Glass and Classic (solid) themes.

- [ ] 28.0 Create Theme Context (traces to: KAY-88)
  - [ ] 28.1 Create `lib/ui-theme-context.tsx` with ThemeProvider
  - [ ] 28.2 Define `UITheme` type: `'glass' | 'classic'`
  - [ ] 28.3 Store preference in localStorage (`thoughtfolio-ui-theme`)
  - [ ] 28.4 Set `data-ui-theme` attribute on `<html>` element

- [ ] 29.0 Create Dual-Theme CSS Variables (traces to: KAY-88)
  - [ ] 29.1 Define glass theme variables (default)
  - [ ] 29.2 Define classic theme variables (solid backgrounds)
  - [ ] 29.3 Use `:root[data-ui-theme="classic"]` selector for overrides

- [ ] 30.0 Update Components to Use CSS Variables (traces to: KAY-88)
  - [ ] 30.1 Update Card to use `var(--card-bg)`, `var(--card-blur)`, `var(--card-border)`
  - [ ] 30.2 Update Button to use `var(--button-primary-bg)`
  - [ ] 30.3 Update Dialog to use `var(--modal-bg)`
  - [ ] 30.4 Update Input to use `var(--input-bg)`
  - [ ] 30.5 Update Sidebar to use `var(--sidebar-bg)`
  - [ ] 30.6 Update body background based on theme

- [ ] 31.0 Add Toggle UI to Settings (traces to: KAY-88)
  - [ ] 31.1 Add "Appearance" section to Settings page
  - [ ] 31.2 Add theme dropdown/toggle (Glass / Classic)
  - [ ] 31.3 Show description explaining the options

- [ ] 32.0 Wrap App with ThemeProvider (traces to: KAY-88)
  - [ ] 32.1 Add ThemeProvider to `app/layout.tsx`
  - [ ] 32.2 Ensure no flash of wrong theme on load (check localStorage early)

**Files:**
- `lib/ui-theme-context.tsx` (new)
- `app/globals.css` (add theme variables)
- `app/layout.tsx` (wrap with ThemeProvider)
- `app/settings/page.tsx` (add toggle)
- All UI components (use CSS variables instead of hardcoded values)

**CSS Variables to Define:**

```css
/* Glass theme (default) */
:root, :root[data-ui-theme="glass"] {
  --card-bg: rgba(255, 255, 255, 0.05);
  --card-border: rgba(255, 255, 255, 0.1);
  --card-blur: 16px;
  --sidebar-bg: rgba(255, 255, 255, 0.03);
  --modal-bg: rgba(255, 255, 255, 0.1);
  --modal-blur: 24px;
  --button-primary-bg: rgba(249, 115, 22, 0.8);
  --button-secondary-bg: rgba(255, 255, 255, 0.1);
  --input-bg: rgba(255, 255, 255, 0.05);
  --body-bg: linear-gradient(to bottom, #0f0a1a, #1a1025);
}

/* Classic theme (solid) */
:root[data-ui-theme="classic"] {
  --card-bg: hsl(var(--card));
  --card-border: hsl(var(--border));
  --card-blur: 0px;
  --sidebar-bg: hsl(var(--card));
  --modal-bg: hsl(var(--card));
  --modal-blur: 0px;
  --button-primary-bg: hsl(var(--primary));
  --button-secondary-bg: hsl(var(--secondary));
  --input-bg: hsl(var(--input));
  --body-bg: hsl(var(--background));
}
```

---

## Acceptance Criteria

- [ ] All components have consistent glassmorphism treatment
- [ ] Background gradient is subtle (dark purple tones)
- [ ] Context badges are muted pastels with transparency
- [ ] Buttons have glass effect with orange tint (still prominent)
- [ ] All modals have frosted glass appearance
- [ ] Sidebar has glass treatment
- [ ] WCAG AA contrast requirements met
- [ ] No performance issues on mobile
- [ ] Transitions are smooth
- [ ] Keyboard navigation works
- [ ] All pages verified (Home, Thoughts, Daily Prompt, Settings, etc.)
- [ ] **Theme toggle in Settings works**
- [ ] **Glass ↔ Classic switch is instant (no reload)**
- [ ] **Theme preference persists across sessions**
- [ ] **Classic mode restores original solid appearance**

---

## Notes

- **Important:** Use `components/layout-shell.tsx` and `components/thoughts/`, NOT the `gems/` folder (legacy naming)
- Safari requires `-webkit-backdrop-filter` prefix
- Test blur performance on mobile devices
- Muted badge colors: 20% bg opacity, 40% border opacity, 100% text color
