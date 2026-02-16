@echo off
title PhimKhoi Deployment Tool
color 0A

:menu
cls
echo ==========================================
echo       PHIMKHOI AUTOMATION TOOL
echo ==========================================
echo 1. Deploy Web to VPS (Git Push + SSH)
echo 2. Build Android APK
echo 3. Exit
echo ==========================================
set /p choice="Enter option (1-3): "

if "%choice%"=="1" goto deploy
if "%choice%"=="2" goto build
if "%choice%"=="3" exit

:deploy
cls
echo [Deploying Web]
echo.
echo 1. Pushing to GitHub...
git add .
git commit -m "chore: update from automation tool"
git push origin main
echo.
echo 2. Connecting to VPS...
ssh root@18.141.25.244 "cd /var/www/phimkhoi && git pull && npm install && npm run build && pm2 restart phimkhoi"
echo.
pause
goto menu

:build
cls
echo [Building APK]
call build_apk.bat
goto menu
