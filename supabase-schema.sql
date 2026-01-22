-- ===========================================
-- NOTEKEEPER DATABASE SCHEMA
-- ===========================================
-- Run this in your Supabase SQL Editor:
-- 1. Go to your Supabase project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste this entire file
-- 4. Click "Run"
-- ===========================================

-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS notes_is_favorite_idx ON notes(is_favorite);

-- Enable Row Level Security (RLS)
-- This ensures users can ONLY see their own notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own notes
CREATE POLICY "Users can view own notes"
  ON notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only INSERT their own notes
CREATE POLICY "Users can create own notes"
  ON notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own notes
CREATE POLICY "Users can update own notes"
  ON notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only DELETE their own notes
CREATE POLICY "Users can delete own notes"
  ON notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on updates
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- VERIFICATION
-- ===========================================
-- After running, you should see:
-- 1. "notes" table in Table Editor
-- 2. RLS enabled (shield icon) on the notes table
-- 3. 4 policies when you click on the table's policies
-- ===========================================
