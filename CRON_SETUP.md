# External Cron Service Setup

If you prefer using an external cron service like cron-job.org, EasyCron, or similar:

## Setup Steps:

1. Sign up for a cron service
2. Create a new cron job with these settings:
   - URL: https://your-domain.com/api/analytics/aggregate
   - Method: POST
   - Schedule: Daily at 2 AM (0 2 \* \* \*)
   - Headers:
     - Authorization: Bearer YOUR_CRON_SECRET
     - Content-Type: application/json
   - Body: {"days": 1}

## Environment Variables Needed:

- CRON_SECRET: Set this in your environment variables

## Popular External Cron Services:

- cron-job.org (free tier available)
- EasyCron
- SetCronJob
- cron.plus
