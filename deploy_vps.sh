#!/bin/bash
# set -e is intentionally removed so partial failures don't abort the deploy

# Configuration
APP_DIR="/home/bitnami/phimkhoi" # UPDATED PATH
REPO_URL="https://github.com/khoiabc2020/phimkhoi.git"

echo "Deploying PhimKhoi to VPS..."

# Check if directory exists
if [ -d "$APP_DIR" ]; then
    # Deep clean hero assets
    echo "Cleaning up old hero assets..."
    rm -rf public/images/china-hero/* 2>/dev/null || true

    # Update web
    echo "Updating web..."
    echo "Updating existing application..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Install dependencies
echo "Installing dependencies (clean install)..."
# Use npm ci for faster, more reliable installs on CI/Server
npm ci || npm install

# Build Next.js app
echo "Building application with strict memory limits..."
# Reduce to 1152MB to leave more room for the OS and current running app on 2GB VPS
export NODE_OPTIONS="--max_old_space_size=1152"

# Flush IO and wait 2s to stabilize before heavy build
sync && sleep 2

# Cleanup any stale locks that cause ENOTEMPTY
# NOTE: We NO LONGER stop PM2 here to achieve ZERO DOWNTIME. 
# We build while the app is running.
rm -f .next/lock

# Run build. If it fails, exit immediately.
if npm run build; then
    echo "Build successful! Preparing standalone..."
    
    # Copy fresh static assets into standalone
    mkdir -p .next/standalone/public
    # Clean up old china-hero images to ensure only new ones are present (per user request)
    rm -rf .next/standalone/public/images/china-hero/*
    cp -a public/. .next/standalone/public/
    cp -a .next/static/. .next/standalone/.next/static/
    
    # Copy env file if it exists (Crucial for Standalone)
    if [ -f .env.local ]; then
        cp .env.local .next/standalone/.env.local
        cp .env.local .next/standalone/.env
        cp .env.local .next/standalone/.env.production
        echo "Copied .env.local to standalone directory"
    fi

    # Reload PM2 process for Zero Downtime
    echo "Reloading PM2 (Zero Downtime)..."
    npx pm2 reload ecosystem.config.cjs --update-env || npx pm2 restart ecosystem.config.cjs --update-env
    npx pm2 save
    
    # SYSTEM CLEANUP (New: keep VPS tidy as requested)
    echo "Performing system cleanup..."
    npx pm2 flush # Clear all logs
    # Note: DO NOT delete .next/cache after build as Next.js 14/15 requires it for fetch-cache!
    find . -maxdepth 2 -name "*.bak" -type f -delete
    find . -maxdepth 2 -name "*.tmp" -type f -delete
    find . -maxdepth 2 -name "temp*" -type f -delete
    
    # CLOUDFLARE CACHE PURGE
    echo "Purging Cloudflare Cache to prevent RSC Bleeding..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/1164dbc3e64ce7eb80bceefaf277e500/purge_cache" \
         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"purge_everything":true}'
    
    # SYNC DATA (New: Ensure cache is warm after deployment)
    echo "Warming up trending cache..."
    # Run with limited memory to avoid hanging
    NODE_OPTIONS="--max_old_space_size=512" node scripts/daily-sync.mjs || echo "Sync skipped or failed"

    echo "Deployment complete and successful!"
else
    echo "=========================================="
    echo "   [ERROR] BUILD FAILED! ROLLING BACK...   "
    echo "=========================================="
    echo "Starting existing application back up..."
    npx pm2 start ecosystem.config.cjs --update-env || npx pm2 restart phimkhoi --update-env
    
    # Cleanup even on failure
    rm -f .next/lock
    exit 1
fi
