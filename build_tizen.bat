@echo off
setlocal

echo ==========================================
echo      PHIMKHOI TIZEN BUILDER
echo ==========================================

:: 1. Find Tizen CLI
set TIZEN_CLI=tizen.bat
where tizen.bat >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\tizen-studio\tools\ide\bin\tizen.bat" (
        set TIZEN_CLI="C:\tizen-studio\tools\ide\bin\tizen.bat"
    ) else (
        echo [ERROR] Tizen CLI not found in PATH or standard locations.
        echo Please make sure Tizen Studio is installed and 'tizen.bat' is in your PATH.
        pause
        exit /b 1
    )
)

echo [INFO] Using Tizen CLI: %TIZEN_CLI%

:: 2. Project Path
set PROJECT_PATH=%~dp0tizen
echo [INFO] Project Path: %PROJECT_PATH%

:: 3. Build Web Project
echo [INFO] Building Web Project...
call %TIZEN_CLI% build-web -- "%PROJECT_PATH%"
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

:: 4. List Security Profiles
echo.
echo [INFO] Available Security Profiles:
call %TIZEN_CLI% security-profiles list
echo.

:: 5. Ask for Profile
set /p PROFILE_NAME="Enter Security Profile Name to sign (or press Enter to skip signing): "

if "%PROFILE_NAME%"=="" (
    echo [WARNING] No profile selected. Packaging UNSIGNED wgt...
    :: Note: Unsigned wgt might not install on TV
    call %TIZEN_CLI% package --type wgt -- "%PROJECT_PATH%\.buildResult"
) else (
    echo [INFO] Packaging SIGNED wgt with profile: %PROFILE_NAME%
    call %TIZEN_CLI% package --type wgt --sign %PROFILE_NAME% -- "%PROJECT_PATH%\.buildResult"
)

if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [SUCCESS] Build Complete!
echo You can find the .wgt file in: %PROJECT_PATH%\.buildResult
echo ==========================================
pause
