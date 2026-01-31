// Source-Context relationship types (Epic 13)
// Sources can be associated with multiple contexts, with one being primary

import { Source } from './source'
import { Context } from './context'

// Source-context join record
export interface SourceContext {
  id: string
  source_id: string
  context_id: string
  is_primary: boolean
  created_at: string
}

// Source with linked contexts
export interface SourceWithContexts extends Source {
  contexts?: Context[]
  primary_context?: Context | null
}

// Context with linked sources count
export interface ContextWithSources extends Context {
  sources_count?: number
}
