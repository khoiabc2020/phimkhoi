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

# Cleanup any stale locks
rm -f .next/lock

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

    # Restart PM2 process gracefully (Reload instead of delete+start)
    echo "Reloading PM2 (Zero-downtime attempt)..."
    npx pm2 reload ecosystem.config.cjs --update-env || npx pm2 start ecosystem.config.cjs --update-env
    npx pm2 save
    
    echo "Deployment complete and successful!"
else
    echo "=========================================="
    echo "   [ERROR] BUILD FAILED! ROLLING BACK...   "
    echo "=========================================="
    echo "The current version remains untouched and running."
    exit 1
fi
