-- ============================================================================
-- ThoughtFolio 2.0: PKM Pivot Database Migration
-- ============================================================================
--
-- IMPORTANT: This migration is designed to be NON-BREAKING.
-- - Only ADDS new tables and columns
-- - Uses DEFAULT values for all new columns
-- - Does NOT modify or delete existing data
-- - Existing app functionality will continue to work
--
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Or use Supabase CLI: supabase db push
--
-- Version: 1.0
-- Date: January 27, 2026
-- ============================================================================

-- ============================================================================
-- SECTION 1: NEW TABLES
-- ============================================================================

-- 1.1 Sources Table - First-class source entities (books, articles, podcasts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  author TEXT,
  type TEXT CHECK (type IN ('book', 'article', 'podcast', 'video', 'course', 'other')) DEFAULT 'other',
  url TEXT,
  isbn TEXT,
  cover_image_url TEXT,
  metadata JSONB DEFAULT '{}',
  search_vector tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS sources_user_id_idx ON sources(user_id);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS sources_search_idx ON sources USING GIN (search_vector);

-- Enable RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own sources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sources' AND policyname = 'Users can manage their own sources'
  ) THEN
    CREATE POLICY "Users can manage their own sources" ON sources
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to update search_vector on insert/update
CREATE OR REPLACE FUNCTION sources_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'B');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sources_search_vector_trigger ON sources;
CREATE TRIGGER sources_search_vector_trigger
  BEFORE INSERT OR UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION sources_search_vector_update();


-- 1.2 Note-Thought Links Table - Bi-directional linking
-- ============================================================================
CREATE TABLE IF NOT EXISTS note_thought_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  gem_id UUID NOT NULL REFERENCES gems(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, gem_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS note_thought_links_note_id_idx ON note_thought_links(note_id);
CREATE INDEX IF NOT EXISTS note_thought_links_gem_id_idx ON note_thought_links(gem_id);

-- Enable RLS (inherited through parent tables)
ALTER TABLE note_thought_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access links for their own notes/gems
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'note_thought_links' AND policyname = 'Users can manage their own note-thought links'
  ) THEN
    CREATE POLICY "Users can manage their own note-thought links" ON note_thought_links
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM notes WHERE notes.id = note_thought_links.note_id AND notes.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM notes WHERE notes.id = note_thought_links.note_id AND notes.user_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ============================================================================
-- SECTION 2: NEW COLUMNS ON EXISTING TABLES (NON-BREAKING)
-- ============================================================================

-- 2.1 Profiles Table - New settings columns
-- ============================================================================
DO $$
BEGIN
  -- Focus mode toggle (defaults to TRUE to preserve existing behavior)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'focus_mode_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN focus_mode_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Active list limit (defaults to 10 to preserve existing behavior)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'active_list_limit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active_list_limit INTEGER DEFAULT 10;
    -- Add constraint
    ALTER TABLE profiles ADD CONSTRAINT active_list_limit_range
      CHECK (active_list_limit >= 10 AND active_list_limit <= 25);
  END IF;

  -- Check-in enabled toggle (defaults to TRUE to preserve existing behavior)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'checkin_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN checkin_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;


-- 2.2 Calendar Connections Table - Provider column for Microsoft support
-- ============================================================================
DO $$
BEGIN
  -- Provider column (defaults to 'google' to preserve existing connections)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_connections' AND column_name = 'provider'
  ) THEN
    ALTER TABLE calendar_connections ADD COLUMN provider TEXT DEFAULT 'google';
    -- Add constraint
    ALTER TABLE calendar_connections ADD CONSTRAINT provider_check
      CHECK (provider IN ('google', 'microsoft'));
  END IF;
END $$;


-- 2.3 Gems Table - Source reference and search vector
-- ============================================================================
DO $$
BEGIN
  -- Source reference (nullable, doesn't affect existing data)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gems' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE gems ADD COLUMN source_id UUID REFERENCES sources(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS gems_source_id_idx ON gems(source_id);
  END IF;

  -- Search vector for full-text search
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gems' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE gems ADD COLUMN search_vector tsvector;
    CREATE INDEX IF NOT EXISTS gems_search_idx ON gems USING GIN (search_vector);
  END IF;
END $$;

-- Trigger to update gems search_vector on insert/update
CREATE OR REPLACE FUNCTION gems_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.source, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gems_search_vector_trigger ON gems;
CREATE TRIGGER gems_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content, source ON gems
  FOR EACH ROW EXECUTE FUNCTION gems_search_vector_update();


-- 2.4 Notes Table - Search vector
-- ============================================================================
DO $$
BEGIN
  -- Search vector for full-text search
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE notes ADD COLUMN search_vector tsvector;
    CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING GIN (search_vector);
  END IF;
END $$;

-- Trigger to update notes search_vector on insert/update
CREATE OR REPLACE FUNCTION notes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_search_vector_trigger ON notes;
CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update();


-- 2.5 Discoveries Table - Saved reading list
-- ============================================================================
DO $$
BEGIN
  -- Saved timestamp for reading list
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discoveries' AND column_name = 'saved_at'
  ) THEN
    ALTER TABLE discoveries ADD COLUMN saved_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS discoveries_saved_idx ON discoveries(user_id, saved_at)
      WHERE saved_at IS NOT NULL;
  END IF;
END $$;


-- ============================================================================
-- SECTION 3: POPULATE SEARCH VECTORS FOR EXISTING DATA
-- ============================================================================

-- Populate gems search vectors (for existing rows)
UPDATE gems
SET search_vector =
  setweight(to_tsvector('english', COALESCE(content, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(source, '')), 'B')
WHERE search_vector IS NULL;

-- Populate notes search vectors (for existing rows)
UPDATE notes
SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B')
WHERE search_vector IS NULL;


-- ============================================================================
-- SECTION 4: UNIFIED SEARCH VIEW
-- ============================================================================

-- Drop if exists to allow recreation
DROP VIEW IF EXISTS unified_search;

-- Create unified search view
CREATE VIEW unified_search AS
SELECT
  id,
  'thought' as type,
  content as text,
  source as secondary_text,
  user_id,
  context_id,
  search_vector,
  created_at
FROM gems
WHERE status != 'retired'

UNION ALL

SELECT
  id,
  'note' as type,
  title as text,
  LEFT(content, 200) as secondary_text,
  user_id,
  NULL as context_id,
  search_vector,
  created_at
FROM notes

UNION ALL

SELECT
  id,
  'source' as type,
  name as text,
  author as secondary_text,
  user_id,
  NULL as context_id,
  search_vector,
  created_at
FROM sources;

-- Note: RLS is enforced through the underlying tables, not the view
-- When querying, always filter by user_id


-- ============================================================================
-- SECTION 5: HELPER FUNCTIONS FOR SEARCH
-- ============================================================================

-- Function to perform full-text search with ranking
CREATE OR REPLACE FUNCTION search_knowledge(
  p_user_id UUID,
  p_query TEXT,
  p_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  text TEXT,
  secondary_text TEXT,
  context_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    us.type,
    us.text,
    us.secondary_text,
    us.context_id,
    us.created_at,
    ts_rank(us.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM unified_search us
  WHERE
    us.user_id = p_user_id
    AND us.search_vector @@ websearch_to_tsquery('english', p_query)
    AND (p_type IS NULL OR us.type = p_type)
  ORDER BY rank DESC, us.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm migration success)
-- ============================================================================

-- Uncomment and run these to verify:

-- Check new columns on profiles
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- AND column_name IN ('focus_mode_enabled', 'active_list_limit', 'checkin_enabled');

-- Check sources table exists
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sources');

-- Check note_thought_links table exists
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'note_thought_links');

-- Check search vectors populated
-- SELECT COUNT(*) as total, COUNT(search_vector) as with_vector FROM gems;
-- SELECT COUNT(*) as total, COUNT(search_vector) as with_vector FROM notes;

-- Test search function (replace with your user_id)
-- SELECT * FROM search_knowledge('your-user-id', 'focus goals', NULL, 10, 0);


-- ============================================================================
-- ROLLBACK SCRIPT (Only run if you need to undo this migration)
-- ============================================================================

-- To rollback, run these commands in order:
--
-- DROP FUNCTION IF EXISTS search_knowledge;
-- DROP VIEW IF EXISTS unified_search;
-- DROP TRIGGER IF EXISTS notes_search_vector_trigger ON notes;
-- DROP TRIGGER IF EXISTS gems_search_vector_trigger ON gems;
-- DROP TRIGGER IF EXISTS sources_search_vector_trigger ON sources;
-- DROP FUNCTION IF EXISTS notes_search_vector_update;
-- DROP FUNCTION IF EXISTS gems_search_vector_update;
-- DROP FUNCTION IF EXISTS sources_search_vector_update;
--
-- ALTER TABLE discoveries DROP COLUMN IF EXISTS saved_at;
-- ALTER TABLE notes DROP COLUMN IF EXISTS search_vector;
-- ALTER TABLE gems DROP COLUMN IF EXISTS search_vector;
-- ALTER TABLE gems DROP COLUMN IF EXISTS source_id;
-- ALTER TABLE calendar_connections DROP COLUMN IF EXISTS provider;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS checkin_enabled;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS active_list_limit;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS focus_mode_enabled;
--
-- DROP TABLE IF EXISTS note_thought_links;
-- DROP TABLE IF EXISTS sources;


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- SUCCESS! The migration is complete.
--
-- What was added:
-- 1. sources table (for first-class source entities)
-- 2. note_thought_links table (for bi-directional linking)
-- 3. profiles: focus_mode_enabled, active_list_limit, checkin_enabled columns
-- 4. calendar_connections: provider column
-- 5. gems: source_id, search_vector columns
-- 6. notes: search_vector column
-- 7. discoveries: saved_at column
-- 8. unified_search view for cross-content searching
-- 9. search_knowledge function for ranked search
-- 10. Triggers to auto-update search vectors
--
-- What was NOT changed:
-- - No existing data modified
-- - No columns removed
-- - No tables dropped
-- - All existing functionality preserved
