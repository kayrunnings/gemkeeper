# ThoughtFolio Icon Redesign Proposals

**Tagline:** Knowledge that finds you

## Icon Library: Phosphor Icons

Phosphor has a warmer, more friendly aesthetic than Lucide. Available in multiple weights:
- **Thin** - Minimal, elegant
- **Light** - Clean, airy
- **Regular** - Balanced (default)
- **Bold** - Strong, prominent
- **Fill** - Solid, impactful
- **Duotone** - Two-tone layered

---

## Navigation Icon Options

### Option A: Clean & Modern (Regular weight)

| Feature | Current (Lucide) | Proposed (Phosphor) | Notes |
|---------|------------------|---------------------|-------|
| **Home** | `Home` | `House` | Standard home icon |
| **Library** | `Library` | `Books` or `BookOpen` | Knowledge collection |
| **Active/Check-in** | `Zap` | `Lightning` | Energy, active |
| **Moments** | `Target` | `Lightning` | Quick, time-sensitive |
| **Discover** | `Sparkles` | `Compass` | Exploration |
| **Trophy Case** | `Trophy` | `Trophy` | Same concept |
| **Settings** | `Settings` | `GearSix` | Standard settings |

### Option B: Conceptual (Filled/Duotone for active states)

| Feature | Icon | Variant | Reasoning |
|---------|------|---------|-----------|
| **Home** | `HouseLine` | Regular | Outline style, friendly |
| **Library** | `Books` | Fill when active | Collection of knowledge |
| **Active** | `BatteryCharging` | Duotone | Currently energized thoughts |
| **Moments** | `Lightning` | Fill | Immediate, preparation |
| **Discover** | `Compass` | Duotone | Navigation/exploration |
| **Trophy Case** | `Medal` | Fill | Achievement, mastery |

---

## Logo Options

### Concept 1: Brain + Sparkle
- Brain silhouette with subtle sparkles
- Represents: Knowledge, intelligence, "eureka" moments
- Color: Primary gradient (varies by theme)

### Concept 2: Lightbulb + Layers
- Lightbulb with layered "petals" like accumulated pages
- Represents: Ideas building on each other
- Color: Warm gradient

### Concept 3: Open Book + Compass
- Open book with a small compass needle
- Represents: Knowledge that guides you
- Color: Theme primary

### Concept 4: Abstract "TF" Mark
- Stylized T + F forming a thought bubble shape
- Modern, scalable, memorable
- Works as favicon and full logo

### Concept 5: Gem/Crystal Brain (Current Evolution)
- Keep the gem concept but evolve to brain-shaped crystal
- Represents: Precious knowledge, mental clarity
- Maintains brand continuity

---

## Feature Icons

| Feature | Proposed Icon | Weight |
|---------|--------------|--------|
| AI Capture | `MagicWand` or `Sparkle` | Fill |
| Search | `MagnifyingGlass` | Regular |
| Thoughts | `Lightbulb` | Regular |
| Notes | `NotePencil` | Regular |
| Sources | `BookOpenText` | Regular |
| Archive | `Archive` | Regular |
| Add/Create | `Plus` | Bold |
| Calendar | `Calendar` | Regular |
| Check-in | `CheckCircle` | Regular |

---

## Floating Action Button

Current: `Plus` icon with ai-gradient background

Options:
1. **Keep Plus** - Universal "add/create" symbol
2. **Sparkle** - Emphasizes AI-powered features
3. **Lightning** - Quick actions, speed

---

## Implementation Notes

```tsx
// Import example
import {
  House,
  Books,
  Lightning,
  Compass,
  Trophy,
  GearSix,
  MagicWand,
  Lightbulb,
} from "@phosphor-icons/react"

// Usage with weight variants
<Lightning weight="fill" className="h-5 w-5" />
<Compass weight="regular" className="h-5 w-5" />
<Books weight="duotone" className="h-5 w-5" />
```

---

## Recommendation

**Primary recommendation**: Option A with selective Fill variants for active states

- Navigation: Regular weight for inactive, Fill for active
- FAB: Keep `Plus` (universal recognition)
- Logo: Concept 2 (Lightbulb + Layers) or Concept 5 (Crystal Brain)

This maintains familiarity while adding warmth through Phosphor's design language.
