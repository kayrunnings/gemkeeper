/**
 * Tests for AICaptureModal component
 * Tests modal states, content type detection display, item selection, and save flow
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AICaptureModal } from '@/components/capture/AICaptureModal'
import type { ContextWithCount } from '@/lib/types/context'

// Mock fetch
global.fetch = jest.fn()

describe('AICaptureModal', () => {
  const mockOnClose = jest.fn()
  const mockContexts: ContextWithCount[] = [
    { id: 'ctx-1', user_id: 'user-1', name: 'Work', slug: 'work', color: '#3B82F6', icon: null, is_default: true, thought_limit: 20, sort_order: 0, created_at: '2024-01-01', updated_at: '2024-01-01', thought_count: 5 },
    { id: 'ctx-2', user_id: 'user-1', name: 'Personal', slug: 'personal', color: '#10B981', icon: null, is_default: true, thought_limit: 20, sort_order: 1, created_at: '2024-01-01', updated_at: '2024-01-01', thought_count: 3 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [],
        contentType: 'short_text',
      }),
    })
  })

  describe('empty state', () => {
    it('renders empty state when first opened', () => {
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      expect(screen.getByText('AI Capture')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/paste or type anything/i)).toBeInTheDocument()
    })

    it('shows example patterns in empty state', () => {
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      expect(screen.getByText('Paste an article URL')).toBeInTheDocument()
      expect(screen.getByText('Paste a quote')).toBeInTheDocument()
      expect(screen.getByText('Paste meeting notes')).toBeInTheDocument()
      expect(screen.getByText('Type a quick idea')).toBeInTheDocument()
    })

    it('fills textarea when example is clicked', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      await user.click(screen.getByText('Paste a quote'))

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      expect(textarea).toHaveValue(expect.stringContaining('Steve Jobs'))
    })

    it('does not render when isOpen is false', () => {
      render(<AICaptureModal isOpen={false} onClose={mockOnClose} contexts={mockContexts} />)

      expect(screen.queryByText('AI Capture')).not.toBeInTheDocument()
    })
  })

  describe('input state', () => {
    it('shows Analyze button when content is entered', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Some content to analyze')

      expect(screen.getByRole('button', { name: /analyze content/i })).toBeInTheDocument()
    })

    it('shows character count', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Test content')

      expect(screen.getByText(/12 characters/i)).toBeInTheDocument()
    })

    it('disables Analyze button when no content', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      // Click an example to get to input state
      await user.click(screen.getByText('Type a quick idea'))

      // Clear the textarea
      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.clear(textarea)

      // Should not find an enabled Analyze button (it goes back to empty state)
      expect(screen.queryByRole('button', { name: /analyze content/i })).not.toBeInTheDocument()
    })
  })

  describe('analyzing state', () => {
    it('shows loading state while analyzing', async () => {
      // Make fetch hang
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content to analyze')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
      })
    })

    it('sends content to analyze endpoint', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [],
          contentType: 'short_text',
        }),
      })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content to analyze')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/capture/analyze',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Content to analyze'),
          })
        )
      })
    })
  })

  describe('suggestions state', () => {
    const mockSuggestions = [
      { id: '1', type: 'thought', content: 'First insight', selected: true },
      { id: '2', type: 'thought', content: 'Second insight', selected: true },
      { id: '3', type: 'note', content: 'A longer note content', selected: true },
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: mockSuggestions,
          contentType: 'mixed',
        }),
      })
    })

    it('displays suggestions after analysis', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content to analyze')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('First insight')).toBeInTheDocument()
        expect(screen.getByText('Second insight')).toBeInTheDocument()
      })
    })

    it('allows item selection/deselection', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content to analyze')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('First insight')).toBeInTheDocument()
      })

      // Suggestions should have checkboxes
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('shows cancel button to go back', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('First insight')).toBeInTheDocument()
      })

      // Should have a way to go back
      const cancelButton = screen.getByRole('button', { name: /back/i })
      expect(cancelButton).toBeInTheDocument()
    })
  })

  describe('save flow', () => {
    const mockSuggestions = [
      { id: '1', type: 'thought', content: 'First insight', selected: true },
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            suggestions: mockSuggestions,
            contentType: 'short_text',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            created: { thoughts: 1, notes: 0, sources: 0 },
          }),
        })
    })

    it('shows success state after save', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('First insight')).toBeInTheDocument()
      })

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument()
      })
    })

    it('shows count of saved items', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            suggestions: [
              { id: '1', type: 'thought', content: 'Thought 1', selected: true },
              { id: '2', type: 'thought', content: 'Thought 2', selected: true },
            ],
            contentType: 'short_text',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            created: { thoughts: 2, notes: 0, sources: 0 },
          }),
        })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('Thought 1')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/2 thought/i)).toBeInTheDocument()
      })
    })

    it('calls save endpoint with selected items', async () => {
      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('First insight')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/capture/save',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })
  })

  describe('error state', () => {
    it('shows error message on analysis failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Analysis failed' }),
      })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })
    })

    it('shows Try Again button on error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Analysis failed' }),
      })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Content')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('shows error when no suggestions found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [],
          contentType: 'short_text',
        }),
      })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Random gibberish xyz123')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText(/no insights detected/i)).toBeInTheDocument()
      })
    })
  })

  describe('modal behavior', () => {
    it('resets state when modal closes', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'Some content')

      // Close the modal
      rerender(<AICaptureModal isOpen={false} onClose={mockOnClose} contexts={mockContexts} />)

      // Reopen
      rerender(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      // Should be reset to empty state
      expect(screen.getByPlaceholderText(/paste or type anything/i)).toHaveValue('')
    })
  })

  describe('content type detection display', () => {
    it('handles URL content type', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [{ id: '1', type: 'source', content: 'Example Article', selected: true }],
          contentType: 'url',
        }),
      })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, 'https://example.com/article')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('Example Article')).toBeInTheDocument()
      })
    })

    it('handles list content type', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [
            { id: '1', type: 'thought', content: 'Item 1', selected: true },
            { id: '2', type: 'thought', content: 'Item 2', selected: true },
          ],
          contentType: 'list',
        }),
      })

      const user = userEvent.setup()
      render(<AICaptureModal isOpen={true} onClose={mockOnClose} contexts={mockContexts} />)

      const textarea = screen.getByPlaceholderText(/paste or type anything/i)
      await user.type(textarea, '- Item 1\n- Item 2')

      await user.click(screen.getByRole('button', { name: /analyze content/i }))

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item 2')).toBeInTheDocument()
      })
    })
  })
})
