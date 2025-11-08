#!/bin/bash

# Script to manually run analytics aggregation
# This computes daily statistics from raw events

cd "$(dirname "$0")"

# Default values
DAYS=${1:-1}  # Default to 1 day if not specified
BASE_URL=${NEXT_PUBLIC_SITE_URL:-"http://localhost:3000"}

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

echo "🔄 Running analytics aggregation for last $DAYS day(s)..."
echo "📍 Target URL: $BASE_URL/api/analytics/aggregate"
echo ""

# Run aggregation
RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/analytics/aggregate" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"days\": $DAYS}")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

# Check if server is running
if [ -z "$HTTP_STATUS" ]; then
    echo "❌ Error: Could not connect to $BASE_URL"
    echo "   Make sure your server is running"
    if [[ "$BASE_URL" == *"localhost"* ]]; then
        echo "   For local development: npm run dev"
    fi
    exit 1
fi

# Check HTTP status
if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    echo "✅ Success (HTTP $HTTP_STATUS)"
else
    echo "❌ Error (HTTP $HTTP_STATUS)"
fi

# Pretty print response
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

echo ""
if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    echo "✅ Aggregation complete! Your dashboard should now show statistics."
    echo "   View at: $BASE_URL/dashboard"
else
    echo "❌ Aggregation failed. Check the error message above."
    exit 1
fi
