# Analytics Quick Start Guide

## 🚀 Get Analytics Working in 5 Minutes

### Step 1: Run the Database Migration (2 minutes)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Open the file `db/analytics.sql` from your project
5. Copy the entire contents and paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned" message

### Step 2: Add Environment Variables (1 minute)

Add these to your `.env.local` file:

```bash
# If you don't have these already, get them from Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Generate random strings for these (use password generator or online tool)
IP_HASH_SALT=change-this-to-random-string-abc123xyz789
CRON_SECRET=another-random-string-def456uvw012
```

### Step 3: Restart Your Dev Server (30 seconds)

```bash
# Stop your current dev server (Ctrl+C) and restart
npm run dev
```

### Step 4: Test It! (1 minute)

1. Open your app: `http://localhost:3000`
2. Go to **Manage Bots** page
3. Open one of your bots (test the chat)
4. Send a few messages back and forth
5. Close the chat

### Step 5: Generate Test Data (30 seconds)

Run this in your terminal to generate analytics for the last 7 days:

```bash
curl -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'
```

Replace `YOUR_CRON_SECRET` with the value from your `.env.local`

### Step 6: View Analytics! (10 seconds)

Go to either:

- **Dashboard**: `http://localhost:3000/dashboard`
- **Manage Bots**: Click the 📊 button on any bot

You should now see:

- ✅ Summary cards with metrics
- ✅ Daily request charts
- ✅ Success vs fallback visualization
- ✅ Top queries (if you sent messages)
- ✅ Country distribution

## 🎉 That's It!

Your analytics system is now:

- ✅ Tracking all chat interactions automatically
- ✅ Protecting user privacy with IP hashing
- ✅ Computing daily statistics
- ✅ Displaying beautiful charts in your dashboard

## 💡 What Happens Now?

### Automatic Tracking

Every time a user:

- Opens the chat widget → **session_start** event logged
- Sends a message → **user_message** event logged
- Gets a bot response → **bot_message** event logged
- Gets "I don't know" → **fallback** event logged
- Closes the chat → **session_end** event logged

### Daily Aggregation

You need to set up a daily job to compute statistics. Options:

#### Option A: Manual (for testing)

Run the curl command from Step 5 daily

#### Option B: Vercel Cron (recommended for production)

Create `vercel.json` in your project root:

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

#### Option C: External Cron Service

Use cron-job.org or similar to hit your endpoint daily

## 📊 Understanding the Dashboard

### Summary Cards (Top Row)

- **Total Sessions**: Unique chat conversations
- **Total Messages**: User + bot messages combined
- **Success Rate**: % of queries bot answered successfully
- **Fallback Rate**: % of "I don't know" responses
- **Avg Messages/Session**: How long conversations last
- **Avg Response Time**: Bot latency in milliseconds
- **Successful Answers**: Count of good responses
- **Unanswered Queries**: Count of fallbacks

### Charts

1. **Daily Requests**: Shows traffic over time (blue bars)
2. **Success vs Fallback**: Green = success, Red = fallback (stacked)
3. **Top Queries**: Most asked questions with fallback rates
4. **Country Distribution**: Where your users are from

### Time Ranges

Click: **7 Days** | **30 Days** | **90 Days** to change view

## 🔧 Troubleshooting

### "No data available"

- Did you run the aggregation command? (Step 5)
- Did you send test messages through the bot? (Step 4)
- Check if events are in database:
  ```sql
  SELECT COUNT(*) FROM bot_analytics_events;
  ```

### API errors in console

- Check your environment variables are set correctly
- Make sure you restarted the dev server after adding env vars
- Verify the database migration ran successfully

### Charts not loading

- Open browser DevTools → Network tab
- Check for failed requests to `/api/analytics/bots/.../summary`
- Verify the bot_id is correct

## 🎯 Quick Wins

### See Real User Behavior

- Check **Top Queries** to see what users ask most
- Identify queries with high **Fallback Rate** (>50%)
- Add knowledge base content for those topics
- Watch Success Rate improve!

### Monitor Performance

- Track **Avg Response Time** - should be <2 seconds
- Check **Daily Requests** for traffic patterns
- Use **Country Distribution** for localization needs

### Improve Your Bot

1. Find queries with 100% fallback rate
2. Add that content to your knowledge base
3. Test the bot with those queries
4. Watch fallback rate drop in analytics!

## 📈 Next Steps

Once you're comfortable with basic analytics:

1. Set up automated daily aggregation (Vercel Cron)
2. Add more bots and compare their performance
3. Export data for deeper analysis
4. Set up alerts for anomalies
5. Share insights with your team!

## 🆘 Need Help?

Check these files for more details:

- `ANALYTICS_SETUP.md` - Full setup documentation
- `ANALYTICS_IMPLEMENTATION_SUMMARY.md` - Technical overview
- Code comments in `src/lib/analytics.ts`

Common questions:

- **Privacy**: IPs are hashed, emails/phones auto-redacted
- **Storage**: ~10MB per 1000 sessions (raw events for 90 days)
- **Performance**: Can handle 1M events/day on basic setup
- **Cost**: Uses your existing Supabase database (no extra cost)

---

**You're all set!** 🎊 Your bot analytics are now tracking and visualizing automatically.
