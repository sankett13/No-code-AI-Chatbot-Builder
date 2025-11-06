-- Test Analytics Aggregation
-- Run this in Supabase SQL Editor to diagnose issues

-- Step 1: Check if raw events exist
SELECT 
  'Raw Events Check' as test_name,
  COUNT(*) as total_events,
  COUNT(DISTINCT bot_id) as unique_bots,
  COUNT(DISTINCT session_id) as unique_sessions,
  MIN(created_at) as earliest_event,
  MAX(created_at) as latest_event
FROM bot_analytics_events;

-- Step 2: Check if the function exists
SELECT 
  'Function Exists' as test_name,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'compute_bot_daily_stats';

-- Step 3: Get bot IDs to test with
SELECT 
  'Active Bot IDs' as test_name,
  bot_id,
  COUNT(*) as event_count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM bot_analytics_events
GROUP BY bot_id;

-- Step 4: Check current state of aggregate tables
SELECT 'Daily Stats Count' as test_name, COUNT(*) as count FROM bot_daily_stats
UNION ALL
SELECT 'Query Stats Count', COUNT(*) FROM bot_queries_stats
UNION ALL
SELECT 'Country Stats Count', COUNT(*) FROM bot_country_stats;

-- Step 5: Test the function manually
-- Replace 'YOUR_BOT_ID_HERE' with an actual bot_id from Step 3 above
-- Uncomment the line below and run it:

-- SELECT compute_bot_daily_stats('YOUR_BOT_ID_HERE'::uuid, current_date);

-- Step 6: After running the function, check if data was created
SELECT 'Results After Function' as test_name, * 
FROM bot_daily_stats 
WHERE day = current_date 
ORDER BY bot_id 
LIMIT 5;
