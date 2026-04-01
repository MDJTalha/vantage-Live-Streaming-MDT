# ============================================
# VANTAGE Automated Vercel Deployment Script
# ============================================
# This script will deploy your site to Vercel
# Run this in PowerShell: .\deploy-automated.ps1
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  VANTAGE Automated Vercel Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to web app directory
Write-Host "[1/5] Navigating to web app directory..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\apps\web"

# Check if Vercel CLI is installed
Write-Host "[2/5] Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login to Vercel
Write-Host "[3/5] Logging in to Vercel..." -ForegroundColor Yellow
Write-Host "Please complete the login in your browser..." -ForegroundColor Green
vercel login

# Deploy with correct settings
Write-Host "[4/5] Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: Use these settings in Vercel:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Root Directory:" -ForegroundColor Green
Write-Host "  apps/web" -ForegroundColor White
Write-Host ""
Write-Host "Build Command:" -ForegroundColor Green
Write-Host "  cd ../.. && npm ci --legacy-peer-deps && npx turbo run build --filter=web... --no-cache" -ForegroundColor White
Write-Host ""
Write-Host "Install Command:" -ForegroundColor Green
Write-Host "  cd ../.. && npm ci --legacy-peer-deps" -ForegroundColor White
Write-Host ""
Write-Host "Output Directory:" -ForegroundColor Green
Write-Host "  .next" -ForegroundColor White
Write-Host ""
Write-Host "Environment Variables:" -ForegroundColor Green
Write-Host "  NEXT_PUBLIC_APP_NAME = VANTAGE" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_APP_URL = https://vantage.aivon.site" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_API_URL = https://your-api-domain.com" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_WS_URL = wss://your-api-domain.com" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Open Vercel deployment page
Write-Host "[5/5] Opening Vercel deployment page..." -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 CLICK THIS LINK TO DEPLOY:" -ForegroundColor Green
Write-Host "https://vercel.com/new/git/github?repository=MDJTalha%2Fvantage-Live-Streaming-MDT&root-directory=apps%2Fweb" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then:" -ForegroundColor Yellow
Write-Host "1. Click 'Import'" -ForegroundColor White
Write-Host "2. Click 'Edit' for each setting and copy values above" -ForegroundColor White
Write-Host "3. Add the 4 environment variables" -ForegroundColor White
Write-Host "4. Click 'Deploy'" -ForegroundColor White
Write-Host ""

# Open browser automatically
Start-Process "https://vercel.com/new/git/github?repository=MDJTalha%2Fvantage-Live-Streaming-MDT&root-directory=apps%2Fweb"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment page opened in your browser!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After deployment completes, your site will be live at:" -ForegroundColor Green
Write-Host "  https://vantage.aivon.site" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
