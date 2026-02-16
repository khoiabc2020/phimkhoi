@echo off
setlocal
echo ==========================================
echo       PHIMKHOI APK BUILDER
echo ==========================================

:: Attempt to find SDK automatically
set "SDK_PATH="

if exist "%LOCALAPPDATA%\Android\Sdk" set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
if exist "C:\Android\Sdk" set "SDK_PATH=C:\Android\Sdk"

:: If not found, ask user
if "%SDK_PATH%"=="" (
    echo [!] Could not automatically find Android SDK.
    echo Please enter the path to your Android SDK (e.g., C:\Users\Name\AppData\Local\Android\Sdk):
    set /p SDK_PATH=
)

if "%SDK_PATH%"=="" (
    echo Error: No SDK path provided. Exiting.
    pause
    exit /b 1
)

echo.
echo [1/2] Configuring local.properties...
echo sdk.dir=%SDK_PATH:\=\\%> mobile\android\local.properties

echo.
echo [2/2] Building APK...
cd mobile\android
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Build Failed! Check the errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] APK built successfully!
echo Location: mobile\android\app\build\outputs\apk\release\app-release.apk
explorer app\build\outputs\apk\release\
pause
