// Context type re-export for convenience
export type { Context, ContextWithCount } from "./context"

// Status of a thought in the lifecycle
// active = available thought, passive = available but dormant
// retired = archived (historical), graduated = applied 5+ times (mastered)
export type ThoughtStatus = "active" | "passive" | "retired" | "graduated"

// Thought type matching the database schema
export interface Thought {
  id: string
  user_id: string
  content: string
  source: string | null
  source_url: string | null
  // New: Foreign key to contexts table
  context_id: string | null
  // New: Whether thought is on the Active List for daily prompts
  is_on_active_list: boolean
  // Legacy fields (deprecated, kept for backwards compat)
  context_tag: ContextTag
  custom_context: string | null
  status: ThoughtStatus
  application_count: number
  skip_count: number
  last_surfaced_at: string | null
  last_applied_at: string | null
  retired_at: string | null
  graduated_at: string | null
  created_at: string
  updated_at: string
}

// Input for creating a new thought
export interface CreateThoughtInput {
  content: string
  source?: string
  source_url?: string
  // New: Use context_id for new thoughts
  context_id?: string
  // New: Whether to add to Active List (defaults to false - Passive)
  is_on_active_list?: boolean
  // Legacy fields (deprecated, kept for backwards compat)
  context_tag?: ContextTag
  custom_context?: string
}

// Legacy context tag type (deprecated - use Context from context.ts instead)
// Kept for backwards compatibility during migration
export type ContextTag =
  | "meetings"
  | "feedback"
  | "conflict"
  | "focus"
  | "health"
  | "relationships"
  | "parenting"
  | "other"

// Display labels for context tags
export const CONTEXT_TAG_LABELS: Record<ContextTag, string> = {
  meetings: "Meetings",
  feedback: "Feedback",
  conflict: "Conflict",
  focus: "Focus",
  health: "Health",
  relationships: "Relationships",
  parenting: "Parenting",
  other: "Other",
}

// Colors for context tag badges (per KAY-32 requirements)
export const CONTEXT_TAG_COLORS: Record<ContextTag, string> = {
  meetings: "bg-blue-100 text-blue-800 border-blue-200",
  feedback: "bg-purple-100 text-purple-800 border-purple-200",
  conflict: "bg-red-100 text-red-800 border-red-200",
  focus: "bg-orange-100 text-orange-800 border-orange-200",
  health: "bg-green-100 text-green-800 border-green-200",
  relationships: "bg-pink-100 text-pink-800 border-pink-200",
  parenting: "bg-yellow-100 text-yellow-800 border-yellow-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

// Maximum number of thoughts on Active List (for daily prompts)
// This is a hard limit enforced by database trigger
export const MAX_ACTIVE_LIST = 10

// Legacy constant name (deprecated, use MAX_ACTIVE_LIST)
export const MAX_ACTIVE_THOUGHTS = MAX_ACTIVE_LIST

// Legacy aliases for backward compatibility during migration
export type Gem = Thought
export type GemStatus = ThoughtStatus
export type CreateGemInput = CreateThoughtInput
export const MAX_ACTIVE_GEMS = MAX_ACTIVE_LIST
