#!/bin/bash
# set -e is intentionally removed so partial failures don't abort the deploy

# Configuration
APP_DIR="/home/bitnami/phimkhoi" # UPDATED PATH
REPO_URL="https://github.com/khoiabc2020/phimkhoi.git"

echo "Deploying PhimKhoi to VPS..."

# Check if directory exists
if [ -d "$APP_DIR" ]; then
    echo "Updating existing application..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build Next.js app
echo "Building application..."
# Clean old build to prevent caching issues
rm -rf .next
# Increase Node heap, limit to 1536MB to prevent OOM on 2GB RAM VPS
export NODE_OPTIONS="--max_old_space_size=1536"
npm run build

# Copy fresh static assets into standalone (will force-overwrite if already exists)
echo "Copying static assets to standalone..."
mkdir -p .next/standalone/public
cp -a public/. .next/standalone/public/
cp -a .next/static/. .next/standalone/.next/static/
# Copy env file if it exists (Crucial for Standalone)
if [ -f .env.local ]; then
    cp .env.local .next/standalone/.env.local
    cp .env.local .next/standalone/.env
    cp .env.local .next/standalone/.env.production
    echo "Copied .env.local to standalone directory"
fi

# Restart PM2 process (FORCE DELETE and START to ensure clean state and correct mode)
echo "Restarting PM2 (Forced)..."
# Try to delete, but don't fail if it's not there
npx pm2 delete phimkhoi || true
npx pm2 start ecosystem.config.cjs --update-env
npx pm2 save

echo "Deployment complete!"
