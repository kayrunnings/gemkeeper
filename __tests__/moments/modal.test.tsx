import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MomentEntryModal } from '@/components/moments/MomentEntryModal'

// Mock fetch
global.fetch = jest.fn()

describe('MomentEntryModal', () => {
  const mockOnClose = jest.fn()
  const mockOnMomentCreated = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        moment: {
          id: '123',
          description: 'Test moment',
          gems_matched_count: 2,
          matched_gems: [
            { gem_id: '1', relevance_score: 0.9 },
            { gem_id: '2', relevance_score: 0.8 },
          ],
        },
      }),
    })
  })

  it('renders input when open', () => {
    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    expect(screen.getByPlaceholderText(/what's coming up/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <MomentEntryModal
        isOpen={false}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    expect(screen.queryByPlaceholderText(/what's coming up/i)).not.toBeInTheDocument()
  })

  it('shows character count', async () => {
    const user = userEvent.setup()
    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test moment')
    expect(screen.getByText('11/500')).toBeInTheDocument()
  })

  it('disables submit when empty', () => {
    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const button = screen.getByRole('button', { name: /find my thoughts/i })
    expect(button).toBeDisabled()
  })

  it('enables submit when text entered', async () => {
    const user = userEvent.setup()
    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test moment')
    const button = screen.getByRole('button', { name: /find my thoughts/i })
    expect(button).not.toBeDisabled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    // Make fetch hang to test loading state
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test moment')
    await user.click(screen.getByRole('button', { name: /find my thoughts/i }))

    await waitFor(() => {
      expect(screen.getByText(/finding your wisdom/i)).toBeInTheDocument()
    })
  })

  it('calls onMomentCreated on successful submission', async () => {
    const user = userEvent.setup()
    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test moment')
    await user.click(screen.getByRole('button', { name: /find my thoughts/i }))

    await waitFor(() => {
      expect(mockOnMomentCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          gems_matched_count: 2,
        })
      )
    })
  })

  it('shows empty state when no thoughts matched', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        moment: {
          id: '123',
          description: 'Test moment',
          gems_matched_count: 0,
          matched_gems: [],
        },
      }),
    })

    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test moment')
    await user.click(screen.getByRole('button', { name: /find my thoughts/i }))

    await waitFor(() => {
      expect(screen.getByText(/no thoughts matched/i)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Test error' }),
    })

    render(
      <MomentEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onMomentCreated={mockOnMomentCreated}
      />
    )
    const input = screen.getByRole('textbox')
    await user.type(input, 'Test moment')
    await user.click(screen.getByRole('button', { name: /find my thoughts/i }))

    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument()
    })
  })
})
