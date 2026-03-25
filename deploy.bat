@echo off
setlocal EnableDelayedExpansion
title PhimKhoi - Deploy VPS (All-in-One)

:: ============================================================
::  CAU HINH - CHINH SUA TAI DAY
:: ============================================================
set "PEM=C:\Users\LE HUY KHOI\Downloads\khoiphim.pem"
set "HOST=bitnami@13.250.33.6"
set "REPO=https://github.com/khoiabc2020/phimkhoi.git"
set "APP_DIR=/home/bitnami/phimkhoi"
:: ============================================================

cd /d "%~dp0"
echo.
echo ==========================================
echo    PhimKhoi - ALL-IN-ONE DEPLOY
echo    VPS: 13.250.33.6  ^|  User: bitnami
echo ==========================================
echo.

:: ---- BUOC 1: GIT PUSH ----
set "msg=%~1"
if "!msg!"=="" set "msg=deploy: update web"

echo [1/3] Git add + commit + push...
git add .
git commit -m "!msg!" 2>nul || echo (Khong co thay doi moi, van deploy tiep...)
git push origin main
if errorlevel 1 (
    echo.
    echo [LOI] Git push that bai.
    pause & exit /b 1
)

:: ---- BUOC 2: SSH DEPLOY ----
echo.
echo [2/3] SSH vao VPS va chay deploy (co the mat 5-10 phut)...
echo.

set DEPLOY_CMD=^
APP_DIR="%APP_DIR%" ^&^& ^
REPO="%REPO%" ^&^& ^
echo "=== [1/6] Dung app cu ===" ^&^& ^
(npx pm2 delete phimkhoi 2>/dev/null ^|^| true) ^&^& ^
(sudo pkill -f next 2>/dev/null ^|^| true) ^&^& ^
echo "=== [2/6] Cap nhat code ===" ^&^& ^
([ -d "$APP_DIR" ] ^&^& (cd "$APP_DIR" ^&^& git fetch --all ^&^& git reset --hard origin/main ^&^& git clean -fd) ^|^| (git clone "$REPO" "$APP_DIR" ^&^& cd "$APP_DIR")) ^&^& ^
cd "$APP_DIR" ^&^& ^
echo "=== [3/6] Cai dependencies ===" ^&^& ^
npm install --legacy-peer-deps ^&^& ^
echo "=== [4/6] Build app ===" ^&^& ^
export NODE_OPTIONS="--max_old_space_size=3072" ^&^& ^
npm run build ^&^& ^
echo "=== [5/6] Copy static files ===" ^&^& ^
mkdir -p .next/standalone/public ^&^& ^
cp -a public/. .next/standalone/public/ ^&^& ^
cp -a .next/static/. .next/standalone/.next/static/ ^&^& ^
([ -f .env.local ] ^&^& cp .env.local .next/standalone/.env.local ^&^& cp .env.local .next/standalone/.env ^&^& cp .env.local .next/standalone/.env.production ^|^| true) ^&^& ^
echo "=== [6/6] Khoi dong PM2 ===" ^&^& ^
cd .next/standalone ^&^& ^
PORT=3000 HOSTNAME=0.0.0.0 npx pm2 start server.js --name phimkhoi ^&^& ^
cd ../.. ^&^& ^
npx pm2 save ^&^& ^
echo "" ^&^& ^
echo "=== DEPLOY HOAN TAT! ==="

ssh -i "%PEM%" -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=20 -o ConnectTimeout=15 %HOST% "bash -c '%DEPLOY_CMD%'"

if errorlevel 1 (
    echo.
    echo [LOI] Deploy that bai! Xem log ben tren de kiem tra loi.
    pause & exit /b 1
)

:: ---- BUOC 3: KIEM TRA ----
echo.
echo [3/3] Kiem tra trang thai PM2...
ssh -i "%PEM%" -o StrictHostKeyChecking=no %HOST% "npx pm2 list"

echo.
echo ==========================================
echo    HOAN TAT! Kiem tra: https://khoiphim.org
echo ==========================================
pause
