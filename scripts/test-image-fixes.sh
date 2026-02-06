#!/bin/bash

# Test script for image fixes
# This tests the image URL handling and placeholder fallbacks

echo "🧪 Testing Image Fixes"
echo "======================"
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Check if placeholder image exists
echo "📋 Test 1: Placeholder image exists"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/islamiclibrary.jpg" | grep -q "200"; then
  echo "   ✅ PASS: /islamiclibrary.jpg exists"
else
  echo "   ❌ FAIL: /islamiclibrary.jpg not found"
fi

# Test 2: Check .well-known/traffic-advice endpoint
echo ""
echo "📋 Test 2: .well-known/traffic-advice endpoint"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.well-known/traffic-advice")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ PASS: Returns 200"
else
  echo "   ❌ FAIL: Returns $RESPONSE (expected 200)"
fi

# Test 3: Test /all page loads without image errors
echo ""
echo "📋 Test 3: /all page loads"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/all")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ PASS: Page loads (HTTP $STATUS)"
else
  echo "   ❌ FAIL: Page returns HTTP $STATUS"
fi

# Test 4: Check for broken image references in HTML
echo ""
echo "📋 Test 4: Check for placeholder.jpg references (should be replaced)"
PLACEHOLDER_COUNT=$(curl -s "$BASE_URL/all" | grep -o "placeholder\.jpg" | wc -l | tr -d ' ')
if [ "$PLACEHOLDER_COUNT" = "0" ]; then
  echo "   ✅ PASS: No placeholder.jpg references found"
else
  echo "   ⚠️  WARN: Found $PLACEHOLDER_COUNT placeholder.jpg references"
fi

# Test 5: Check for placeholder.svg references
echo ""
echo "📋 Test 5: Check for placeholder.svg references (should be replaced)"
SVG_COUNT=$(curl -s "$BASE_URL/all" | grep -o "placeholder\.svg" | wc -l | tr -d ' ')
if [ "$SVG_COUNT" = "0" ]; then
  echo "   ✅ PASS: No placeholder.svg references found"
else
  echo "   ⚠️  WARN: Found $SVG_COUNT placeholder.svg references"
fi

# Test 6: Test homepage loads
echo ""
echo "📋 Test 6: Homepage loads"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ PASS: Homepage loads (HTTP $STATUS)"
else
  echo "   ❌ FAIL: Homepage returns HTTP $STATUS"
fi

echo ""
echo "✅ Testing complete!"
