@echo off
echo === PhimKhoi - Build Android APK ===

cd /d "%~dp0.."

echo.
echo Buoc 1: Dang nhap Expo (neu chua dang nhap)
call npx eas-cli whoami 2>nul
if errorlevel 1 (
    echo Chua dang nhap. Chay: npx eas-cli login
    call npx eas-cli login
)

echo.
echo Buoc 2: Build APK qua EAS Cloud...
call npx eas-cli build --platform android --profile production --non-interactive

echo.
echo Xong! APK se duoc tai tu: https://expo.dev/accounts/[tai-khoan]/projects/phimkhoi-mobile/builds
echo Hoac kiem tra email Expo.
pause
