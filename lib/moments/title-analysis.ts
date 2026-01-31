/**
 * Title Analysis Module for Moment Intelligence (Epic 14)
 *
 * Detects generic calendar event titles and classifies event types
 * to enable smart context prompting before thought matching.
 */

export type EventType =
  | '1:1'
  | 'team_meeting'
  | 'interview'
  | 'presentation'
  | 'review'
  | 'planning'
  | 'social'
  | 'external'
  | 'unknown'

export interface TitleAnalysis {
  isGeneric: boolean
  genericReason?: 'short' | 'common_pattern' | 'no_description'
  suggestedQuestions?: string[]
  detectedEventType: EventType
}

// Common generic patterns (case-insensitive)
const GENERIC_PATTERNS = [
  /^meeting$/i,
  /^call$/i,
  /^sync$/i,
  /^check[- ]?in$/i,
  /^catch[- ]?up$/i,
  /^touch[- ]?base$/i,
  /^chat$/i,
  /^talk$/i,
  /^discussion$/i,
  /^quick\s+(call|chat|sync|meeting)$/i,
  /^weekly\s*(sync|meeting|call)?$/i,
  /^daily\s*(sync|standup|meeting)?$/i,
  /^team\s*(meeting|sync|call)?$/i,
  /^1[:\-]?1$/i,
  /^one[- ]?on[- ]?one$/i,
  /^1\s*on\s*1$/i,
  /^standup$/i,
  /^stand[- ]?up$/i,
  /^review$/i,
  /^feedback$/i,
  /^update$/i,
  /^status$/i,
  /^debrief$/i,
]

// Event type detection patterns
const EVENT_TYPE_PATTERNS: Record<EventType, RegExp[]> = {
  '1:1': [
    /1[:\-]?1/i,
    /one[- ]?on[- ]?one/i,
    /1\s*on\s*1/i,
  ],
  'team_meeting': [
    /team\s*(meeting|sync|call)/i,
    /standup/i,
    /stand[- ]?up/i,
    /weekly\s*(sync|meeting)/i,
    /daily\s*(sync|standup)/i,
    /all[- ]?hands/i,
    /staff\s*meeting/i,
  ],
  'interview': [
    /interview/i,
    /candidate/i,
    /hiring/i,
    /screening/i,
  ],
  'presentation': [
    /presentation/i,
    /present/i,
    /demo/i,
    /pitch/i,
    /showcase/i,
    /walkthrough/i,
  ],
  'review': [
    /review/i,
    /feedback/i,
    /performance/i,
    /retrospective/i,
    /retro/i,
    /postmortem/i,
    /post[- ]?mortem/i,
  ],
  'planning': [
    /planning/i,
    /roadmap/i,
    /strategy/i,
    /brainstorm/i,
    /ideation/i,
    /kickoff/i,
    /kick[- ]?off/i,
    /sprint/i,
  ],
  'social': [
    /happy\s*hour/i,
    /lunch/i,
    /coffee/i,
    /social/i,
    /celebration/i,
    /party/i,
    /team\s*building/i,
    /offsite/i,
  ],
  'external': [],
  'unknown': [],
}

// Contextual questions based on event type
export const QUESTIONS_BY_EVENT_TYPE: Record<EventType, string[]> = {
  '1:1': [
    "What do you want to discuss or accomplish?",
    "Any challenges you're facing?",
    "Is this a regular check-in or something specific?",
  ],
  'team_meeting': [
    "What topics will be discussed?",
    "Are there decisions to be made?",
    "What's your role in this meeting?",
  ],
  'interview': [
    "What role is this for?",
    "What aspects are you most focused on?",
    "Are you the interviewer or interviewee?",
  ],
  'presentation': [
    "What's your main message?",
    "Who's the audience?",
    "What outcome are you hoping for?",
  ],
  'review': [
    "What's being reviewed?",
    "Are you giving or receiving feedback?",
    "Any specific areas to focus on?",
  ],
  'planning': [
    "What are you planning?",
    "What decisions need to be made?",
    "What's the timeframe?",
  ],
  'social': [
    "Who will be there?",
    "Any conversation topics you want to remember?",
  ],
  'external': [
    "Who are you meeting with?",
    "What's the purpose of this meeting?",
    "What do you want to achieve?",
  ],
  'unknown': [
    "What's this meeting about?",
    "What do you want to achieve?",
  ],
}

// Quick-select chips for enrichment UI
export const CHIPS_BY_EVENT_TYPE: Record<EventType, string[]> = {
  '1:1': ['Career', 'Feedback', 'Project Update', 'Personal', 'Blockers'],
  'team_meeting': ['Decision', 'Brainstorm', 'Status Update', 'Planning', 'Alignment'],
  'interview': ['Technical', 'Behavioral', 'Culture Fit', 'Experience', 'Questions'],
  'presentation': ['Persuade', 'Inform', 'Train', 'Inspire', 'Report'],
  'review': ['Performance', 'Code', 'Design', 'Process', 'Goals'],
  'planning': ['Quarterly', 'Sprint', 'Project', 'Strategy', 'Resource'],
  'social': ['Networking', 'Team Bonding', 'Celebration', 'Casual'],
  'external': ['Sales', 'Partnership', 'Vendor', 'Client', 'Networking'],
  'unknown': ['Work', 'Personal', 'Learning', 'Collaboration'],
}

/**
 * Detect the event type from title and description
 */
function detectEventType(
  title: string,
  description?: string,
  attendeeCount?: number
): EventType {
  const combinedText = `${title} ${description || ''}`.toLowerCase()

  // Check each event type pattern
  for (const [eventType, patterns] of Object.entries(EVENT_TYPE_PATTERNS)) {
    if (eventType === 'external' || eventType === 'unknown') continue

    for (const pattern of patterns) {
      if (pattern.test(combinedText)) {
        return eventType as EventType
      }
    }
  }

  // External detection: could check attendee domains in the future
  // For now, we don't have attendee data passed in

  return 'unknown'
}

/**
 * Check if a title matches common generic patterns
 */
function matchesGenericPattern(title: string): boolean {
  const normalizedTitle = title.trim()

  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(normalizedTitle)) {
      return true
    }
  }

  return false
}

/**
 * Count words in a string (excluding common filler words)
 */
function countMeaningfulWords(text: string): number {
  const fillerWords = new Set(['a', 'an', 'the', 'with', 'for', 'and', 'or', 'at', 'to', 'in', 'on'])
  const words = text.toLowerCase().split(/\s+/).filter(word =>
    word.length > 0 && !fillerWords.has(word)
  )
  return words.length
}

/**
 * Analyze an event title to determine if it's generic and needs enrichment
 */
export function analyzeEventTitle(
  title: string,
  description?: string,
  attendeeCount?: number
): TitleAnalysis {
  const trimmedTitle = title.trim()
  const wordCount = countMeaningfulWords(trimmedTitle)
  const detectedEventType = detectEventType(trimmedTitle, description, attendeeCount)

  // Check for generic title
  let isGeneric = false
  let genericReason: TitleAnalysis['genericReason']

  // Rule 1: Very short titles (< 3 meaningful words)
  if (wordCount < 3) {
    isGeneric = true
    genericReason = 'short'
  }

  // Rule 2: Matches common generic patterns
  if (!isGeneric && matchesGenericPattern(trimmedTitle)) {
    isGeneric = true
    genericReason = 'common_pattern'
  }

  // Rule 3: Short title + no description
  if (!isGeneric && wordCount < 4 && (!description || description.trim().length < 10)) {
    isGeneric = true
    genericReason = 'no_description'
  }

  // Generate suggested questions
  const suggestedQuestions = isGeneric
    ? QUESTIONS_BY_EVENT_TYPE[detectedEventType]?.slice(0, 2) || QUESTIONS_BY_EVENT_TYPE['unknown'].slice(0, 2)
    : undefined

  return {
    isGeneric,
    genericReason,
    suggestedQuestions,
    detectedEventType,
  }
}

/**
 * Get quick-select chips for a given event type
 */
export function getChipsForEventType(eventType: EventType): string[] {
  return CHIPS_BY_EVENT_TYPE[eventType] || CHIPS_BY_EVENT_TYPE['unknown']
}

/**
 * Combine original title with user-provided context for better matching
 */
export function combineContextForMatching(
  originalTitle: string,
  userContext?: string
): string {
  if (!userContext || userContext.trim().length === 0) {
    return originalTitle
  }

  return `${originalTitle}: ${userContext.trim()}`
}
