@echo off
setlocal
title PhimKhoi - Dong bo VPS

set "PEM=C:\Users\LE HUY KHOI\Downloads\huykhoi1.pem"
set "HOST=ubuntu@ec2-18-141-25-244.ap-southeast-1.compute.amazonaws.com"

cd /d "%~dp0..\.."
echo ==========================================
echo    DONG BO CODE LEN VPS (18.141.25.244)
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
    echo [LOI] Push that bai. Kiem tra mang / quyen.
    pause
    exit /b 1
)

echo [4/4] SSH -^> VPS: git pull + deploy_vps.sh (cho phep timeout 10 phut)
ssh -i "%PEM%" -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=20 -o ConnectTimeout=15 %HOST% "cd /home/ubuntu/phimkhoi && git pull origin main && bash deploy_vps.sh"

if errorlevel 1 (
    echo [LOI] SSH hoac deploy tren VPS that bai. Kiem tra mang, PEM, VPS dang chay.
    pause
    exit /b 1
)

echo.
echo [XONG] VPS da duoc dong bo. Kiem tra: http://18.141.25.244 hoac https://khoiphim.io.vn
pause
exit /b 0

:no_commit
echo Khong co thay doi de commit. Van chay pull + deploy tren VPS...
goto :deploy_only

:deploy_only
echo SSH -^> VPS: git pull + deploy_vps.sh
ssh -i "%PEM%" -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=20 -o ConnectTimeout=15 %HOST% "cd /home/ubuntu/phimkhoi && git pull origin main && bash deploy_vps.sh"
if errorlevel 1 (
    echo [LOI] SSH/deploy that bai.
    pause
    exit /b 1
)
echo [XONG] VPS da deploy xong.
pause
exit /b 0
