#!/bin/bash

# Script to manually run analytics aggregation
# This computes daily statistics from raw events

cd "$(dirname "$0")"

# Get the CRON_SECRET from .env.local
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    exit 1
fi

CRON_SECRET=$(grep "CRON_SECRET=" .env.local | cut -d'=' -f2)

if [ -z "$CRON_SECRET" ]; then
    echo "❌ Error: CRON_SECRET not found in .env.local"
    exit 1
fi

echo "🔄 Running analytics aggregation for last 7 days..."
echo ""

# Run aggregation
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/analytics/aggregate" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}')

# Check if server is running
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not connect to http://localhost:3000"
    echo "   Make sure your dev server is running: npm run dev"
    exit 1
fi

# Pretty print response
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Aggregation complete! Your dashboard should now show statistics."
echo "   View at: http://localhost:3000/dashboard"
