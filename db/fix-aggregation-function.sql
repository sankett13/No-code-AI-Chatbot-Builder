-- EMERGENCY FIX: Create working aggregation function
-- Run this entire script in Supabase SQL Editor

-- Drop existing function if it has issues
DROP FUNCTION IF EXISTS compute_bot_daily_stats(uuid, date);

-- Create a working version
CREATE OR REPLACE FUNCTION compute_bot_daily_stats(
  target_bot_id uuid,
  target_day date
) RETURNS void AS $$
DECLARE
  events_count INTEGER;
BEGIN
  -- Check if there are events for this bot and day
  SELECT COUNT(*) INTO events_count
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND DATE(created_at) = target_day;
  
  RAISE NOTICE 'Found % events for bot % on %', events_count, target_bot_id, target_day;
  
  IF events_count = 0 THEN
    RAISE NOTICE 'No events found, skipping';
    RETURN;
  END IF;

  -- 1. Compute and insert daily stats
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
    error_count
  )
  SELECT
    target_bot_id,
    target_day,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
    COUNT(*) FILTER (WHERE event_type IN ('user_message','bot_message')) as messages,
    COUNT(*) FILTER (WHERE event_type = 'user_message') as user_messages,
    COUNT(*) FILTER (WHERE event_type = 'bot_message') as bot_messages,
    COUNT(*) FILTER (WHERE event_type = 'bot_message' AND COALESCE((metadata->>'is_fallback')::boolean, false) = false) as succeeded_count,
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
    COUNT(*) FILTER (WHERE event_type = 'error') as error_count
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND DATE(created_at) = target_day
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

  RAISE NOTICE 'Daily stats created/updated';

  -- 2. Compute and insert country stats
  INSERT INTO bot_country_stats (bot_id, day, country, sessions, messages)
  SELECT
    target_bot_id,
    target_day,
    COALESCE(NULLIF(country, ''), 'Unknown') as country,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) as messages
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND DATE(created_at) = target_day
  GROUP BY COALESCE(NULLIF(country, ''), 'Unknown')
  ON CONFLICT (bot_id, day, country)
  DO UPDATE SET
    sessions = EXCLUDED.sessions,
    messages = EXCLUDED.messages;

  RAISE NOTICE 'Country stats created/updated';

  -- 3. Compute and insert query stats
  INSERT INTO bot_queries_stats (
    bot_id, 
    day, 
    query_hash, 
    query_sample, 
    request_count,
    fallback_count,
    fallback_rate
  )
  SELECT
    target_bot_id,
    target_day,
    encode(digest(COALESCE(LOWER(TRIM(message_text)), 'empty'), 'sha256'), 'hex') as query_hash,
    LEFT(COALESCE(message_text, 'empty'), 500) as query_sample,
    COUNT(*) as request_count,
    SUM(CASE 
      WHEN EXISTS (
        SELECT 1 FROM bot_analytics_events fallback_event
        WHERE fallback_event.bot_id = target_bot_id
          AND fallback_event.session_id = bot_analytics_events.session_id
          AND fallback_event.event_type = 'fallback'
          AND fallback_event.created_at >= bot_analytics_events.created_at
          AND fallback_event.created_at <= bot_analytics_events.created_at + interval '10 seconds'
        LIMIT 1
      ) THEN 1 
      ELSE 0 
    END) as fallback_count,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((SUM(CASE 
        WHEN EXISTS (
          SELECT 1 FROM bot_analytics_events fallback_event
          WHERE fallback_event.bot_id = target_bot_id
            AND fallback_event.session_id = bot_analytics_events.session_id
            AND fallback_event.event_type = 'fallback'
            AND fallback_event.created_at >= bot_analytics_events.created_at
            AND fallback_event.created_at <= bot_analytics_events.created_at + interval '10 seconds'
          LIMIT 1
        ) THEN 1 
        ELSE 0 
      END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2)
    END as fallback_rate
  FROM bot_analytics_events
  WHERE bot_id = target_bot_id
    AND DATE(created_at) = target_day
    AND event_type = 'user_message'
    AND message_text IS NOT NULL
    AND message_text != ''
  GROUP BY encode(digest(COALESCE(LOWER(TRIM(message_text)), 'empty'), 'sha256'), 'hex'), LEFT(COALESCE(message_text, 'empty'), 500)
  ON CONFLICT (bot_id, day, query_hash)
  DO UPDATE SET
    request_count = EXCLUDED.request_count,
    fallback_count = EXCLUDED.fallback_count,
    fallback_rate = EXCLUDED.fallback_rate,
    updated_at = now();

  RAISE NOTICE 'Query stats created/updated';
  RAISE NOTICE 'Aggregation complete for bot % on %', target_bot_id, target_day;
  
END;
$$ LANGUAGE plpgsql;

-- Test the function immediately
-- Get a bot_id that has events
DO $$
DECLARE
  test_bot_id uuid;
  test_day date;
BEGIN
  -- Get the first bot with events
  SELECT DISTINCT bot_id INTO test_bot_id
  FROM bot_analytics_events
  LIMIT 1;
  
  IF test_bot_id IS NULL THEN
    RAISE NOTICE 'No events found in bot_analytics_events table';
    RETURN;
  END IF;
  
  -- Get the most recent day with events for that bot
  SELECT DATE(created_at) INTO test_day
  FROM bot_analytics_events
  WHERE bot_id = test_bot_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RAISE NOTICE 'Testing function with bot_id: % and day: %', test_bot_id, test_day;
  
  -- Run the function
  PERFORM compute_bot_daily_stats(test_bot_id, test_day);
  
  RAISE NOTICE 'Test complete! Check the results below.';
END $$;

-- Verify the results
SELECT 'After running function:' as status;

SELECT 'Daily Stats' as table_name, COUNT(*) as rows 
FROM bot_daily_stats
UNION ALL
SELECT 'Country Stats', COUNT(*) 
FROM bot_country_stats
UNION ALL
SELECT 'Query Stats', COUNT(*) 
FROM bot_queries_stats;

-- Show the actual data
SELECT 'Daily Stats Detail:' as info;
SELECT * FROM bot_daily_stats ORDER BY day DESC LIMIT 5;

SELECT 'Country Stats Detail:' as info;
SELECT * FROM bot_country_stats ORDER BY day DESC LIMIT 5;

SELECT 'Query Stats Detail:' as info;
SELECT * FROM bot_queries_stats ORDER BY day DESC LIMIT 5;
