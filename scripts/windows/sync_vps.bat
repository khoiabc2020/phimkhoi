@echo off
setlocal
title PhimKhoi - Dong bo VPS

:: ============================================================
::  CAU HINH DEPLOY - CHINH SUA TAI DAY
:: ============================================================
::  PEM  : Duong dan tuyet doi den file SSH private key (.pem)
::         Vi du: C:\Users\TenUser\Downloads\key.pem
set "PEM=C:\Users\LE HUY KHOI\Downloads\huykhoi1.pem"

::  HOST : User va dia chi SSH cua may chu VPS
::         EC2:          ubuntu@ec2-xx-xx-xx-xx.ap-southeast-1.compute.amazonaws.com
::         DigitalOcean: root@xxx.xxx.xxx.xxx
set "HOST=ubuntu@ec2-18-141-25-244.ap-southeast-1.compute.amazonaws.com"

::  DIR  : Duong dan thu muc du an tren VPS (tuyet doi)
set "DIR=/home/ubuntu/phimkhoi"
:: ============================================================

cd /d "%~dp0..\.."
echo.
echo ==========================================
echo    DONG BO CODE LEN VPS (18.141.25.244)
echo ==========================================
echo    SSH Key: %PEM%
echo    Host   : %HOST%
echo    Dir    : %DIR%
echo ==========================================
echo.

set "msg=%~1"
if "%msg%"=="" set "msg=sync: update web + optimize"

echo [1/4] git add .
git add .

echo [2/4] git commit -m "%msg%"
git commit -m "%msg%" || goto :no_commit

echo [3/4] git push origin main
git push origin main
if errorlevel 1 (
    echo.
    echo [LOI] Push that bai. Kiem tra ket noi mang hoac quyen GitHub.
    pause
    exit /b 1
)

:do_deploy
echo.
echo [4/4] SSH -^> VPS: git pull + deploy_vps.sh (cho phep timeout 10 phut)
ssh -i "%PEM%" -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=20 -o ConnectTimeout=15 %HOST% "cd %DIR% && git pull origin main && bash deploy_vps.sh"

if errorlevel 1 (
    echo.
    echo [LOI] SSH hoac deploy tren VPS that bai.
    echo       - Kiem tra PEM: %PEM%
    echo       - Kiem tra HOST: %HOST%
    echo       - Kiem tra VPS dang chay va co the truy cap.
    pause
    exit /b 1
)

echo.
echo [XONG] VPS da duoc dong bo thanh cong!
echo        Kiem tra tai: https://khoiphim.io.vn
pause
exit /b 0

:no_commit
echo Khong co thay doi moi de commit. Van tien hanh deploy len VPS...
goto :do_deploy
