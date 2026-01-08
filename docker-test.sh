#!/bin/bash
# Quick Docker test script

set -e

echo "🐳 Building Docker image..."
docker build -t og-screenshot .

echo ""
echo "✅ Build successful!"
echo ""
echo "🧪 Running test screenshot..."

# Create output directory if it doesn't exist
mkdir -p output

# Run test
docker run --rm \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  --verbose \
  https://example.com

echo ""
echo "✅ Test completed!"
echo ""
echo "📸 Screenshots saved to: ./output/"
ls -lh output/*.png | tail -1
