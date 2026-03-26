#!/bin/bash
set -euo pipefail

# Ensure Node/PM2 are available even when SSH runs a non-login shell.
export PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

# Configuration
APP_DIR="/home/bitnami/phimkhoi"
REPO_URL="https://github.com/khoiabc2020/phimkhoi.git"
PM2_BIN="${PM2_BIN:-$(command -v pm2 || true)}"

if [ -z "$PM2_BIN" ] || [ ! -x "$PM2_BIN" ]; then
    echo "[ERROR] pm2 not found in PATH=$PATH"
    exit 1
fi

echo "Deploying PhimKhoi (CLEAN BUILD) to VPS..."

# 0. KILL ALL PROCESSES TO FREE RAM (Gratefully requested by USER)
echo "Killing all node/next/pm2 processes..."
"$PM2_BIN" delete all || true
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

    # 4. START APP via ecosystem config
    echo "Starting PM2 via ecosystem.config.cjs..."
    cd "$APP_DIR"
    "$PM2_BIN" delete phimkhoi 2>/dev/null || true
    "$PM2_BIN" start ecosystem.config.cjs
    "$PM2_BIN" save --force
    
    echo "Warming up trending cache in BACKGROUND..."
    NODE_OPTIONS="--max_old_space_size=512" nice -n 19 node scripts/daily-sync.mjs >> /home/bitnami/phimkhoi-sync.log 2>&1 &

    echo "Deployment complete and successful!"
else
    echo "=========================================="
    echo "   [ERROR] CLEAN BUILD FAILED!           "
    echo "=========================================="
    exit 1
fi
