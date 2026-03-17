@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   PUBLISH APK TO GITHUB RELEASES
echo ==========================================

set "REPO=khoiabc2020/phimkhoi"
set "APK_PATH=public\downloads\PhimKhoi-Release.apk"
set "VERSION=%~1"
set "VERSION_NUM=%VERSION:v=%"
set "TMP_DIR=%TEMP%\phimkhoi-release"
set "APK_VERSIONED=%TMP_DIR%\PhimKhoi-v%VERSION_NUM%.apk"
set "APK_LATEST=%TMP_DIR%\PhimKhoi-Release.apk"

if "%VERSION%"=="" (
  echo Usage: publish_github_release_apk.bat v1.0.9
  exit /b 1
)

if not exist "%APK_PATH%" (
  echo [ERROR] APK not found: %APK_PATH%
  exit /b 1
)

where gh >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] GitHub CLI (gh) is not installed.
  exit /b 1
)

if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"
copy /Y "%APK_PATH%" "%APK_VERSIONED%" >nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Failed to prepare versioned APK.
  exit /b %ERRORLEVEL%
)
copy /Y "%APK_PATH%" "%APK_LATEST%" >nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Failed to prepare latest APK alias.
  exit /b %ERRORLEVEL%
)

echo [1/2] Creating release %VERSION% (if not exists)...
gh release view %VERSION% --repo %REPO% >nul 2>nul
if %ERRORLEVEL% neq 0 (
  gh release create %VERSION% --repo %REPO% --title "%VERSION%" --notes "APK release %VERSION%"
  if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
)

echo [2/2] Uploading APK assets...
gh release upload %VERSION% "%APK_VERSIONED%" "%APK_LATEST%" --repo %REPO% --clobber
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo [SUCCESS] APK published (versioned + latest alias):
echo https://github.com/%REPO%/releases/tag/%VERSION%
echo https://github.com/%REPO%/releases/download/%VERSION%/PhimKhoi-v%VERSION_NUM%.apk
echo https://github.com/%REPO%/releases/latest/download/PhimKhoi-Release.apk
exit /b 0

