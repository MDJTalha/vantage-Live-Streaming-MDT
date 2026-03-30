@echo off
:: ============================================
::   VANTAGE - Simple Start (No Turbo Issues)
::   Use this if start-dev.bat has problems
:: ============================================

cd /d %~dp0

cls
echo.
echo ============================================
echo   VANTAGE - Simple Start
echo ============================================
echo.

echo Starting servers directly...
echo.

:: Start API
cd apps\api
echo [1/2] Starting API Server...
start "VANTAGE API" npm run dev
cd ..\..

:: Wait
timeout /t 2 /nobreak >nul

:: Start Web
cd apps\web
echo [2/2] Starting Web Frontend...
start "VANTAGE Web" npm run dev
cd ..\..

:: Wait for startup
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   Servers Started!
echo ============================================
echo.
echo Two windows should have opened:
echo   1. VANTAGE API (Port 4000)
echo   2. VANTAGE Web (Port 3000)
echo.
echo Access: http://localhost:3000
echo.
echo ============================================
echo.
echo This window will close in 5 seconds...
timeout /t 5 /nobreak >nul

exit
