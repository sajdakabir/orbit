#!/bin/bash

# Script to reset macOS permissions for Orbit app
# Run this if you continue to see permission prompts

echo "Resetting macOS permissions for Orbit..."

# Get the app bundle identifier based on environment
ORBIT_ENV="${ORBIT_ENV:-local}"
if [ "$ORBIT_ENV" = "prod" ]; then
    BUNDLE_ID="ai.orbit.orbit"
    APP_NAME="Orbit"
else
    BUNDLE_ID="ai.orbit.orbit-${ORBIT_ENV}"
    APP_NAME="Orbit-${ORBIT_ENV}"
fi

echo "Bundle ID: $BUNDLE_ID"
echo "App Name: $APP_NAME"

# Reset microphone permissions
echo "Resetting microphone permissions..."
tccutil reset Microphone "$BUNDLE_ID" 2>/dev/null || echo "Could not reset microphone permissions (might need manual reset)"

# Reset Apple Events permissions if needed
echo "Resetting Apple Events permissions..."
tccutil reset AppleEvents "$BUNDLE_ID" 2>/dev/null || echo "Could not reset Apple Events permissions (might need manual reset)"

echo ""
echo "✅ Permissions reset complete!"
echo ""
echo "Next steps:"
echo "1. Rebuild the app: bun run build:app or bun run build:mac"
echo "2. Launch the app and grant permissions when prompted"
echo "3. The permissions should now persist correctly"
echo ""
echo "If the issue persists, you may need to manually reset in:"
echo "System Settings → Privacy & Security → Microphone"
