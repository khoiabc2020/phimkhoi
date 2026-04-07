#!/bin/bash
# ============================================================
#  PhimKhoi — Local Deploy Script (chạy từ máy Windows/Mac)
#  Usage: bash deploy_local.sh
#         bash deploy_local.sh --no-push   (skip git push)
# ============================================================

# ── VPS Configuration ──────────────────────────────────────
VPS_HOST="13.250.33.6"
VPS_USER="bitnami"
VPS_DIR="/home/bitnami/phimkhoi"
SSH_KEY="$HOME/Downloads/khoiphim.pem"
# ────────────────────────────────────────────────────────────

set -euo pipefail

SKIP_PUSH=false
for arg in "$@"; do
    [[ "$arg" == "--no-push" ]] && SKIP_PUSH=true
done

echo "=========================================="
echo " PhimKhoi — Deploy từ máy local"
echo "=========================================="
echo " VPS  : $VPS_USER@$VPS_HOST"
echo " Key  : $SSH_KEY"
echo " Dir  : $VPS_DIR"
echo "=========================================="

# 1. Kiểm tra SSH key tồn tại
if [ ! -f "$SSH_KEY" ]; then
    echo "[ERROR] Không tìm thấy SSH key: $SSH_KEY"
    echo "  Hãy chắc file .pem nằm tại: ~/Downloads/khoiphim.pem"
    exit 1
fi
chmod 400 "$SSH_KEY" 2>/dev/null || true

# 2. Git push (nếu không --no-push)
if [ "$SKIP_PUSH" = false ]; then
    echo ""
    echo "[1/2] Git push lên GitHub..."
    git push origin main
    echo "  ✓ Push thành công"
fi

# 3. SSH vào VPS deploy
echo ""
echo "[2/2] SSH deploy lên VPS..."
ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=30 \
    "$VPS_USER@$VPS_HOST" \
    "cd $VPS_DIR && git pull origin main && bash deploy_vps.sh"

echo ""
echo "=========================================="
echo " DEPLOY HOÀN THÀNH!"
echo " Web: https://khoiphim.site"
echo "=========================================="
