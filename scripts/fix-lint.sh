#!/bin/bash

# Quick fix script for common linting errors
# This script automatically fixes some common ESLint issues

set -e

echo "🔧 Running automatic lint fixes..."

# Fix unescaped entities in JSX
echo "Fixing unescaped entities..."
find . -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' "s/'/\&apos;/g"
find . -name "*.tsx" -o -name "*.jsx" | xargs sed -i '' "s/\"/\&quot;/g"

# Remove unused imports (this is a basic approach - manual review needed)
echo "Note: Some unused imports and variables need manual review"

echo "✅ Basic fixes applied. Run 'pnpm run lint' to see remaining issues."
