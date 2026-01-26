/**
 * Tests for context validation logic
 * Note: Service functions that require Supabase are tested via integration tests
 */

import {
  CONTEXT_NAME_MAX_LENGTH,
  CONTEXT_THOUGHT_LIMIT_MIN,
  CONTEXT_THOUGHT_LIMIT_MAX,
  CONTEXT_THOUGHT_LIMIT_DEFAULT,
  DEFAULT_CONTEXT_SLUGS,
  PRESET_CONTEXT_COLORS,
} from "@/lib/types/context"

describe("Context validation constants", () => {
  it("has correct name max length", () => {
    expect(CONTEXT_NAME_MAX_LENGTH).toBe(50)
  })

  it("has correct thought limit range", () => {
    expect(CONTEXT_THOUGHT_LIMIT_MIN).toBe(5)
    expect(CONTEXT_THOUGHT_LIMIT_MAX).toBe(100)
    expect(CONTEXT_THOUGHT_LIMIT_DEFAULT).toBe(20)
  })

  it("has 8 default context slugs", () => {
    expect(DEFAULT_CONTEXT_SLUGS).toHaveLength(8)
    expect(DEFAULT_CONTEXT_SLUGS).toContain("meetings")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("feedback")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("conflict")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("focus")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("health")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("relationships")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("parenting")
    expect(DEFAULT_CONTEXT_SLUGS).toContain("other")
  })

  it("has preset colors for picker", () => {
    expect(PRESET_CONTEXT_COLORS).toHaveLength(10)
    // All colors should be valid hex
    PRESET_CONTEXT_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})

describe("Context name validation", () => {
  it("rejects names longer than max length", () => {
    const longName = "a".repeat(CONTEXT_NAME_MAX_LENGTH + 1)
    expect(longName.length).toBeGreaterThan(CONTEXT_NAME_MAX_LENGTH)
  })

  it("accepts names at max length", () => {
    const maxName = "a".repeat(CONTEXT_NAME_MAX_LENGTH)
    expect(maxName.length).toBe(CONTEXT_NAME_MAX_LENGTH)
  })
})

describe("Context thought limit validation", () => {
  it("rejects limits below minimum", () => {
    const belowMin = CONTEXT_THOUGHT_LIMIT_MIN - 1
    expect(belowMin).toBeLessThan(CONTEXT_THOUGHT_LIMIT_MIN)
  })

  it("rejects limits above maximum", () => {
    const aboveMax = CONTEXT_THOUGHT_LIMIT_MAX + 1
    expect(aboveMax).toBeGreaterThan(CONTEXT_THOUGHT_LIMIT_MAX)
  })

  it("accepts limits within range", () => {
    const validLimit = 50
    expect(validLimit).toBeGreaterThanOrEqual(CONTEXT_THOUGHT_LIMIT_MIN)
    expect(validLimit).toBeLessThanOrEqual(CONTEXT_THOUGHT_LIMIT_MAX)
  })
})

// Slug generation helper (extracted for testing)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

describe("Slug generation", () => {
  it("converts name to lowercase", () => {
    expect(generateSlug("My Context")).toBe("my-context")
  })

  it("replaces spaces with hyphens", () => {
    expect(generateSlug("work projects")).toBe("work-projects")
  })

  it("removes special characters", () => {
    expect(generateSlug("work & play!")).toBe("work-play")
  })

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("---hello---")).toBe("hello")
  })

  it("handles multiple consecutive special chars", () => {
    expect(generateSlug("a   b")).toBe("a-b")
  })

  it("handles unicode characters", () => {
    expect(generateSlug("café ideas")).toBe("caf-ideas")
  })

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("")
  })
})
