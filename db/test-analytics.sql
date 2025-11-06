-- Quick SQL test to check analytics data

-- 1. Check raw events
SELECT 
  bot_id,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as sessions,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM bot_analytics_events
GROUP BY bot_id;

-- 2. Check if function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'compute_bot_daily_stats';

-- 3. Check daily stats (should be empty if aggregation hasn't run successfully)
SELECT * FROM bot_daily_stats ORDER BY day DESC LIMIT 10;

-- 4. Check query stats
SELECT * FROM bot_queries_stats ORDER BY day DESC LIMIT 10;

-- 5. Check country stats
SELECT * FROM bot_country_stats ORDER BY day DESC LIMIT 10;

-- 6. Test function manually (replace bot_id and date as needed)
-- Get your actual bot_id first
SELECT DISTINCT bot_id FROM bot_analytics_events LIMIT 1;

-- Then run (uncomment and replace the bot_id):
-- SELECT compute_bot_daily_stats(
--   'your-bot-id-here'::uuid, 
--   current_date
-- );
