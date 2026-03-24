#!/bin/bash

# [Elite Automation] PhimKhoi Cron Job Setup
# Chạy script này trên VPS để tự động hóa việc đồng bộ phim.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="/var/log/phimkhoi-sync.log"
CRON_SCHEDULE="0 */4 * * *" # Chạy mỗi 4 tiếng một lần
SYNC_COMMAND="cd $PROJECT_DIR && /usr/bin/node scripts/daily-sync.mjs >> $LOG_FILE 2>&1"

echo "=== Cài đặt Elite Sync Automation ==="
echo "Thư mục dự án: $PROJECT_DIR"
echo "Lịch trình: $CRON_SCHEDULE (Mỗi 4 tiếng)"

# Đảm bảo file log có quyền ghi
sudo touch $LOG_FILE
sudo chmod 666 $LOG_FILE

# Xóa các dòng cron cũ của phimkhoi (nếu có) để tránh trùng lặp
(crontab -l 2>/dev/null | grep -v "scripts/daily-sync.mjs") > mycron

# Thêm lệnh mới vào file tạm
echo "$CRON_SCHEDULE $SYNC_COMMAND" >> mycron

# Cài đặt lại crontab từ file tạm
crontab mycron
rm mycron

echo "✓ Đã cài đặt Cron Job thành công!"
echo "Ông có thể kiểm tra bằng lệnh: crontab -l"
echo "Xem log đồng bộ tại: tail -f $LOG_FILE"
