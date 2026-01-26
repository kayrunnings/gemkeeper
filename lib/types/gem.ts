// Re-export from thought.ts for backwards compatibility
// This file is deprecated - use lib/types/thought.ts instead
export type {
  Thought as Gem,
  ThoughtStatus as GemStatus,
  CreateThoughtInput as CreateGemInput,
  ContextTag,
} from "./thought"

export {
  MAX_ACTIVE_LIST as MAX_ACTIVE_GEMS,
  CONTEXT_TAG_LABELS,
  CONTEXT_TAG_COLORS,
} from "./thought"
