// Context tag options for categorizing thoughts
export type ContextTag =
  | "meetings"
  | "feedback"
  | "conflict"
  | "focus"
  | "health"
  | "relationships"
  | "parenting"
  | "other"

// Status of a thought in the lifecycle
export type ThoughtStatus = "active" | "retired" | "graduated"

// Thought type matching the database schema
export interface Thought {
  id: string
  user_id: string
  content: string
  source: string | null
  source_url: string | null
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
  context_tag: ContextTag
  custom_context?: string
}

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

// Maximum number of active thoughts allowed
export const MAX_ACTIVE_THOUGHTS = 10

// Legacy aliases for backward compatibility during migration
export type Gem = Thought
export type GemStatus = ThoughtStatus
export type CreateGemInput = CreateThoughtInput
export const MAX_ACTIVE_GEMS = MAX_ACTIVE_THOUGHTS
