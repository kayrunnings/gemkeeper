-- ===========================================
-- GEMKEEPER EPIC 8 SCHEMA
-- Individual Gem Schedules & Moment-Based Surfacing
-- ===========================================
-- Run this in your Supabase SQL Editor after the base schema

-- ===========================================
-- GEM SCHEDULES TABLE
-- ===========================================
-- Stores custom check-in schedules per gem

CREATE TABLE IF NOT EXISTS gem_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gem_id UUID REFERENCES gems(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cron_expression TEXT NOT NULL,
  human_readable TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  days_of_week INTEGER[] DEFAULT NULL,
  time_of_day TIME DEFAULT NULL,
  day_of_month INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  next_trigger_at TIMESTAMPTZ DEFAULT NULL,
  last_triggered_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS gem_schedules_gem_id_idx ON gem_schedules(gem_id);
CREATE INDEX IF NOT EXISTS gem_schedules_user_id_idx ON gem_schedules(user_id);
CREATE INDEX IF NOT EXISTS gem_schedules_next_trigger_idx ON gem_schedules(next_trigger_at) WHERE is_active = true;

ALTER TABLE gem_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gem schedules"
  ON gem_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gem schedules"
  ON gem_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gem schedules"
  ON gem_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gem schedules"
  ON gem_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- MOMENTS TABLE
-- ===========================================
-- Stores user-initiated or calendar-triggered situations

CREATE TABLE IF NOT EXISTS moments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'calendar')),
  calendar_event_id TEXT DEFAULT NULL,
  calendar_event_title TEXT DEFAULT NULL,
  calendar_event_start TIMESTAMPTZ DEFAULT NULL,
  gems_matched_count INTEGER DEFAULT 0,
  ai_processing_time_ms INTEGER DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS moments_user_id_idx ON moments(user_id);
CREATE INDEX IF NOT EXISTS moments_status_idx ON moments(status);
CREATE INDEX IF NOT EXISTS moments_created_at_idx ON moments(created_at DESC);
CREATE INDEX IF NOT EXISTS moments_calendar_event_idx ON moments(calendar_event_id) WHERE calendar_event_id IS NOT NULL;

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moments"
  ON moments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own moments"
  ON moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moments"
  ON moments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moments"
  ON moments FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- MOMENT GEMS TABLE
-- ===========================================
-- Junction table for matched gems to moments

CREATE TABLE IF NOT EXISTS moment_gems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE NOT NULL,
  gem_id UUID REFERENCES gems(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  relevance_score DECIMAL(3,2) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  relevance_reason TEXT DEFAULT NULL,
  was_helpful BOOLEAN DEFAULT NULL,
  was_reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (moment_id, gem_id)
);

CREATE INDEX IF NOT EXISTS moment_gems_moment_id_idx ON moment_gems(moment_id);
CREATE INDEX IF NOT EXISTS moment_gems_gem_id_idx ON moment_gems(gem_id);
CREATE INDEX IF NOT EXISTS moment_gems_user_id_idx ON moment_gems(user_id);

ALTER TABLE moment_gems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moment gems"
  ON moment_gems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own moment gems"
  ON moment_gems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moment gems"
  ON moment_gems FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moment gems"
  ON moment_gems FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- CALENDAR CONNECTIONS TABLE
-- ===========================================
-- Stores OAuth connections to calendar providers

CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_moment_enabled BOOLEAN DEFAULT true,
  lead_time_minutes INTEGER DEFAULT 30,
  event_filter TEXT DEFAULT 'all' CHECK (event_filter IN ('all', 'meetings', 'custom')),
  custom_keywords TEXT[] DEFAULT '{}',
  last_sync_at TIMESTAMPTZ DEFAULT NULL,
  sync_error TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS calendar_connections_user_id_idx ON calendar_connections(user_id);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar connections"
  ON calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- CALENDAR EVENTS CACHE TABLE
-- ===========================================
-- Cache synced calendar events for auto-moment triggers

CREATE TABLE IF NOT EXISTS calendar_events_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  external_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  moment_created BOOLEAN DEFAULT false,
  moment_id UUID REFERENCES moments(id) ON DELETE SET NULL DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (connection_id, external_event_id)
);

CREATE INDEX IF NOT EXISTS calendar_events_cache_user_id_idx ON calendar_events_cache(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_cache_start_time_idx ON calendar_events_cache(start_time);
CREATE INDEX IF NOT EXISTS calendar_events_cache_moment_created_idx ON calendar_events_cache(moment_created) WHERE moment_created = false;

ALTER TABLE calendar_events_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
  ON calendar_events_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar events"
  ON calendar_events_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events_cache FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- UPDATE TRIGGERS
-- ===========================================
-- Reuse the existing update_updated_at_column function

DROP TRIGGER IF EXISTS update_gem_schedules_updated_at ON gem_schedules;
CREATE TRIGGER update_gem_schedules_updated_at
  BEFORE UPDATE ON gem_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_moments_updated_at ON moments;
CREATE TRIGGER update_moments_updated_at
  BEFORE UPDATE ON moments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON calendar_connections;
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_cache_updated_at ON calendar_events_cache;
CREATE TRIGGER update_calendar_events_cache_updated_at
  BEFORE UPDATE ON calendar_events_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- VERIFICATION
-- ===========================================
-- After running, you should see:
-- 1. "gem_schedules" table
-- 2. "moments" table
-- 3. "moment_gems" table
-- 4. "calendar_connections" table
-- 5. "calendar_events_cache" table
-- All with RLS enabled and proper policies
-- ===========================================
