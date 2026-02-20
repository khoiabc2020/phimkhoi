#!/bin/bash
# PhimKhoi VPS Setup Script - Cron Daily Sync
# Chạy script này 1 lần trên VPS để cài đặt cron job

set -e

APP_DIR="/var/www/phimkhoi"
LOG_FILE="/var/log/phimkhoi-sync.log"
CRON_JOB="0 2 * * * cd $APP_DIR && node scripts/daily-sync.mjs >> $LOG_FILE 2>&1"

echo "=== PhimKhoi Cron Setup ==="

# Ensure scripts directory exists
mkdir -p "$APP_DIR/scripts"

# Create log file
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Add cron job if not already present
if ! crontab -l 2>/dev/null | grep -q "daily-sync.mjs"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✓ Cron job added: runs daily at 2:00 AM"
else
    echo "! Cron job already exists, skipping"
fi

# Run sync now (first time)
echo ""
echo "Running initial sync now (this may take a few minutes)..."
cd "$APP_DIR"
MONGODB_URI="${MONGODB_URI:-$(grep MONGODB_URI .env | cut -d '=' -f2-)}" \
    node scripts/daily-sync.mjs

echo ""
echo "=== Setup Complete ==="
echo "Cron: daily at 2:00 AM server time"
echo "Log:  tail -f $LOG_FILE"
