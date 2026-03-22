#!/bin/bash
# set -e is intentionally removed so partial failures don't abort the deploy

# Configuration
APP_DIR="/home/bitnami/phimkhoi" 
REPO_URL="https://github.com/khoiabc2020/phimkhoi.git"

echo "Deploying PhimKhoi (CLEAN BUILD) to VPS..."

# 1. STOP APP TO FREE RAM & PREPARE CACHE
echo "Stopping PM2 to free RAM for build..."
npx pm2 stop phimkhoi || true
mkdir -p /home/bitnami/phimkhoi-img-cache

# 2. UPDATE SOURCE
if [ -d "$APP_DIR" ]; then
    echo "Updating web..."
    cd "$APP_DIR"
    git fetch --all
    git reset --hard origin/main
    git clean -fd
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 3. DEEP CLEAN
echo "Cleaning build and dependencies..."
rm -rf .next node_modules 2>/dev/null || true

# 4. INSTALL & BUILD
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building application (Limit: 1536MB)..."
export NODE_OPTIONS="--max_old_space_size=1536"
npm run build

if [ $? -eq 0 ]; then
    echo "Build successful! Preparing standalone..."
    
    mkdir -p .next/standalone/public
    cp -a public/. .next/standalone/public/
    cp -a .next/static/. .next/standalone/.next/static/
    
    if [ -f .env.local ]; then
        cp .env.local .next/standalone/.env.local
        cp .env.local .next/standalone/.env
        cp .env.local .next/standalone/.env.production
    fi

    # 5. START APP
    echo "Starting PM2..."
    npx pm2 start ecosystem.config.cjs --update-env || npx pm2 restart phimkhoi --update-env
    npx pm2 save
    
    echo "System cleanup..."
    npx pm2 flush
    
    # 6. PURGE CACHE
    echo "Purging Cloudflare Cache..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/1164dbc3e64ce7eb80bceefaf277e500/purge_cache" \
         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"purge_everything":true}'
    
    echo "Warming up trending cache..."
    NODE_OPTIONS="--max_old_space_size=512" node scripts/daily-sync.mjs || echo "Sync skipped"

    echo "Deployment complete and successful!"
else
    echo "=========================================="
    echo "   [ERROR] CLEAN BUILD FAILED!           "
    echo "=========================================="
    echo "Attempting to restart existing app..."
    npx pm2 start ecosystem.config.cjs --update-env
    exit 1
fi
