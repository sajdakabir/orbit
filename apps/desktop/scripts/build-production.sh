#!/bin/bash

# Build script for production with proper environment variables
# This ensures the built app uses https://sage.sajdakabir.com instead of localhost

set -e

echo "🚀 Building Orbit for production..."
echo ""

# Export production environment variables
export VITE_GRPC_BASE_URL="https://sage.sajdakabir.com"
export ORBIT_ENV="prod"
export VITE_ORBIT_VERSION="${VITE_ORBIT_VERSION:-0.2.3}"

echo "Environment Configuration:"
echo "  VITE_GRPC_BASE_URL: $VITE_GRPC_BASE_URL"
echo "  ORBIT_ENV: $ORBIT_ENV"
echo "  VITE_ORBIT_VERSION: $VITE_ORBIT_VERSION"
echo ""

# Clean old builds
echo "🧹 Cleaning old builds..."
rm -rf dist out

# Build the app
echo "📦 Building application..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    bun run build:mac
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
    # Windows
    bun run build:win
else
    # Linux or other
    bun run build:app
fi

echo ""
echo "✅ Production build complete!"
echo "   API URL is set to: $VITE_GRPC_BASE_URL"
echo ""
echo "📦 Built files are in the 'dist' directory"
