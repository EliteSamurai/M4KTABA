#!/bin/bash

# Simple curl-based health check
BASE_URL="${SYNTH_BASE_URL:-https://m4ktaba.com}"

echo "🔍 Starting curl-based health check for: $BASE_URL"
echo "🕐 Test started at: $(date -u)"

# Test 1: Homepage
echo "🔍 Test 1: Homepage connectivity"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo "✅ Homepage is accessible (HTTP 200)"
else
    echo "❌ Homepage test failed"
    exit 1
fi

# Test 2: Checkout page
echo "🔍 Test 2: Checkout page accessibility"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/checkout" | grep -q "200"; then
    echo "✅ Checkout page is accessible (HTTP 200)"
else
    echo "❌ Checkout page test failed"
    exit 1
fi

# Test 3: Response time check
echo "🔍 Test 3: Response time check"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL")
if (( $(echo "$RESPONSE_TIME < 10" | bc -l) )); then
    echo "✅ Response time is acceptable (${RESPONSE_TIME}s)"
else
    echo "⚠️  Response time is slow (${RESPONSE_TIME}s) but continuing..."
fi

echo "🎉 All curl-based health checks passed!"
