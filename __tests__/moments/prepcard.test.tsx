import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrepCard } from '@/components/moments/PrepCard'
import type { MomentWithThoughts } from '@/types/moments'

// Mock next/navigation
const mockPush = jest.fn()
const mockBack = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

// Mock the moments lib
jest.mock('@/lib/moments', () => ({
  recordMomentThoughtFeedback: jest.fn().mockResolvedValue({ error: null }),
  markThoughtReviewed: jest.fn().mockResolvedValue({ error: null }),
  updateMomentStatus: jest.fn().mockResolvedValue({ error: null }),
}))

describe('PrepCard', () => {
  const mockMoment: MomentWithThoughts = {
    id: '1',
    user_id: 'user-1',
    description: '1:1 with manager',
    source: 'manual',
    calendar_event_id: null,
    calendar_event_title: null,
    calendar_event_start: null,
    gems_matched_count: 2,
    ai_processing_time_ms: 100,
    status: 'active',
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    matched_thoughts: [
      {
        id: 'mt-1',
        moment_id: '1',
        gem_id: 'thought-1',
        user_id: 'user-1',
        relevance_score: 0.9,
        relevance_reason: 'Listening applies to 1:1s',
        was_helpful: null,
        was_reviewed: false,
        created_at: new Date().toISOString(),
        thought: {
          id: 'thought-1',
          user_id: 'user-1',
          content: 'Listen more than you speak',
          source: 'Book',
          source_url: null,
          context_tag: 'meetings',
          custom_context: null,
          status: 'active',
          application_count: 3,
          skip_count: 0,
          last_surfaced_at: null,
          last_applied_at: null,
          retired_at: null,
          graduated_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'mt-2',
        moment_id: '1',
        gem_id: 'thought-2',
        user_id: 'user-1',
        relevance_score: 0.7,
        relevance_reason: 'Feedback context matches',
        was_helpful: null,
        was_reviewed: false,
        created_at: new Date().toISOString(),
        thought: {
          id: 'thought-2',
          user_id: 'user-1',
          content: 'Give feedback with empathy',
          source: null,
          source_url: null,
          context_tag: 'feedback',
          custom_context: null,
          status: 'active',
          application_count: 5,
          skip_count: 1,
          last_surfaced_at: null,
          last_applied_at: null,
          retired_at: null,
          graduated_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders moment header', () => {
    render(<PrepCard moment={mockMoment} />)
    expect(screen.getByText(/preparing for/i)).toBeInTheDocument()
    expect(screen.getByText('1:1 with manager')).toBeInTheDocument()
  })

  it('shows thoughts sorted by relevance', () => {
    render(<PrepCard moment={mockMoment} />)
    const thoughts = screen.getAllByTestId('thought-card')
    expect(thoughts.length).toBe(2)
  })

  it('shows relevance reasons', () => {
    render(<PrepCard moment={mockMoment} />)
    expect(screen.getByText(/listening applies/i)).toBeInTheDocument()
    expect(screen.getByText(/feedback context/i)).toBeInTheDocument()
  })

  it('shows "Got it" and "Not helpful" buttons', () => {
    render(<PrepCard moment={mockMoment} />)
    expect(screen.getAllByText('Got it').length).toBe(2)
    expect(screen.getAllByText('Not helpful').length).toBe(2)
  })

  it('shows "Done Preparing" button', () => {
    render(<PrepCard moment={mockMoment} />)
    expect(screen.getByText('Done Preparing')).toBeInTheDocument()
  })

  it('navigates back when back button clicked', async () => {
    const user = userEvent.setup()
    render(<PrepCard moment={mockMoment} />)
    await user.click(screen.getByText('Back'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('shows empty state when no thoughts matched', () => {
    const emptyMoment: MomentWithThoughts = {
      ...mockMoment,
      gems_matched_count: 0,
      matched_thoughts: [],
    }
    render(<PrepCard moment={emptyMoment} />)
    expect(screen.getByText(/no thoughts matched/i)).toBeInTheDocument()
    expect(screen.getByText(/add a thought/i)).toBeInTheDocument()
  })

  it('shows thought count', () => {
    render(<PrepCard moment={mockMoment} />)
    expect(screen.getByText(/2 thoughts to prepare with/i)).toBeInTheDocument()
  })

  it('shows calendar event title when present', () => {
    const calendarMoment: MomentWithThoughts = {
      ...mockMoment,
      source: 'calendar',
      calendar_event_title: 'Team Standup',
      calendar_event_start: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
    }
    render(<PrepCard moment={calendarMoment} />)
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
  })

  it('hides actions in read-only mode', () => {
    render(<PrepCard moment={mockMoment} readOnly />)
    expect(screen.queryByText('Done Preparing')).not.toBeInTheDocument()
  })
})
