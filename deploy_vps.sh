#!/bin/bash
set -euo pipefail

# Ensure Node/PM2 are available even when SSH runs a non-login shell.
export PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

# Configuration
APP_DIR="/home/bitnami/phimkhoi"
BUILD_DIR="/home/bitnami/phimkhoi_build"
REPO_URL="https://github.com/khoiabc2020/phimkhoi.git"
PM2_BIN="${PM2_BIN:-$(command -v pm2 || true)}"

if [ -z "$PM2_BIN" ] || [ ! -x "$PM2_BIN" ]; then
    echo "[ERROR] pm2 not found in PATH=$PATH"
    exit 1
fi

echo "=========================================="
echo " PhimKhoi: ZERO-DOWNTIME DEPLOYMENT"
echo "=========================================="
echo "Note: The live site continues spinning..."

# 1. SETUP SHADOW ENVIRONMENT
echo "Initializing shadow build directory..."
mkdir -p "$BUILD_DIR"
# Fast synchronization: exclude heavy paths to make copy instant using native tar
tar -cf - --exclude='node_modules' --exclude='.next' --exclude='.git' -C "$APP_DIR" . | tar -xf - -C "$BUILD_DIR"

# 2. BUILD IN ISOLATION
echo "Preparing isolated build..."
cd "$BUILD_DIR"
npm install --legacy-peer-deps

echo "Building application (Bounded RAM Limit: 2500MB)..."
# Using 2.5GB Limit prevents VPS from throwing Out-Of-Memory while Live Server is running
export NODE_OPTIONS="--max_old_space_size=2500"

if npm run build; then
    echo "=========================================="
    echo " BUILD SUCCESS! Executing Hot-Swap...     "
    echo "=========================================="
    
    # Pack standalone assets
    mkdir -p .next/standalone/public
    cp -a public/. .next/standalone/public/
    cp -a .next/static/. .next/standalone/.next/static/
    
    if [ -f .env.local ]; then
        cp .env.local .next/standalone/.env.local
        cp .env.local .next/standalone/.env
        cp .env.local .next/standalone/.env.production
    fi
    
    # Tar pipe to Hot Swap the validated shadow artifact to Live Environment (Keeps .git pristine)
    tar -cf - --exclude='.git' -C "$BUILD_DIR" . | tar -xf - -C "$APP_DIR"
    
    # Reload PM2 (0 Downtime instead of 'restart' or 'delete')
    cd "$APP_DIR"
    echo "Reloading Live Node Worker..."
    # Start it if it doesn't exist, Reload it gracefully if it does
    "$PM2_BIN" reload phimkhoi --update-env 2>/dev/null || "$PM2_BIN" start ecosystem.config.cjs
    "$PM2_BIN" save --force
    
    echo "Triggering Background Node Sync Daemon..."
    NODE_OPTIONS="--max_old_space_size=512" nice -n 19 node scripts/sync-suite.mjs --mode=fast >> /home/bitnami/phimkhoi-sync.log 2>&1 &
    
    echo "=========================================="
    echo " ZERO-DOWNTIME DEPLOYMENT SUCCESSFUL!      "
    echo "=========================================="
else
    echo "=========================================="
    echo " [ERROR] BUILD FAILED!                    "
    echo " Your live site continues running safely. "
    echo " Check the logs above to debug the issue. "
    echo "=========================================="
    exit 1
fi
