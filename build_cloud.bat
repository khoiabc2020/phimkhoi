@echo off
echo ==========================================
echo       PHIMKHOI CLOUD APK BUILDER
echo ==========================================
echo This will build the APK on Expo's servers.
echo No local Android SDK required.
echo.
cd mobile
eas build --platform android --profile production --local
pause
