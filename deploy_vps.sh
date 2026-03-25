#!/bin/bash
# Configuration
APP_DIR="/home/admin/phimkhoi" 
REPO_URL="https://github.com/khoiabc2020/phimkhoi.git"

echo "Deploying PhimKhoi (CLEAN BUILD) to VPS..."

# 0. KILL ALL PROCESSES TO FREE RAM (Gratefully requested by USER)
echo "Killing all node/next/pm2 processes..."
npx pm2 delete all || true
sudo pkill -f next || true
sudo pkill -f node || true

# 1. UPDATE SOURCE
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

# 2. DEEP CLEAN
echo "Cleaning build and dependencies..."
rm -rf .next node_modules 2>/dev/null || true

# 3. INSTALL & BUILD
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building application (Limit: 3072MB for 4GB RAM VPS)..."
export NODE_OPTIONS="--max_old_space_size=3072"
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

    # 4. START APP
    echo "Starting PM2..."
    # Check if ecosystem file exists
    if [ -f ecosystem.config.cjs ]; then
        npx pm2 start ecosystem.config.cjs --update-env
    else
        npx pm2 start npm --name phimkhoi -- start
    fi
    npx pm2 save
    
    echo "Warming up trending cache in BACKGROUND..."
    NODE_OPTIONS="--max_old_space_size=512" nice -n 19 node scripts/daily-sync.mjs >> /home/admin/phimkhoi-sync.log 2>&1 &

    echo "Deployment complete and successful!"
else
    echo "=========================================="
    echo "   [ERROR] CLEAN BUILD FAILED!           "
    echo "=========================================="
    exit 1
fi
