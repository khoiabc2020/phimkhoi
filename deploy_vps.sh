#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status.

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
npm run build

# FIX: Copy static assets to standalone directory (Critical for CSS/JS/Images to work)
echo "Copying static assets to standalone..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
# Copy env file if it exists (Crucial for Standalone)
if [ -f .env.local ]; then
    cp .env.local .next/standalone/.env.production
    cp .env.local .next/standalone/.env
fi
cp -r .next/static .next/standalone/.next/static

# Restart PM2 process
echo "Restarting PM2..."
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "Deployment complete!"
