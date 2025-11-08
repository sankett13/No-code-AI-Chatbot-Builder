-- Add this to your Supabase SQL Editor to create a scheduled function
-- This runs the aggregation directly in the database

CREATE OR REPLACE FUNCTION schedule_daily_aggregation()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    bot_record RECORD;
    target_date date;
BEGIN
    -- Get yesterday's date
    target_date := CURRENT_DATE - INTERVAL '1 day';
    
    -- Get all active bots
    FOR bot_record IN 
        SELECT DISTINCT bot_id 
        FROM bot_analytics_events 
        WHERE created_at >= target_date - INTERVAL '7 days'
    LOOP
        -- Compute stats for each bot
        PERFORM compute_bot_daily_stats(bot_record.bot_id, target_date::text);
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Daily aggregation completed for %', target_date;
END;
$$;

-- Create a scheduled job (requires pg_cron extension)
-- Note: This requires database-level cron setup
-- SELECT cron.schedule('daily-analytics', '0 2 * * *', 'SELECT schedule_daily_aggregation();');