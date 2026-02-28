@echo off
setlocal
title PhimKhoi - Setup domain khoiphim.io.vn

set "PEM=C:\Users\LE HUY KHOI\Downloads\huykhoi1.pem"
set "HOST=ubuntu@ec2-18-141-25-244.ap-southeast-1.compute.amazonaws.com"

cd /d "%~dp0..\.."
echo ==========================================
echo    SETUP DOMAIN: khoiphim.io.vn (Nginx)
echo ==========================================
echo.

echo [1/3] Upload nginx config len VPS...
scp -i "%PEM%" -o StrictHostKeyChecking=no "scripts\vps\nginx-phimkhoi.conf" %HOST%:~/nginx-phimkhoi.conf
if errorlevel 1 (
    echo [LOI] Upload that bai. Kiem tra PEM + mang.
    pause
    exit /b 1
)

echo [2/3] Copy vao sites-available va reload Nginx...
ssh -i "%PEM%" -o StrictHostKeyChecking=no %HOST% "sudo cp ~/nginx-phimkhoi.conf /etc/nginx/sites-available/phimkhoi && sudo nginx -t && sudo systemctl reload nginx"
if errorlevel 1 (
    echo [LOI] Nginx reload that bai. Xem loi tren.
    pause
    exit /b 1
)

echo [3/3] Xong.
echo.
echo Domain da tro: http://khoiphim.io.vn  va  http://www.khoiphim.io.vn
echo (Dam bao DNS A record @ va www tro ve 18.141.25.244)
echo.
echo Muon bat HTTPS (SSL), tren VPS chay:
echo   sudo apt install -y certbot python3-certbot-nginx
echo   sudo certbot --nginx -d khoiphim.io.vn -d www.khoiphim.io.vn
echo.
pause
exit /b 0
