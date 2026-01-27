/**
 * Tests for sources service
 * Tests CRUD operations for source entities (books, articles, podcasts, etc.)
 */

import {
  createSource,
  getSource,
  getSources,
  getSourceByUrl,
  updateSource,
  deleteSource
} from "@/lib/sources"
import { SOURCE_TYPE_LABELS, SOURCE_TYPE_ICONS } from "@/lib/types/source"

// Mock the Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

let mockSupabaseClient: any

describe("sources service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockQueryBuilder),
    }
  })

  let mockQueryBuilder: any

  beforeEach(() => {
    mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
  })

  describe("authentication", () => {
    it("returns error when user is not authenticated for createSource", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await createSource({ name: "Test Book" })

      expect(result.error).toBe("Not authenticated")
      expect(result.data).toBeNull()
    })

    it("returns error when user is not authenticated for getSource", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getSource("source-123")

      expect(result.error).toBe("Not authenticated")
      expect(result.data).toBeNull()
    })

    it("returns error when user is not authenticated for getSources", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getSources()

      expect(result.error).toBe("Not authenticated")
      expect(result.data).toEqual([])
    })
  })

  describe("createSource", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("creates a source with required fields only", async () => {
      const mockSource = {
        id: "source-1",
        user_id: "user-123",
        name: "Atomic Habits",
        author: null,
        type: "other",
        url: null,
        isbn: null,
        cover_image_url: null,
        metadata: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }

      mockQueryBuilder.single.mockResolvedValue({
        data: mockSource,
        error: null,
      })

      const result = await createSource({ name: "Atomic Habits" })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("sources")
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Atomic Habits",
        author: null,
        type: "other",
        url: null,
        isbn: null,
        cover_image_url: null,
        metadata: {},
      })
      expect(result.data).toEqual(mockSource)
      expect(result.error).toBeNull()
    })

    it("creates a source with all optional fields", async () => {
      const mockSource = {
        id: "source-1",
        user_id: "user-123",
        name: "Atomic Habits",
        author: "James Clear",
        type: "book",
        url: "https://jamesclear.com/atomic-habits",
        isbn: "9780735211292",
        cover_image_url: "https://example.com/cover.jpg",
        metadata: { pages: 320 },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }

      mockQueryBuilder.single.mockResolvedValue({
        data: mockSource,
        error: null,
      })

      const result = await createSource({
        name: "Atomic Habits",
        author: "James Clear",
        type: "book",
        url: "https://jamesclear.com/atomic-habits",
        isbn: "9780735211292",
        cover_image_url: "https://example.com/cover.jpg",
        metadata: { pages: 320 },
      })

      expect(result.data?.type).toBe("book")
      expect(result.data?.author).toBe("James Clear")
      expect(result.error).toBeNull()
    })

    it("returns error on database failure", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      })

      const result = await createSource({ name: "Test Book" })

      expect(result.error).toBe("Database error")
      expect(result.data).toBeNull()
    })
  })

  describe("getSource", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("gets a source by ID with user ownership check", async () => {
      const mockSource = {
        id: "source-1",
        user_id: "user-123",
        name: "Atomic Habits",
        type: "book",
      }

      mockQueryBuilder.single.mockResolvedValue({
        data: mockSource,
        error: null,
      })

      const result = await getSource("source-1")

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "source-1")
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123")
      expect(result.data).toEqual(mockSource)
    })

    it("returns 'Source not found' for non-existent source", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      })

      const result = await getSource("non-existent")

      expect(result.error).toBe("Source not found")
      expect(result.data).toBeNull()
    })
  })

  describe("getSources", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("gets all sources for the current user", async () => {
      const mockSources = [
        { id: "1", name: "Book 1", type: "book" },
        { id: "2", name: "Article 1", type: "article" },
      ]

      mockQueryBuilder.order.mockResolvedValue({
        data: mockSources,
        error: null,
      })

      const result = await getSources()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("sources")
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123")
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false })
      expect(result.data).toHaveLength(2)
    })

    it("returns empty array on error", async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      })

      const result = await getSources()

      expect(result.data).toEqual([])
      expect(result.error).toBe("Database error")
    })
  })

  describe("getSourceByUrl (deduplication)", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("finds existing source by URL", async () => {
      const mockSource = {
        id: "source-1",
        name: "Article Title",
        url: "https://example.com/article",
      }

      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: mockSource,
        error: null,
      })

      const result = await getSourceByUrl("https://example.com/article")

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123")
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("url", "https://example.com/article")
      expect(result.data).toEqual(mockSource)
    })

    it("returns null when no source found by URL", async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getSourceByUrl("https://new-url.com")

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("updateSource", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("updates a source with new values", async () => {
      const mockUpdated = {
        id: "source-1",
        name: "Updated Name",
        author: "New Author",
      }

      mockQueryBuilder.single.mockResolvedValue({
        data: mockUpdated,
        error: null,
      })

      const result = await updateSource("source-1", { name: "Updated Name", author: "New Author" })

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Name",
          author: "New Author",
        })
      )
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "source-1")
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123")
      expect(result.data).toEqual(mockUpdated)
    })

    it("returns 'Source not found' for non-existent source", async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      })

      const result = await updateSource("non-existent", { name: "Test" })

      expect(result.error).toBe("Source not found")
    })
  })

  describe("deleteSource", () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      })
    })

    it("deletes a source with user ownership check", async () => {
      mockQueryBuilder.eq.mockResolvedValue({
        error: null,
      })

      const result = await deleteSource("source-1")

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("sources")
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "source-1")
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123")
      expect(result.error).toBeNull()
    })

    it("returns error on delete failure", async () => {
      mockQueryBuilder.eq.mockResolvedValue({
        error: { message: "Delete failed" },
      })

      const result = await deleteSource("source-1")

      expect(result.error).toBe("Delete failed")
    })
  })
})

describe("source type constants", () => {
  it("has labels for all source types", () => {
    expect(SOURCE_TYPE_LABELS.book).toBe("Book")
    expect(SOURCE_TYPE_LABELS.article).toBe("Article")
    expect(SOURCE_TYPE_LABELS.podcast).toBe("Podcast")
    expect(SOURCE_TYPE_LABELS.video).toBe("Video")
    expect(SOURCE_TYPE_LABELS.course).toBe("Course")
    expect(SOURCE_TYPE_LABELS.other).toBe("Other")
  })

  it("has icons for all source types", () => {
    expect(SOURCE_TYPE_ICONS.book).toBeTruthy()
    expect(SOURCE_TYPE_ICONS.article).toBeTruthy()
    expect(SOURCE_TYPE_ICONS.podcast).toBeTruthy()
    expect(SOURCE_TYPE_ICONS.video).toBeTruthy()
    expect(SOURCE_TYPE_ICONS.course).toBeTruthy()
    expect(SOURCE_TYPE_ICONS.other).toBeTruthy()
  })

  it("has six source types", () => {
    const types = Object.keys(SOURCE_TYPE_LABELS)
    expect(types).toHaveLength(6)
  })
})
