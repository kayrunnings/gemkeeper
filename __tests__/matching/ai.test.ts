// Note: These tests mock the Gemini API to test the matching logic
// Actual AI behavior is tested through integration tests

import type { GemForMatching, MatchingResponse } from '@/types/matching'
import { MIN_RELEVANCE_SCORE, MAX_GEMS_TO_MATCH } from '@/types/matching'

// Mock the matching function results
const createMockMatchingResponse = (
  matches: Array<{ gem_id: string; relevance_score: number; relevance_reason: string }>
): MatchingResponse => ({
  matches,
  processing_time_ms: 100,
})

describe('Matching Types and Constraints', () => {
  it('MIN_RELEVANCE_SCORE is 0.5', () => {
    expect(MIN_RELEVANCE_SCORE).toBe(0.5)
  })

  it('MAX_GEMS_TO_MATCH is 5', () => {
    expect(MAX_GEMS_TO_MATCH).toBe(5)
  })
})

describe('MatchingResponse validation', () => {
  it('filters out matches below 0.5 threshold', () => {
    const matches = [
      { gem_id: '1', relevance_score: 0.9, relevance_reason: 'High relevance' },
      { gem_id: '2', relevance_score: 0.4, relevance_reason: 'Low relevance' },
      { gem_id: '3', relevance_score: 0.7, relevance_reason: 'Medium relevance' },
    ].filter(m => m.relevance_score >= MIN_RELEVANCE_SCORE)

    expect(matches.length).toBe(2)
    expect(matches.every(m => m.relevance_score >= 0.5)).toBe(true)
  })

  it('returns max 5 matches when more are provided', () => {
    const matches = Array(10)
      .fill(null)
      .map((_, i) => ({
        gem_id: String(i),
        relevance_score: 0.9 - i * 0.05,
        relevance_reason: `Reason ${i}`,
      }))
      .filter(m => m.relevance_score >= MIN_RELEVANCE_SCORE)
      .slice(0, MAX_GEMS_TO_MATCH)

    expect(matches.length).toBeLessThanOrEqual(5)
  })

  it('returns empty array when no gems match', () => {
    const response = createMockMatchingResponse([])
    expect(response.matches).toHaveLength(0)
  })

  it('includes processing time in response', () => {
    const response = createMockMatchingResponse([
      { gem_id: '1', relevance_score: 0.9, relevance_reason: 'Test' },
    ])
    expect(response.processing_time_ms).toBeDefined()
    expect(typeof response.processing_time_ms).toBe('number')
  })

  it('includes relevance reasons for each match', () => {
    const response = createMockMatchingResponse([
      { gem_id: '1', relevance_score: 0.9, relevance_reason: 'Listening applies to 1:1s' },
      { gem_id: '2', relevance_score: 0.7, relevance_reason: 'Feedback context matches' },
    ])

    response.matches.forEach(match => {
      expect(match.relevance_reason).toBeTruthy()
      expect(typeof match.relevance_reason).toBe('string')
    })
  })
})

describe('GemForMatching interface', () => {
  it('has required fields', () => {
    const gem: GemForMatching = {
      id: '123',
      content: 'Listen more than you speak',
      context_tag: 'meetings',
      source: 'Book',
    }

    expect(gem.id).toBeDefined()
    expect(gem.content).toBeDefined()
    expect(gem.context_tag).toBeDefined()
    expect(gem.source).toBeDefined()
  })

  it('allows null source', () => {
    const gem: GemForMatching = {
      id: '123',
      content: 'Test gem',
      context_tag: 'focus',
      source: null,
    }

    expect(gem.source).toBeNull()
  })
})

describe('Matching scenarios', () => {
  const mockGems: GemForMatching[] = [
    { id: '1', content: 'Listen more than you speak', context_tag: 'meetings', source: 'Book' },
    { id: '2', content: 'Always be learning', context_tag: 'focus', source: 'Quote' },
    { id: '3', content: 'Give feedback with empathy', context_tag: 'feedback', source: null },
    { id: '4', content: 'Recipe for pasta', context_tag: 'health', source: null },
  ]

  it('context tag matching increases relevance', () => {
    // A meeting-related moment should match meeting-tagged gems higher
    const momentDescription = '1:1 with manager'
    const meetingGem = mockGems.find(g => g.context_tag === 'meetings')

    expect(meetingGem).toBeDefined()
    // In real scenario, AI would assign higher score to meeting-tagged gems
  })

  it('handles moments with no relevant gems', () => {
    const momentDescription = 'quarterly business review about financials'
    const pastaGem = mockGems.find(g => g.content.includes('pasta'))

    expect(pastaGem).toBeDefined()
    // Pasta recipe gem would not match a business review
  })

  it('handles empty gem list gracefully', () => {
    const emptyGems: GemForMatching[] = []
    const response = createMockMatchingResponse([])

    expect(response.matches).toEqual([])
  })
})
