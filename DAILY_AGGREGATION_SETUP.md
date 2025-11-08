# Daily Analytics Aggregation Setup Guide

Your analytics aggregation can now run automatically every day using several methods:

## 🎯 Quick Start

### For Vercel Deployment (Recommended)

1. **Deploy to Vercel**: Your `vercel.json` is already configured
2. **Set Environment Variable**: Ensure `CRON_SECRET` is set in Vercel dashboard
3. **Done!** The aggregation will run daily at 2 AM UTC

### For Other Platforms

Choose one of the following options:

## 📋 Setup Options

### Option 1: Vercel Cron Jobs ⭐ (Easiest)

- ✅ **Already configured** in `vercel.json`
- Runs daily at 2 AM UTC
- No additional setup needed if deployed on Vercel

### Option 2: GitHub Actions (Works with any host)

- ✅ **Already configured** in `.github/workflows/daily-aggregation.yml`
- **Setup required**:
  1. Add GitHub Secrets:
     - `APP_URL`: Your deployed app URL (e.g., https://yourapp.vercel.app)
     - `CRON_SECRET`: Same value as in your environment variables
  2. Enable GitHub Actions in your repository

### Option 3: External Cron Service

- Use services like cron-job.org, EasyCron, etc.
- See `CRON_SETUP.md` for detailed instructions

### Option 4: Supabase Database Function

- Run directly in your database
- See `db/scheduled-aggregation.sql` for setup
- Requires pg_cron extension

## 🔧 Manual Testing

You can test the aggregation manually using:

```bash
# Run aggregation for last 1 day
npm run aggregate:daily

# Run aggregation for last 7 days
npm run aggregate:weekly

# Or directly with the script
./run-aggregation.sh 3  # For last 3 days
```

## 🔑 Required Environment Variables

Make sure these are set in your deployment environment:

```bash
CRON_SECRET=your-secure-random-string
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📊 What Gets Aggregated

The daily aggregation computes:

- Total messages sent
- Unique users
- Average session duration
- Most active hours
- Error rates

Data is stored in your Supabase `bot_analytics_daily` table.

## 🕒 Schedule Details

- **Default**: Daily at 2 AM UTC
- **Frequency**: Once per day
- **Data processed**: Previous day's analytics events
- **Retention**: Configurable (default 90 days)

## 🚨 Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check `CRON_SECRET` environment variable
2. **500 Server Error**: Check Supabase connection and database functions
3. **No data**: Ensure analytics events are being recorded

### Monitoring:

- Check your deployment logs for aggregation job status
- Use the manual script to test locally
- Monitor the `bot_analytics_daily` table in Supabase

## 📈 Viewing Results

After aggregation runs, you can view the results in:

- Your dashboard at `/dashboard`
- Supabase dashboard → Tables → `bot_analytics_daily`

---

**Need help?** Check the logs in your deployment platform or run the manual aggregation script to see detailed output.
