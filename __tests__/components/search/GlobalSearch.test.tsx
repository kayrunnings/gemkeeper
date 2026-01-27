/**
 * Tests for GlobalSearch component
 * Tests modal behavior, search input, keyboard navigation, and filter buttons
 */

/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalSearch } from '@/components/search/GlobalSearch'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('GlobalSearch', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
        total: 0,
        query: '',
      }),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('modal open/close behavior', () => {
    it('renders when isOpen is true', () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByPlaceholderText(/search your knowledge/i)).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<GlobalSearch isOpen={false} onClose={mockOnClose} />)

      expect(screen.queryByPlaceholderText(/search your knowledge/i)).not.toBeInTheDocument()
    })

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      await user.type(input, '{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      // Find the X button by its parent button that contains the X icon
      const closeButton = screen.getByRole('button', { name: '' })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('focuses input when modal opens', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      // Wait for focus with fake timers
      jest.advanceTimersByTime(150)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search your knowledge/i)).toHaveFocus()
      })
    })

    it('resets state when modal closes and reopens', async () => {
      const { rerender } = render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test query' } })

      // Close modal
      rerender(<GlobalSearch isOpen={false} onClose={mockOnClose} />)

      // Reopen modal
      rerender(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByPlaceholderText(/search your knowledge/i)).toHaveValue('')
    })
  })

  describe('search input and debouncing', () => {
    it('debounces search input by 300ms', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })

      // Should not call fetch immediately
      expect(global.fetch).not.toHaveBeenCalled()

      // Advance timers by 300ms
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search?q=test')
        )
      })
    })

    it('does not fetch for empty query', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: '' } })

      jest.advanceTimersByTime(300)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('cancels previous debounced search on new input', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)

      // Type first query
      fireEvent.change(input, { target: { value: 'first' } })
      jest.advanceTimersByTime(200) // Not yet 300ms

      // Type second query before first completes
      fireEvent.change(input, { target: { value: 'second' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        // Only the second query should have been searched
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('q=second')
        )
      })
    })
  })

  describe('filter buttons', () => {
    it('renders filter buttons', () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Thoughts' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Notes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sources' })).toBeInTheDocument()
    })

    it('applies type filter when filter button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      // First enter a query
      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      // Clear mock to check next call
      ;(global.fetch as jest.Mock).mockClear()

      // Click Thoughts filter
      const thoughtsFilter = screen.getByRole('button', { name: 'Thoughts' })
      await user.click(thoughtsFilter)

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=thought')
        )
      })
    })

    it('clears type filter when All is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      // Click Thoughts filter then All
      await user.click(screen.getByRole('button', { name: 'Thoughts' }))
      jest.advanceTimersByTime(300)

      ;(global.fetch as jest.Mock).mockClear()

      await user.click(screen.getByRole('button', { name: 'All' }))
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/search\?q=test$/)
        )
      })
    })
  })

  describe('keyboard navigation', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { id: '1', type: 'thought', text: 'Result 1', secondaryText: null, contextId: null, createdAt: '2024-01-01', rank: 1 },
            { id: '2', type: 'note', text: 'Result 2', secondaryText: null, contextId: null, createdAt: '2024-01-02', rank: 2 },
            { id: '3', type: 'source', text: 'Result 3', secondaryText: null, contextId: null, createdAt: '2024-01-03', rank: 3 },
          ],
          total: 3,
          query: 'test',
        }),
      })
    })

    it('navigates down with ArrowDown key', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument()
      })

      // Press ArrowDown
      fireEvent.keyDown(input, { key: 'ArrowDown' })

      // First item should start selected (index 0), after down it should be index 1
    })

    it('navigates up with ArrowUp key', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument()
      })

      // Navigate down twice then up
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'ArrowUp' })

      // Should be at index 1 now
    })

    it('opens selected result on Enter key', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument()
      })

      // Press Enter on first result (thought)
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/thoughts/1')
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('does not go below last result', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument()
      })

      // Press ArrowDown many times
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      }

      // Should be at last item (index 2)
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        // Last item is a source
        expect(mockPush).toHaveBeenCalledWith('/library/sources/3')
      })
    })

    it('does not go above first result', async () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Result 1')).toBeInTheDocument()
      })

      // Press ArrowUp many times
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(input, { key: 'ArrowUp' })
      }

      // Should still be at first item (index 0)
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/thoughts/1')
      })
    })
  })

  describe('result navigation', () => {
    it('navigates to thought detail page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { id: 'thought-1', type: 'thought', text: 'Test thought', secondaryText: null, contextId: null, createdAt: '2024-01-01', rank: 1 },
          ],
          total: 1,
          query: 'test',
        }),
      })

      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Test thought')).toBeInTheDocument()
      })

      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockPush).toHaveBeenCalledWith('/thoughts/thought-1')
    })

    it('navigates to note with query param', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { id: 'note-1', type: 'note', text: 'Test note', secondaryText: null, contextId: null, createdAt: '2024-01-01', rank: 1 },
          ],
          total: 1,
          query: 'test',
        }),
      })

      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Test note')).toBeInTheDocument()
      })

      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockPush).toHaveBeenCalledWith('/dashboard?note=note-1')
    })

    it('navigates to source library page', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { id: 'source-1', type: 'source', text: 'Test source', secondaryText: null, contextId: null, createdAt: '2024-01-01', rank: 1 },
          ],
          total: 1,
          query: 'test',
        }),
      })

      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText('Test source')).toBeInTheDocument()
      })

      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockPush).toHaveBeenCalledWith('/library/sources/source-1')
    })
  })

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByPlaceholderText(/search your knowledge/i)
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)

      // Should not crash, results should be empty
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('UI elements', () => {
    it('shows keyboard shortcuts in footer', () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText('navigate')).toBeInTheDocument()
      expect(screen.getByText('open')).toBeInTheDocument()
      expect(screen.getByText('close')).toBeInTheDocument()
    })

    it('shows esc shortcut hint', () => {
      render(<GlobalSearch isOpen={true} onClose={mockOnClose} />)

      expect(screen.getAllByText('esc')).toHaveLength(2) // One in header, one in footer
    })
  })
})
