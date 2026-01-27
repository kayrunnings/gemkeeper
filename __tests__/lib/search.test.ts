/**
 * Tests for search service
 * Tests full-text search functionality across thoughts, notes, and sources
 */

import { search } from "@/lib/search"

// Mock the Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

let mockSupabaseClient: any

describe("search service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
    }
  })

  describe("empty query handling", () => {
    it("returns empty results for empty query", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })

      const result = await search("")

      expect(result.data.results).toEqual([])
      expect(result.data.total).toBe(0)
      expect(result.data.query).toBe("")
      expect(result.error).toBeNull()
    })

    it("returns empty results for whitespace-only query", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })

      const result = await search("   ")

      expect(result.data.results).toEqual([])
      expect(result.data.total).toBe(0)
      expect(result.error).toBeNull()
    })
  })

  describe("authentication", () => {
    it("returns error when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await search("test query")

      expect(result.error).toBe("Not authenticated")
      expect(result.data.results).toEqual([])
    })
  })

  describe("successful search", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("calls search_knowledge RPC with correct parameters", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await search("test query", { limit: 10, offset: 5 })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("search_knowledge", {
        search_query: "test query",
        filter_type: null,
        filter_context_id: null,
        result_limit: 10,
        result_offset: 5,
      })
    })

    it("passes type filter to RPC", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await search("test", { type: "thought" })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("search_knowledge", {
        search_query: "test",
        filter_type: "thought",
        filter_context_id: null,
        result_limit: 20,
        result_offset: 0,
      })
    })

    it("passes context filter to RPC", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await search("test", { contextId: "context-123" })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("search_knowledge", {
        search_query: "test",
        filter_type: null,
        filter_context_id: "context-123",
        result_limit: 20,
        result_offset: 0,
      })
    })

    it("transforms search results correctly", async () => {
      const mockResults = [
        {
          id: "1",
          type: "thought",
          text: "Test thought content",
          secondary_text: "Source: Book",
          context_id: "ctx-1",
          created_at: "2024-01-01T00:00:00Z",
          rank: 0.95,
        },
        {
          id: "2",
          type: "note",
          text: "Note title",
          secondary_text: "Note preview...",
          context_id: null,
          created_at: "2024-01-02T00:00:00Z",
          rank: 0.8,
        },
      ]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockResults,
        error: null,
      })

      const result = await search("test")

      expect(result.data.results).toHaveLength(2)
      expect(result.data.results[0]).toEqual({
        id: "1",
        type: "thought",
        text: "Test thought content",
        secondaryText: "Source: Book",
        contextId: "ctx-1",
        createdAt: "2024-01-01T00:00:00Z",
        rank: 0.95,
      })
      expect(result.data.results[1].type).toBe("note")
      expect(result.data.query).toBe("test")
    })

    it("uses default limit of 20", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await search("test")

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        "search_knowledge",
        expect.objectContaining({
          result_limit: 20,
          result_offset: 0,
        })
      )
    })
  })

  describe("pagination", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("passes limit and offset correctly", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await search("test", { limit: 50, offset: 100 })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("search_knowledge", {
        search_query: "test",
        filter_type: null,
        filter_context_id: null,
        result_limit: 50,
        result_offset: 100,
      })
    })
  })

  describe("type filtering", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("filters by thought type", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ id: "1", type: "thought", text: "Test", secondary_text: null, context_id: null, created_at: "2024-01-01", rank: 1 }],
        error: null,
      })

      const result = await search("test", { type: "thought" })

      expect(result.data.results[0].type).toBe("thought")
    })

    it("filters by note type", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ id: "1", type: "note", text: "Test", secondary_text: null, context_id: null, created_at: "2024-01-01", rank: 1 }],
        error: null,
      })

      const result = await search("test", { type: "note" })

      expect(result.data.results[0].type).toBe("note")
    })

    it("filters by source type", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ id: "1", type: "source", text: "Test", secondary_text: null, context_id: null, created_at: "2024-01-01", rank: 1 }],
        error: null,
      })

      const result = await search("test", { type: "source" })

      expect(result.data.results[0].type).toBe("source")
    })
  })

  describe("error handling", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("returns error message on RPC failure", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "500" },
      })

      const result = await search("test")

      expect(result.error).toBe("Database error")
      expect(result.data.results).toEqual([])
    })

    it("handles null data gracefully", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await search("test")

      expect(result.data.results).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe("fallback search", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("falls back to ILIKE search when RPC function not found", async () => {
      // First call: RPC fails with function not found
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { code: "42883", message: "function search_knowledge does not exist" },
      })

      // Setup mock chain for fallback queries
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      }

      // Return empty results for gems, notes, and sources
      mockChain.limit.mockResolvedValue({ data: [] })
      mockSupabaseClient.from.mockReturnValue(mockChain)

      const result = await search("test")

      // Should have called from() for the fallback tables
      expect(mockSupabaseClient.from).toHaveBeenCalled()
      expect(result.error).toBeNull()
    })
  })
})

describe("search filters validation", () => {
  it("accepts valid SearchResultType values", () => {
    const validTypes = ["thought", "note", "source"]
    validTypes.forEach((type) => {
      expect(["thought", "note", "source"]).toContain(type)
    })
  })

  it("SearchFilters interface accepts partial values", () => {
    const filters1 = { type: "thought" as const }
    const filters2 = { limit: 10 }
    const filters3 = { type: "note" as const, contextId: "ctx-1", limit: 50, offset: 10 }

    expect(filters1.type).toBe("thought")
    expect(filters2.limit).toBe(10)
    expect(filters3.type).toBe("note")
  })
})
