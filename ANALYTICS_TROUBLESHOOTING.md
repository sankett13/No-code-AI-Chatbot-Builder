# Analytics Troubleshooting Guide

## Issue: Events are logged but daily stats, country stats, and query stats are empty

### What's Happening

You have:

- ✅ Raw events in `bot_analytics_events` table
- ✅ Sessions in `bot_sessions` table
- ❌ Empty `bot_daily_stats` table
- ❌ Empty `bot_country_stats` table
- ❌ Empty `bot_queries_stats` table

**Cause**: The aggregation job needs to be run to compute statistics from raw events.

### Solution Steps

#### Step 1: Verify Function Exists

Run this in Supabase SQL Editor:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'compute_bot_daily_stats';
```

**Expected result**: Should return 1 row with `compute_bot_daily_stats`

**If empty**: Re-run the migration from `db/analytics.sql`

---

#### Step 2: Check Raw Events

```sql
SELECT
  bot_id,
  COUNT(*) as event_count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM bot_analytics_events
GROUP BY bot_id;
```

**What to look for**:

- You should see your bot_id(s)
- event_count > 0
- Dates should be recent

---

#### Step 3: Run Aggregation Manually

**Option A: Using the script (recommended)**

```bash
# In your project directory
./run-aggregation.sh
```

**Option B: Using curl**

```bash
cd "/Users/sanketpatel/Desktop/AI ChatBot Builder/ai-chatbot-builder"

# Get your CRON_SECRET
CRON_SECRET=$(grep "CRON_SECRET=" .env.local | cut -d'=' -f2)

# Run aggregation
curl -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

**Expected response**:

```json
{
  "success": true,
  "processed": 1,
  "results": [
    {"bot_id": "...", "day": "2025-11-06", "status": "success"},
    ...
  ],
  "message": "Computed stats for 1 bot(s) over 7 day(s)"
}
```

---

#### Step 4: Test Function Directly in Database

If the API aggregation doesn't work, test the function directly in Supabase:

```sql
-- Get your bot_id
SELECT DISTINCT bot_id FROM bot_analytics_events LIMIT 1;

-- Test the function (replace with your actual bot_id)
SELECT compute_bot_daily_stats(
  '09cb10c4-5093-42f8-9697-d3947969eb27'::uuid,
  current_date
);

-- Check if data was created
SELECT * FROM bot_daily_stats WHERE day = current_date;
SELECT * FROM bot_queries_stats WHERE day = current_date;
SELECT * FROM bot_country_stats WHERE day = current_date;
```

---

#### Step 5: Verify Results

After running aggregation, check the tables:

```sql
-- Should now have data
SELECT * FROM bot_daily_stats ORDER BY day DESC LIMIT 5;
SELECT * FROM bot_queries_stats ORDER BY day DESC LIMIT 10;
SELECT * FROM bot_country_stats ORDER BY day DESC LIMIT 10;
```

---

### Common Issues & Fixes

#### Issue 1: Function returns but no data created

**Cause**: Events might be from a different day than what you're aggregating

**Fix**: Check event dates and adjust aggregation days:

```sql
-- See which days have events
SELECT DATE(created_at) as day, COUNT(*)
FROM bot_analytics_events
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

Then aggregate those specific days:

```bash
# Aggregate last 30 days instead of 7
curl -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

---

#### Issue 2: CRON_SECRET error (401 Unauthorized)

**Fix**: Verify your secret is correct:

```bash
grep "CRON_SECRET=" .env.local
```

Make sure there are no quotes around the value in `.env.local`:

```bash
# ✅ Correct
CRON_SECRET=your-secret-here

# ❌ Wrong
CRON_SECRET="your-secret-here"
```

---

#### Issue 3: Server not running

**Symptoms**: `curl: (7) Failed to connect`

**Fix**: Start your dev server:

```bash
npm run dev
```

Then run aggregation again.

---

#### Issue 4: Function doesn't exist

**Symptoms**: `function compute_bot_daily_stats does not exist`

**Fix**: Re-run the migration:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open `db/analytics.sql`
4. Copy entire contents
5. Paste and Run in SQL Editor

---

### Quick Debug Script

Run this to get a full diagnostic:

```sql
-- DIAGNOSTIC REPORT
\echo '=== 1. Check if functions exist ==='
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%bot%daily%';

\echo '=== 2. Count raw events ==='
SELECT COUNT(*) as total_events FROM bot_analytics_events;

\echo '=== 3. Events by bot ==='
SELECT bot_id, COUNT(*) as events,
       MIN(created_at) as first,
       MAX(created_at) as last
FROM bot_analytics_events
GROUP BY bot_id;

\echo '=== 4. Count aggregated stats ==='
SELECT
  (SELECT COUNT(*) FROM bot_daily_stats) as daily_stats,
  (SELECT COUNT(*) FROM bot_queries_stats) as query_stats,
  (SELECT COUNT(*) FROM bot_country_stats) as country_stats;

\echo '=== 5. Latest aggregated data ==='
SELECT 'daily' as type, day::text, bot_id::text, sessions
FROM bot_daily_stats ORDER BY day DESC LIMIT 3
UNION ALL
SELECT 'queries', day::text, bot_id::text, request_count::text
FROM bot_queries_stats ORDER BY day DESC LIMIT 3
UNION ALL
SELECT 'country', day::text, bot_id::text, country
FROM bot_country_stats ORDER BY day DESC LIMIT 3;
```

---

### Manual Aggregation (if API fails)

If the API endpoint doesn't work, run aggregation directly in Supabase:

```sql
DO $$
DECLARE
  bot_record RECORD;
  day_offset INTEGER;
BEGIN
  -- Get all bots with recent events
  FOR bot_record IN
    SELECT DISTINCT bot_id
    FROM bot_analytics_events
    WHERE created_at >= current_date - interval '7 days'
  LOOP
    -- Aggregate each of the last 7 days
    FOR day_offset IN 0..6 LOOP
      PERFORM compute_bot_daily_stats(
        bot_record.bot_id,
        current_date - day_offset
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Aggregation complete!';
END $$;
```

---

### After Fixing

Once data appears:

1. ✅ Refresh your dashboard at http://localhost:3000/dashboard
2. ✅ Click 📊 on any bot in /dashboard/manage-bots
3. ✅ You should now see all charts and metrics populated!

### Automate for Production

Once working, set up daily aggregation:

**Vercel Cron** (recommended):

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/analytics/aggregate",
      "schedule": "0 1 * * *"
    }
  ]
}
```

**Or use external cron service** to hit:

```
POST https://yourapp.com/api/analytics/aggregate
Authorization: Bearer YOUR_CRON_SECRET
Body: {"days": 7}
```

---

### Still Having Issues?

1. Check Supabase logs for errors
2. Check browser console on dashboard page
3. Verify all environment variables are set
4. Ensure dev server is running on port 3000
5. Try the manual SQL aggregation approach above

### Need More Help?

- Check raw events: `SELECT * FROM bot_analytics_events ORDER BY created_at DESC LIMIT 10;`
- Check function definition: `\df compute_bot_daily_stats` in psql
- Review migration file: `db/analytics.sql`
- Check API logs in your terminal running `npm run dev`
