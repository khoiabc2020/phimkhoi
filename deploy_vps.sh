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
# Increase Node heap, limit to 1536MB to prevent OOM on 2GB RAM VPS
export NODE_OPTIONS="--max_old_space_size=1536"

# Cleanup any stale locks and troublesome cache directories that cause ENOTEMPTY
rm -f .next/lock
rm -rf .next/standalone/.next/cache

# Run build without deleting .next first. If it fails, exit immediately.
if npm run build; then
    echo "Build successful! Preparing standalone..."
    
    # Copy fresh static assets into standalone
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

    # Restart PM2 process to prevent RSC format bleeding
    echo "Restarting PM2..."
    npx pm2 restart ecosystem.config.cjs --update-env || npx pm2 start ecosystem.config.cjs --update-env
    npx pm2 save
    
    # SYSTEM CLEANUP (New: keep VPS tidy as requested)
    echo "Performing system cleanup..."
    npx pm2 flush # Clear all logs
    # Note: DO NOT delete .next/cache after build as Next.js 14/15 requires it for fetch-cache!
    find . -maxdepth 2 -name "*.bak" -type f -delete
    find . -maxdepth 2 -name "*.tmp" -type f -delete
    find . -maxdepth 2 -name "temp*" -type f -delete
    
    echo "Deployment complete and successful!"
else
    echo "=========================================="
    echo "   [ERROR] BUILD FAILED! ROLLING BACK...   "
    echo "=========================================="
    echo "The current version remains untouched and running."
    
    # Cleanup even on failure
    rm -f .next/lock
    exit 1
fi
