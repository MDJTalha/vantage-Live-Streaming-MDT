@echo off
REM Start VANTAGE servers with PM2
cd /d %~dp0

echo ============================================
echo   VANTAGE Platform - PM2 Startup
echo ============================================
echo.

REM Stop any existing processes
echo Stopping existing processes...
pm2 delete all 2>nul
timeout /t 2 /nobreak >nul

REM Create logs directory
if not exist logs mkdir logs

echo.
echo Starting API server...
pm2 start apps\api\server-simple.js --name vantage-api -i 2 --exec-mode cluster

echo.
echo Starting Web frontend...
cd apps\web
start /B npm run dev
cd ..\..

echo.
echo Waiting for servers to start...
timeout /t 10 /nobreak >nul

echo.
echo ============================================
echo   Server Status
echo ============================================
pm2 status

echo.
echo Web:    http://localhost:3000
echo API:    http://localhost:4000
echo.
echo Press any key to exit...
pause >nul
