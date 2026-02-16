@echo off
echo ==========================================
echo    PHIMKHOI TOTAL AUTOMATION (NO PROMPTS)
echo ==========================================

echo [1/3] Deploying Web to VPS...
git add .
git commit -m "auto: full system update"
git push origin main
ssh -i "C:\Users\LE HUY KHOI\Downloads\huykhoi1.pem" -o StrictHostKeyChecking=no ubuntu@ec2-18-141-25-244.ap-southeast-1.compute.amazonaws.com "bash /home/ubuntu/phimkhoi/deploy_vps.sh"

echo.
echo [2/3] Building Android APK (Local)...
cd mobile\android
:: Set SDK path just in case
echo sdk.dir=D:\\AndroidSdk> local.properties
call gradlew.bat assembleRelease
cd ..\..

echo.
echo [3/3] Automation Complete!
echo APK is at: mobile\android\app\build\outputs\apk\release\app-release.apk
explorer mobile\android\app\build\outputs\apk\release\
