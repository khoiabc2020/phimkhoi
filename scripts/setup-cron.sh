#!/bin/bash

# PhimKhoi sync cron setup

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="/var/log/phimkhoi-sync.log"
CRON_SCHEDULE="0 */4 * * *"
SYNC_COMMAND="cd $PROJECT_DIR && /usr/bin/node scripts/sync-suite.mjs --mode=fast >> $LOG_FILE 2>&1"

echo "=== Cai dat PhimKhoi Sync Cron ==="
echo "Thu muc du an: $PROJECT_DIR"
echo "Lich trinh: $CRON_SCHEDULE"

sudo touch "$LOG_FILE"
sudo chmod 666 "$LOG_FILE"

(crontab -l 2>/dev/null | grep -v "scripts/sync-suite.mjs" | grep -v "scripts/daily-sync.mjs") > mycron
echo "$CRON_SCHEDULE $SYNC_COMMAND" >> mycron
crontab mycron
rm mycron

echo "Da cai dat cron thanh cong."
echo "Kiem tra: crontab -l"
echo "Xem log: tail -f $LOG_FILE"
