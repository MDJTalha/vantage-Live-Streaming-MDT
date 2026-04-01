# VANTAGE Server Startup Script
# Run this by double-clicking or right-click → Run with PowerShell

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  VANTAGE Live Streaming - Server Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$webDir = Join-Path $PSScriptRoot "apps\web"

Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location $webDir
npm install

Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "!!! KEEP THIS WINDOW OPEN !!!" -ForegroundColor Red
Write-Host "Do not close this window or the server will stop." -ForegroundColor Red
Write-Host ""

npm run dev

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to close"
