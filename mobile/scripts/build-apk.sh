#!/bin/bash
echo "=== PhimKhoi - Build Android APK ==="
cd "$(dirname "$0")/.."

echo ""
echo "Step 1: Check Expo login..."
npx eas-cli whoami || npx eas-cli login

echo ""
echo "Step 2: Build APK via EAS Cloud..."
npx eas-cli build --platform android --profile production --non-interactive

echo ""
echo "Done! APK download at: https://expo.dev"
