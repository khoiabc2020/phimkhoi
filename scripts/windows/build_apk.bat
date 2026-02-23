@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo       PHIMKHOI APK BUILDER (AUTO)
echo ==========================================

:: Hardcoded SDK Path found during automation
set "SDK_PATH=D:\AndroidSdk"

if not exist "%SDK_PATH%" (
    echo [!] Warning: Hardcoded SDK path not found. Checking elsewhere...
    if exist "%LOCALAPPDATA%\Android\Sdk" set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
    if exist "C:\Android\Sdk" set "SDK_PATH=C:\Android\Sdk"
)

if "%SDK_PATH%"=="" (
    echo Error: Could not find Android SDK.
    echo Please install Android Studio or set SDK path manually.
    pause
    exit /b 1
)

echo [1/2] Using SDK at: %SDK_PATH%
echo sdk.dir=%SDK_PATH:\=\\%> mobile\android\local.properties

echo [2/2] Building APK...
cd mobile\android
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Build Failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] APK built successfully!
echo Location: mobile\android\app\build\outputs\apk\release\app-release.apk
explorer app\build\outputs\apk\release\
pause
