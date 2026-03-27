@echo off
setlocal
title PhimKhoi - Sync Data

cd /d "%~dp0..\.."

set "MODE=%~1"
if "%MODE%"=="" set "MODE=fast"

echo.
echo ==========================================
echo    PHIMKHOI DATA SYNC (%MODE%)
echo ==========================================
echo.

if /I "%MODE%"=="full" goto :run_full
if /I "%MODE%"=="repair" goto :run_repair
if /I "%MODE%"=="audit" goto :run_audit

:run_fast
call npm run sync:fast
goto :done

:run_full
call npm run sync:full
goto :done

:run_repair
call npm run sync:repair
goto :done

:run_audit
call npm run sync:audit
goto :done

:done
if errorlevel 1 (
    echo.
    echo [LOI] Sync data that bai.
    exit /b 1
)

echo.
echo [XONG] Sync data hoan tat.
exit /b 0
