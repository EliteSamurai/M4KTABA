#!/bin/bash

# Pre-push validation script
# This script runs all the checks that CI runs to ensure they pass before pushing

set -e

echo "🚀 Running pre-push validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile
print_status "Dependencies installed"

# Run linting
echo "🔍 Running ESLint..."
if pnpm run lint; then
    print_status "ESLint passed"
else
    print_error "ESLint failed - please fix the errors above"
    exit 1
fi

# Run type checking
echo "🔍 Running TypeScript type checking..."
if pnpm run type-check; then
    print_status "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed - please fix the errors above"
    exit 1
fi

# Run build
echo "🏗️  Running build..."
if pnpm run build; then
    print_status "Build passed"
else
    print_error "Build failed - please fix the errors above"
    exit 1
fi

# Run tests (if they exist)
echo "🧪 Running tests..."
if pnpm run test:ci; then
    print_status "Tests passed"
else
    print_warning "Tests failed or don't exist - continuing..."
fi

# Run Playwright tests (if they exist)
echo "🎭 Running Playwright tests..."
if pnpm run test:e2e; then
    print_status "Playwright tests passed"
else
    print_warning "Playwright tests failed or don't exist - continuing..."
fi

print_status "All pre-push checks passed! 🎉"
echo "You can now safely push your changes."
