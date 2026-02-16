@echo off
echo ==========================================
echo       PHIMKHOI AUTOMATED DEPLOYMENT
echo ==========================================

echo [1/3] Pushing changes to GitHub...
git add .
git commit -m "chore: automated deployment update"
git push origin main

echo.
echo [2/3] Deploying to VPS (18.141.25.244)...
echo Connecting to VPS...
ssh root@18.141.25.244 "cd /var/www/phimkhoi && git pull && npm install && npm run build && pm2 restart phimkhoi"

echo.
echo [3/3] Done!
pause
