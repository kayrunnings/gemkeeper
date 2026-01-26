// Context interface matching the database schema
export interface Context {
  id: string
  user_id: string
  name: string
  slug: string
  color: string | null
  icon: string | null
  is_default: boolean
  thought_limit: number
  sort_order: number
  created_at: string
  updated_at: string
}

// Input for creating a new context
export interface CreateContextInput {
  name: string
  color?: string
  icon?: string
  thought_limit?: number
}

// Input for updating a context
export interface UpdateContextInput {
  name?: string
  color?: string
  icon?: string
  thought_limit?: number
  sort_order?: number
}

// Context with thought count (for display)
export interface ContextWithCount extends Context {
  thought_count: number
}

// Default context slugs (cannot be deleted)
export const DEFAULT_CONTEXT_SLUGS = [
  "meetings",
  "feedback",
  "conflict",
  "focus",
  "health",
  "relationships",
  "parenting",
  "other",
] as const

export type DefaultContextSlug = (typeof DEFAULT_CONTEXT_SLUGS)[number]

// Default context colors
export const DEFAULT_CONTEXT_COLORS: Record<DefaultContextSlug, string> = {
  meetings: "#3B82F6",    // blue
  feedback: "#8B5CF6",    // purple
  conflict: "#EF4444",    // red
  focus: "#F97316",       // orange
  health: "#22C55E",      // green
  relationships: "#EC4899", // pink
  parenting: "#EAB308",   // yellow
  other: "#6B7280",       // gray
}

// Preset colors for custom contexts
export const PRESET_CONTEXT_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EF4444", // red
  "#F97316", // orange
  "#22C55E", // green
  "#EC4899", // pink
  "#EAB308", // yellow
  "#06B6D4", // cyan
  "#14B8A6", // teal
  "#6B7280", // gray
]

// Validation constants
export const CONTEXT_NAME_MAX_LENGTH = 50
export const CONTEXT_THOUGHT_LIMIT_MIN = 5
export const CONTEXT_THOUGHT_LIMIT_MAX = 100
export const CONTEXT_THOUGHT_LIMIT_DEFAULT = 20
