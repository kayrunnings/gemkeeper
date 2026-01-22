// Folder type definition
export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

// Note type definition
export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  is_favorite: boolean
  folder_id: string | null
  created_at: string
  updated_at: string
  user_id: string
}

// For creating/updating notes (without server-generated fields)
export interface NoteInput {
  title: string
  content: string
  tags: string[]
  is_favorite?: boolean
}

// User type (from Supabase Auth)
export interface User {
  id: string
  email: string
  created_at: string
}

// Profile type matching the database schema
export interface Profile {
  id: string
  email: string
  name: string | null
  daily_prompt_time: string | null
  checkin_time: string | null
  timezone: string | null
  calendar_connected: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

// Common timezones for the settings dropdown
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "UTC", label: "UTC" },
]
