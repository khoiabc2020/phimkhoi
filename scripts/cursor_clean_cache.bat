@echo off
REM Chay file nay SAU KHI DONG Cursor de don het cache con lai
set CURSOR=%APPDATA%\Cursor
echo Cleaning Cursor cache...
rd /s /q "%CURSOR%\Cache" 2>nul
rd /s /q "%CURSOR%\GPUCache" 2>nul
rd /s /q "%CURSOR%\DawnGraphiteCache" 2>nul
rd /s /q "%CURSOR%\DawnWebGPUCache" 2>nul
rd /s /q "%CURSOR%\Service Worker" 2>nul
rd /s /q "%CURSOR%\logs" 2>nul
rd /s /q "%CURSOR%\Network" 2>nul
echo Done. Cursor will recreate these on next launch.
pause
