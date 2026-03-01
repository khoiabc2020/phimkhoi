#!/bin/bash
# set -e is intentionally removed so partial failures don't abort the deploy

# Configuration
APP_DIR="/home/ubuntu/phimkhoi" # UPDATED PATH
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
# Increase Node heap for Next build on small VPS
export NODE_OPTIONS="--max_old_space_size=2048"
npm run build

# Copy fresh static assets into standalone (will force-overwrite if already exists)
echo "Copying static assets to standalone..."
cp -rf public .next/standalone/public
cp -rf .next/static .next/standalone/.next/static
# Copy env file if it exists (Crucial for Standalone)
if [ -f .env.local ]; then
    cp .env.local .next/standalone/.env.production
    cp .env.local .next/standalone/.env
fi

# Restart PM2 process
echo "Restarting PM2..."
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "Deployment complete!"
