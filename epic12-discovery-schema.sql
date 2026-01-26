-- Epic 12: Discovery Feature Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create discoveries table
CREATE TABLE IF NOT EXISTS discoveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('curated', 'directed')),
  query TEXT,
  context_id UUID REFERENCES contexts(id) ON DELETE SET NULL,
  thought_content TEXT NOT NULL,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('article', 'video', 'research', 'blog')),
  article_summary TEXT NOT NULL,
  relevance_reason TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('trending', 'evergreen')),
  suggested_context_id UUID REFERENCES contexts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'saved', 'skipped')),
  saved_gem_id UUID REFERENCES gems(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create discovery_usage table (tracks daily limits)
CREATE TABLE IF NOT EXISTS discovery_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  curated_count INTEGER NOT NULL DEFAULT 0,
  directed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- 3. Create discovery_skips table (tracks skipped content)
CREATE TABLE IF NOT EXISTS discovery_skips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  source_url TEXT NOT NULL,
  skipped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_hash)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discoveries_user_id ON discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_status ON discoveries(status);
CREATE INDEX IF NOT EXISTS idx_discoveries_created_at ON discoveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_usage_user_date ON discovery_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_discovery_skips_user_hash ON discovery_skips(user_id, content_hash);

-- 5. Enable Row Level Security
ALTER TABLE discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_skips ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for discoveries
CREATE POLICY "Users can view own discoveries"
  ON discoveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discoveries"
  ON discoveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discoveries"
  ON discoveries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discoveries"
  ON discoveries FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create RLS policies for discovery_usage
CREATE POLICY "Users can view own usage"
  ON discovery_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON discovery_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON discovery_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Create RLS policies for discovery_skips
CREATE POLICY "Users can view own skips"
  ON discovery_skips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skips"
  ON discovery_skips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. Create updated_at trigger for discoveries
CREATE OR REPLACE FUNCTION update_discoveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discoveries_updated_at
  BEFORE UPDATE ON discoveries
  FOR EACH ROW
  EXECUTE FUNCTION update_discoveries_updated_at();
