@echo off
setlocal
title PhimKhoi Control Center
color 0b

:main_menu
cls
echo ========================================================
echo               PHIMKHOI MASTER CONTROL
echo ========================================================
echo 1. [WEB]    Deploy to VPS (Push + Auto-Deploy)
echo 2. [MOBILE] Build Android APK (Local High-Speed)
echo 3. [MOBILE] Build Android APK (Cloud/EAS)
echo 4. [BOTH]   Deploy Web & Build Local APK
echo 5. Exit
echo ========================================================
set /p choice="Select an option (1-5): "

if "%choice%"=="1" goto deploy_web
if "%choice%"=="2" goto build_local
if "%choice%"=="3" goto build_cloud
if "%choice%"=="4" goto deploy_both
if "%choice%"=="5" exit

:deploy_web
cls
echo [WEB DEPLOYMENT]
echo.
set /p commit_msg="Enter commit message (or press enter for 'update'): "
if "%commit_msg%"=="" set commit_msg=update from master control

echo 1. Pushing to GitHub...
git add .
git commit -m "%commit_msg%"
git push origin main
echo.
echo 2. Deploying to VPS...
ssh -i "C:\Users\LE HUY KHOI\Downloads\huykhoi1.pem" -o StrictHostKeyChecking=no ubuntu@ec2-18-141-25-244.ap-southeast-1.compute.amazonaws.com "cd /home/ubuntu/phimkhoi && git pull origin main && bash deploy_vps.sh"
pause
goto main_menu

:build_local
cls
echo [ANDROID LOCAL BUILD]
echo.
call build_apk.bat
pause
goto main_menu

:build_cloud
cls
echo [ANDROID CLOUD BUILD]
echo.
call build_cloud.bat
pause
goto main_menu

:deploy_both
cls
echo [FULL DEPLOYMENT]
echo.
echo 1. Starting Web Deployment...
call :deploy_web_sub
echo.
echo 2. Starting Local APK Build...
call build_apk.bat
echo.
echo [DONE] Web Deployed and APK Built.
pause
goto main_menu

:deploy_web_sub
git add .
git commit -m "full deployment update"
git push origin main
ssh -i "C:\Users\LE HUY KHOI\Downloads\huykhoi1.pem" -o StrictHostKeyChecking=no ubuntu@ec2-18-141-25-244.ap-southeast-1.compute.amazonaws.com "cd /home/ubuntu/phimkhoi && git pull origin main && bash deploy_vps.sh"
exit /b
