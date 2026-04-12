# VANTAGE - Clear Browser LocalStorage
# This script opens a browser console command to clear localStorage

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VANTAGE - Clear Browser LocalStorage" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Open your browser (Chrome/Edge/Firefox)" -ForegroundColor White
Write-Host "2. Go to: http://localhost:3000" -ForegroundColor White
Write-Host "3. Press F12 to open Developer Console" -ForegroundColor White
Write-Host "4. Paste this command and press Enter:`n" -ForegroundColor White

Write-Host "localStorage.clear();" -ForegroundColor Green
Write-Host "window.location.href = 'http://localhost:3000/login';`n" -ForegroundColor Green

Write-Host "OR - Just run this one-liner:`n" -ForegroundColor Yellow
Write-Host "localStorage.clear(); window.location.href = 'http://localhost:3000/login';`n" -ForegroundColor Green

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  ✓ Clear all cached user data" -ForegroundColor White
Write-Host "  ✓ Clear all cached tokens" -ForegroundColor White
Write-Host "  ✓ Redirect to login page" -ForegroundColor White
Write-Host "  ✓ Allow you to login fresh`n" -ForegroundColor White

Write-Host "Demo Credentials (after clearing):" -ForegroundColor Cyan
Write-Host "  Admin: admin@vantage.live / @admin@123#" -ForegroundColor White
Write-Host "  Host:  host@vantage.live / @host@123#" -ForegroundColor White
Write-Host "  User:  user@vantage.live / @user@123#`n" -ForegroundColor White

pause
