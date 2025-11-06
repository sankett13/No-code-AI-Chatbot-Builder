# Analytics Setup Guide

This guide explains how to set up and use the bot analytics system for tracking bot performance, user interactions, and generating insights.

## Overview

The analytics system tracks:

- **Daily requests**: Total messages per day
- **Success vs Fallback**: How many queries were successfully answered vs "I don't know" responses
- **User origin**: Geographic distribution via IP lookup
- **Top queries**: Most frequently asked questions
- **Response times**: Average bot response latency
- **Session metrics**: Sessions, messages per session, unique users

## Database Setup

### 1. Run the Migration

Execute the SQL migration file in your Supabase SQL Editor:

```bash
# Location: db/analytics.sql
```

Open Supabase Dashboard → SQL Editor → New Query, then paste the entire contents of `db/analytics.sql` and run it.

This creates:

- `bot_analytics_events` - Raw event log
- `bot_sessions` - Session tracking
- `bot_daily_stats` - Daily aggregated metrics
- `bot_queries_stats` - Top queries per day
- `bot_country_stats` - Geographic distribution
- Helper functions for aggregation and cleanup

### 2. Verify Tables

Check that all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'bot_%';
```

You should see:

- bot_analytics_events
- bot_sessions
- bot_daily_stats
- bot_queries_stats
- bot_country_stats

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Analytics
IP_HASH_SALT=your-random-salt-for-hashing-ips-change-this
CRON_SECRET=your-secret-for-cron-jobs-change-this

# Optional: for production geo lookup
# MAXMIND_LICENSE_KEY=your_maxmind_key
```

**Important Security Notes:**

- Change `IP_HASH_SALT` to a long random string (used to hash IPs for privacy)
- Change `CRON_SECRET` to a secure random string (protects aggregation endpoint)
- Never commit these values to git

## Analytics Ingestion

Analytics events are automatically tracked when users interact with your bot:

### Events Tracked

1. **session_start** - When a user opens the chat widget
2. **session_end** - When the user closes the widget or leaves
3. **user_message** - Every message the user sends
4. **bot_message** - Every response from the bot
5. **fallback** - When the bot doesn't know the answer
6. **error** - When an error occurs

### API Endpoint

The ingestion endpoint is: `POST /api/analytics/event`

It's automatically called by the chat widget - no manual integration needed!

## Daily Aggregation

Analytics data is aggregated daily for performance and to compute summary statistics.

### Manual Aggregation

You can manually trigger aggregation for testing:

```bash
# Aggregate last 7 days for all bots
curl -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'

# Aggregate specific bot
curl -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "your-bot-id", "days": 7}'
```

### Automated Aggregation (Production)

Set up a cron job or scheduled task to run daily aggregation:

#### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:

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

#### Option 2: External Cron Service

Use a service like cron-job.org or GitHub Actions to hit your endpoint daily:

```bash
# Daily at 1 AM UTC
0 1 * * * curl -X POST "https://yourapp.com/api/analytics/aggregate" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

#### Option 3: Supabase Edge Function

Create a Supabase edge function scheduled via pg_cron.

## Viewing Analytics

### Dashboard Access

Navigate to your dashboard and select a bot to view its analytics:

```
https://yourapp.com/dashboard/manage-bots
```

Click on any bot to see its analytics dashboard.

### API Access

Fetch analytics programmatically:

```bash
# Get summary for a bot (last 30 days)
curl "http://localhost:3000/api/analytics/bots/{botId}/summary?range=30d"

# Range options: 7d, 30d, 90d
```

Response includes:

- Summary metrics (total sessions, messages, success/fallback rates)
- Daily stats time series
- Top queries
- Country distribution

## Testing Analytics

### 1. Generate Test Data

The migration includes commented-out sample data. Uncomment and run the section at the bottom of `db/analytics.sql`:

```sql
-- Uncomment the DO $$ block to insert sample data
```

### 2. Send Test Events

```bash
# Session start
curl -X POST "http://localhost:3000/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "session_start",
    "bot_id": "your-bot-id",
    "session_id": "test-session-123",
    "channel": "embed"
  }'

# User message
curl -X POST "http://localhost:3000/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_message",
    "bot_id": "your-bot-id",
    "session_id": "test-session-123",
    "message_text": "What are your hours?",
    "channel": "embed"
  }'

# Bot message (success)
curl -X POST "http://localhost:3000/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "bot_message",
    "bot_id": "your-bot-id",
    "session_id": "test-session-123",
    "message_text": "We are open 9am-5pm",
    "response_time_ms": 250,
    "channel": "embed"
  }'

# Fallback
curl -X POST "http://localhost:3000/api/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "fallback",
    "bot_id": "your-bot-id",
    "session_id": "test-session-123",
    "message_text": "What is the meaning of life?",
    "channel": "embed"
  }'
```

### 3. Run Aggregation

```bash
curl -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "your-bot-id", "days": 1}'
```

### 4. View in Dashboard

Visit dashboard and verify the analytics display correctly.

## Privacy & Compliance

### Data Collected

- **PII Protection**: Email addresses, phone numbers, and credit cards are automatically redacted
- **IP Hashing**: Raw IPs are never stored; only SHA-256 hashes
- **Country Only**: Geographic data is limited to country codes
- **Message Text**: Truncated to 2000 chars and sanitized

### Retention Policy

Default retention:

- **Raw events**: 90 days
- **Aggregated stats**: 365 days

Run cleanup manually:

```sql
SELECT cleanup_old_analytics(90); -- Remove events older than 90 days
```

### GDPR/Data Deletion

To delete all analytics for a bot:

```sql
DELETE FROM bot_analytics_events WHERE bot_id = 'bot-id-to-delete';
DELETE FROM bot_sessions WHERE bot_id = 'bot-id-to-delete';
DELETE FROM bot_daily_stats WHERE bot_id = 'bot-id-to-delete';
DELETE FROM bot_queries_stats WHERE bot_id = 'bot-id-to-delete';
DELETE FROM bot_country_stats WHERE bot_id = 'bot-id-to-delete';
```

## Performance & Scaling

### Rate Limiting

The ingestion endpoint is rate-limited to 200 requests/minute per IP. Adjust in:

```typescript
// src/app/api/analytics/event/route.ts
const RATE_LIMIT = 200; // Adjust as needed
```

### Indexing

All necessary indexes are created by the migration. If you have millions of events, consider:

1. **Partitioning**: Partition `bot_analytics_events` by month
2. **Sampling**: Only store 1 in N events for high-volume bots
3. **Archiving**: Move old events to cold storage

### Database Size

Estimated storage per bot (30 days):

- 1000 sessions/day: ~5-10 MB raw + 50 KB aggregated
- 10,000 sessions/day: ~50-100 MB raw + 500 KB aggregated

## Troubleshooting

### No Data Appearing

1. **Check ingestion endpoint**:

   ```bash
   curl http://localhost:3000/api/analytics/event
   # Should return: {"status":"ok","service":"analytics-event-ingestion"}
   ```

2. **Check raw events**:

   ```sql
   SELECT COUNT(*) FROM bot_analytics_events;
   SELECT * FROM bot_analytics_events LIMIT 10;
   ```

3. **Check aggregation**:
   ```sql
   SELECT * FROM bot_daily_stats ORDER BY day DESC LIMIT 10;
   ```

### Aggregation Failing

Check function exists:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'compute_bot_daily_stats';
```

Test function:

```sql
SELECT compute_bot_daily_stats('your-bot-id', current_date);
```

### Dashboard Not Loading

1. Check API endpoint:

   ```bash
   curl "http://localhost:3000/api/analytics/bots/YOUR_BOT_ID/summary?range=7d"
   ```

2. Check browser console for errors

3. Verify bot_id is correct

## Advanced Features

### Custom Metrics

Add custom tracking by modifying `src/lib/analytics.ts`:

```typescript
export function trackCustomEvent(
  botId: string,
  eventType: string,
  metadata: Record<string, any>
) {
  trackEvent({
    event_type: eventType as any,
    bot_id: botId,
    session_id: getOrCreateSessionId(),
    metadata,
  });
}
```

### Export Data

Export analytics to CSV:

```sql
COPY (
  SELECT * FROM bot_daily_stats
  WHERE bot_id = 'your-bot-id'
  ORDER BY day DESC
) TO '/tmp/analytics.csv' CSV HEADER;
```

### Real-time Analytics

For real-time dashboards, query `bot_analytics_events` directly instead of using aggregated tables.

## Support

For issues or questions:

1. Check Supabase logs
2. Check browser console
3. Review API endpoint responses
4. Check database table contents

## Next Steps

- Set up automated daily aggregation
- Configure geo lookup service (optional)
- Customize dashboard charts
- Add more detailed tracking
- Set up alerting for anomalies
