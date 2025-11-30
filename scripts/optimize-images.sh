#!/bin/bash

# Image Optimization Script for M4KTABA
# Converts JPG/PNG images to WebP format for better performance
# Requires: imagemagick or sharp-cli

echo "🖼️  M4KTABA Image Optimization Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -d "public" ]; then
  echo "❌ Error: Run this script from the project root directory"
  exit 1
fi

# Check if sharp-cli is installed
if ! command -v sharp-cli &> /dev/null; then
  echo "📦 Installing sharp-cli for image optimization..."
  pnpm add -D sharp-cli
fi

# Function to convert images
convert_to_webp() {
  local input_file="$1"
  local output_file="${input_file%.*}.webp"
  
  # Skip if already converted
  if [ -f "$output_file" ]; then
    echo "⏭️  Skipping $input_file (already has WebP version)"
    return
  fi
  
  echo "🔄 Converting: $input_file"
  npx sharp-cli -i "$input_file" -o "$output_file" --webp
  
  # Compare sizes
  original_size=$(du -h "$input_file" | cut -f1)
  webp_size=$(du -h "$output_file" | cut -f1)
  echo "   Original: $original_size → WebP: $webp_size"
}

# Find and convert JPG/PNG files in public directory
echo "🔍 Searching for images to optimize..."
echo ""

count=0
while IFS= read -r -d '' file; do
  convert_to_webp "$file"
  ((count++))
done < <(find public -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) ! -path "*/favicon/*" -print0)

echo ""
echo "✅ Optimization complete!"
echo "📊 Converted $count images"
echo ""
echo "⚠️  Note: Original files are kept. Remove them manually after verifying WebP versions work."
echo "💡 Tip: Update Image components to use .webp extensions for better performance."

