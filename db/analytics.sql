-- Bot Analytics Schema
-- Run this migration in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Raw Events Table (append-only log)
-- ============================================
CREATE TABLE IF NOT EXISTS bot_analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id uuid NOT NULL,
  session_id uuid NOT NULL,
  event_type text NOT NULL, 
  -- event_type values: 'session_start','session_end','user_message','bot_message','fallback','rating','error'
  message_id uuid,
  user_id uuid, -- nullable: only if user logged in
  message_text text, -- consider truncation to 2000 chars for storage
  intent text,
  response_time_ms integer,
  channel text DEFAULT 'embed', -- 'embed','web','api'
  ip_hash text, -- SHA256 hash of IP (not raw IP)
  country text, -- ISO country code from IP lookup
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bot_events_bot_created 
  ON bot_analytics_events (bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_events_session 
  ON bot_analytics_events (bot_id, session_id);
CREATE INDEX IF NOT EXISTS idx_bot_events_type 
  ON bot_analytics_events (bot_id, event_type, created_at DESC);

-- ============================================
-- 2. Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS bot_sessions (
  session_id uuid PRIMARY KEY,
  bot_id uuid NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  messages_count integer DEFAULT 0,
  user_id uuid,
  country text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_bot_started 
  ON bot_sessions (bot_id, started_at DESC);

-- ============================================
-- 3. Daily Aggregated Stats
-- ============================================
CREATE TABLE IF NOT EXISTS bot_daily_stats (
  id serial PRIMARY KEY,
  bot_id uuid NOT NULL,
  day date NOT NULL,
  sessions integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  messages integer DEFAULT 0,
  user_messages integer DEFAULT 0,
  bot_messages integer DEFAULT 0,
  succeeded_count integer DEFAULT 0, -- bot successfully answered
  fallback_count integer DEFAULT 0, -- bot replied "I don't know"
  fallback_rate numeric DEFAULT 0,
  avg_response_time_ms numeric,
  avg_messages_per_session numeric,
  error_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (bot_id, day)
);

CREATE INDEX IF NOT EXISTS idx_daily_bot_day 
  ON bot_daily_stats (bot_id, day DESC);

-- ============================================
-- 4. Top Queries Stats (daily aggregates)
-- ============================================
CREATE TABLE IF NOT EXISTS bot_queries_stats (
  id serial PRIMARY KEY,
  bot_id uuid NOT NULL,
  day date NOT NULL,
  query_hash text NOT NULL, -- SHA256 of normalized query
  query_sample text, -- first occurrence (redacted, truncated to 500 chars)
  request_count integer DEFAULT 0,
  fallback_count integer DEFAULT 0, -- how many times this query led to fallback
  fallback_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (bot_id, day, query_hash)
);

CREATE INDEX IF NOT EXISTS idx_queries_bot_day 
  ON bot_queries_stats (bot_id, day DESC, request_count DESC);

-- ============================================
-- 5. Country Stats (daily aggregates)
-- ============================================
CREATE TABLE IF NOT EXISTS bot_country_stats (
  id serial PRIMARY KEY,
  bot_id uuid NOT NULL,
  day date NOT NULL,
  country text NOT NULL,
  sessions integer DEFAULT 0,
  messages integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (bot_id, day, country)
);

CREATE INDEX IF NOT EXISTS idx_country_bot_day 
  ON bot_country_stats (bot_id, day DESC, sessions DESC);

-- ============================================
-- Helper function to compute daily stats
-- ============================================
CREATE OR REPLACE FUNCTION compute_bot_daily_stats(
  target_bot_id uuid,
  target_day date
) RETURNS void AS $$
BEGIN
  -- Upsert into bot_daily_stats
  INSERT INTO bot_daily_stats (
    bot_id,
    day,
    sessions,
    unique_users,
    messages,
    user_messages,
    bot_messages,
    succeeded_count,
    fallback_count,
    fallback_rate,
    avg_response_time_ms,
    avg_messages_per_session,
    error_count,
    updated_at
  )
  SELECT
    target_bot_id,
    target_day,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
    COUNT(*) FILTER (WHERE event_type IN ('user_message','bot_message')) as messages,
    COUNT(*) FILTER (WHERE event_type = 'user_message') as user_messages,
    COUNT(*) FILTER (WHERE event_type = 'bot_message') as bot_messages,
    COUNT(*) FILTER (WHERE event_type = 'bot_message' AND (metadata->>'is_fallback')::boolean IS NOT TRUE) as succeeded_count,
    COUNT(*) FILTER (WHERE event_type = 'fallback') as fallback_count,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'user_message') = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE event_type = 'fallback')::numeric / NULLIF(COUNT(*) FILTER (WHERE event_type = 'user_message'), 0)) * 100, 2)
    END as fallback_rate,
    ROUND(AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL), 2) as avg_response_time_ms,
    CASE 
      WHEN COUNT(DISTINCT session_id) = 0 THEN 0
      ELSE ROUND(COUNT(*) FILTER (WHERE event_type IN ('user_message','bot_message'))::numeric / NULLIF(COUNT(DISTINCT session_id), 0), 2)
    END as avg_messages_per_session,
    COUNT(*) FILTER (WHERE event_type = 'error') as error_count,
    now()
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND created_at >= target_day
    AND created_at < target_day + interval '1 day'
  ON CONFLICT (bot_id, day) 
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    unique_users = EXCLUDED.unique_users,
    messages = EXCLUDED.messages,
    user_messages = EXCLUDED.user_messages,
    bot_messages = EXCLUDED.bot_messages,
    succeeded_count = EXCLUDED.succeeded_count,
    fallback_count = EXCLUDED.fallback_count,
    fallback_rate = EXCLUDED.fallback_rate,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    avg_messages_per_session = EXCLUDED.avg_messages_per_session,
    error_count = EXCLUDED.error_count,
    updated_at = now();

  -- Compute query stats
  INSERT INTO bot_queries_stats (
    bot_id,
    day,
    query_hash,
    query_sample,
    request_count,
    fallback_count,
    fallback_rate,
    updated_at
  )
  SELECT
    target_bot_id,
    target_day,
    encode(digest(lower(trim(message_text)), 'sha256'), 'hex') as query_hash,
    LEFT(message_text, 500) as query_sample,
    COUNT(*) as request_count,
    COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM bot_analytics_events fallback_event
        WHERE fallback_event.bot_id = target_bot_id
          AND fallback_event.session_id = bot_analytics_events.session_id
          AND fallback_event.event_type = 'fallback'
          AND fallback_event.created_at >= bot_analytics_events.created_at
          AND fallback_event.created_at <= bot_analytics_events.created_at + interval '10 seconds'
        LIMIT 1
      )
    ) as fallback_count,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM bot_analytics_events fallback_event
          WHERE fallback_event.bot_id = target_bot_id
            AND fallback_event.session_id = bot_analytics_events.session_id
            AND fallback_event.event_type = 'fallback'
            AND fallback_event.created_at >= bot_analytics_events.created_at
            AND fallback_event.created_at <= bot_analytics_events.created_at + interval '10 seconds'
          LIMIT 1
        )
      )::numeric / NULLIF(COUNT(*), 0)) * 100, 2)
    END as fallback_rate
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND event_type = 'user_message'
    AND message_text IS NOT NULL
    AND message_text != ''
    AND created_at >= target_day
    AND created_at < target_day + interval '1 day'
  GROUP BY encode(digest(lower(trim(message_text)), 'sha256'), 'hex'), LEFT(message_text, 500)
  ON CONFLICT (bot_id, day, query_hash)
  DO UPDATE SET
    request_count = EXCLUDED.request_count,
    fallback_count = EXCLUDED.fallback_count,
    fallback_rate = EXCLUDED.fallback_rate,
    updated_at = now();

  -- Compute country stats
  INSERT INTO bot_country_stats (
    bot_id,
    day,
    country,
    sessions,
    messages
  )
  SELECT
    target_bot_id,
    target_day,
    COALESCE(country, 'Unknown') as country,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) as messages
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND created_at >= target_day
    AND created_at < target_day + interval '1 day'
  GROUP BY COALESCE(country, 'Unknown')
  ON CONFLICT (bot_id, day, country)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    messages = EXCLUDED.messages;

END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Retention cleanup function
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_analytics(retention_days integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  -- Delete raw events older than retention period
  DELETE FROM bot_analytics_events
  WHERE created_at < now() - (retention_days || ' days')::interval;
  
  -- Keep aggregates longer (365 days)
  DELETE FROM bot_daily_stats
  WHERE day < current_date - 365;
  
  DELETE FROM bot_queries_stats
  WHERE day < current_date - 365;
  
  DELETE FROM bot_country_stats
  WHERE day < current_date - 365;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on tables
ALTER TABLE bot_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_queries_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_country_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API routes)
CREATE POLICY "Service role can manage analytics events"
  ON bot_analytics_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage sessions"
  ON bot_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage daily stats"
  ON bot_daily_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage query stats"
  ON bot_queries_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage country stats"
  ON bot_country_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: Additional policies can be added to allow bot owners to read their own analytics
-- This requires joining with the bots table to check ownership

-- ============================================
-- Sample data for testing (optional - remove in production)
-- ============================================
-- Uncomment to insert sample data for testing

/*
DO $$
DECLARE
  test_bot_id uuid := '09cb10c4-5093-42f8-9697-d3947969eb27';
  test_session_id uuid := gen_random_uuid();
BEGIN
  -- Insert sample events for last 7 days
  FOR i IN 0..6 LOOP
    FOR j IN 1..10 LOOP
      INSERT INTO bot_analytics_events (
        bot_id, session_id, event_type, message_text, 
        channel, country, created_at
      ) VALUES (
        test_bot_id,
        gen_random_uuid(),
        CASE WHEN j % 5 = 0 THEN 'fallback' ELSE 'user_message' END,
        'Sample query ' || j,
        'embed',
        CASE WHEN j % 3 = 0 THEN 'US' WHEN j % 3 = 1 THEN 'IN' ELSE 'UK' END,
        (current_date - i) + (j || ' hours')::interval
      );
    END LOOP;
  END LOOP;
  
  -- Compute stats for the test data
  FOR i IN 0..6 LOOP
    PERFORM compute_bot_daily_stats(test_bot_id, current_date - i);
  END LOOP;
END $$;
*/
