#!/bin/bash

# PhimKhoi VPS Deployment Script
# Usage: bash deploy_vps.sh

APP_DIR="/home/ubuntu/phimkhoi"
LOG_FILE="/home/ubuntu/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting deployment..."

# Navigate to project directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR" || exit
    log "Pulling latest changes..."
    git reset --hard
    git pull origin main
else
    log "Directory $APP_DIR not found!"
    exit 1
fi

# Install dependencies
log "Installing dependencies (npm ci)..."
rm -rf node_modules
npm install --legacy-peer-deps

# Build Next.js app
log "Building Next.js application..."
npm run build

# Restart PM2
log "Restarting PM2 process..."
if pm2 show phimkhoi > /dev/null; then
    pm2 restart phimkhoi
else
    pm2 start npm --name "phimkhoi" -- start
fi

log "Deployment Success!"
