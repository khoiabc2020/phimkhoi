# PhimKhoi Deployment Script (All-in-One)
# Usage: .\deploy.ps1 "Commit Message"

$PEM_PATH = "C:\Users\LE HUY KHOI\Downloads\khoiphim.pem"
$SSH_HOST = "bitnami@13.250.33.6"
$REMOTE_DIR = "/home/bitnami/phimkhoi"

$CommitMsg = $args[0]
if (-not $CommitMsg) { $CommitMsg = "sync: auto-deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

Write-Host "`n>>> [1/4] Syncing local code to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "$CommitMsg"
git push origin main

Write-Host "`n>>> [2/4] Connecting to VPS and pulling changes..." -ForegroundColor Cyan
$RemoteCmds = @"
cd $REMOTE_DIR
git fetch --all
git reset --hard origin/main
git clean -fd
"@

ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no $SSH_HOST $RemoteCmds

Write-Host "`n>>> [3/4] Building application on VPS (CLEAN BUILD)..." -ForegroundColor Cyan
$BuildCmds = @"
cd $REMOTE_DIR
export NODE_OPTIONS="--max_old_space_size=3072"
echo "Cleaning old build and dependencies..."
rm -rf .next node_modules 2>/dev/null || true
echo "Installing dependencies..."
npm install --legacy-peer-deps
echo "Running next build..."
npm run build
# Standalone setup
echo "Setting up standalone directory..."
mkdir -p .next/standalone/public
cp -a public/. .next/standalone/public/
cp -a .next/static/. .next/standalone/.next/static/
if [ -f .env.local ]; then
    cp .env.local .next/standalone/.env.local
    cp .env.local .next/standalone/.env
    cp .env.local .next/standalone/.env.production
fi
"@

ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no $SSH_HOST $BuildCmds

Write-Host "`n>>> [4/4] Restarting with PM2..." -ForegroundColor Cyan
$RestartCmds = @"
cd $REMOTE_DIR/.next/standalone
npx pm2 delete phimkhoi 2>/dev/null || true
PORT=3000 HOSTNAME=0.0.0.0 npx pm2 start server.js --name phimkhoi
npx pm2 save
npx pm2 list
"@

ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no $SSH_HOST $RestartCmds

Write-Host "`n*** DEPLOYMENT COMPLETE ***" -ForegroundColor Green
Write-Host "Check the site at: https://khoiphim.org" -ForegroundColor Yellow
