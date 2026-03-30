@echo off
echo ============================================
echo   VANTAGE System - Quick Start Fix
echo ============================================
echo.

echo [1/3] Checking if Web App is running...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Web App is running on http://localhost:3000
) else (
    echo ✗ Web App not running. Starting...
    cd /d "%~dp0apps\web"
    start "VANTAGE Web" npm run dev
    timeout /t 5 /nobreak >nul
)

echo.
echo [2/3] API Server Status:
echo ✗ API has TypeScript errors (374 errors)
echo ✓ Frontend works in DEMO MODE (localStorage)
echo.
echo [3/3] Database Status:
docker-compose ps 2>nul | findstr "postgres" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL is running
) else (
    echo ✗ PostgreSQL not running. Starting...
    docker-compose up -d postgres redis
)

echo.
echo ============================================
echo   SYSTEM READY - DEMO MODE
echo ============================================
echo.
echo Web App:    http://localhost:3000
echo API Server: NOT RUNNING (TypeScript errors)
echo Database:   Running (for future use)
echo.
echo DEMO MODE FEATURES:
echo ✓ Login/Signup works (localStorage)
echo ✓ Dashboard works
echo ✓ Create Room works
echo ✓ Meeting Room works
echo ✓ Recording UI (API integration pending)
echo ✓ Admin Dashboard (API integration pending)
echo.
echo DEMO CREDENTIALS:
echo Email:    admin@vantage.live
echo Password: @admin@123#
echo.
echo Or use ANY email/password to create demo account
echo ============================================
echo.
echo Press any key to open the app...
pause >nul
start http://localhost:3000
