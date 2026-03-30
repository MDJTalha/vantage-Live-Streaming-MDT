@echo off
echo ========================================
echo   VANTAGE Development Server Starter
echo ========================================
echo.

:: Kill any existing Node processes
echo [1/3] Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

:: Start web server with increased memory
echo [2/3] Starting web server...
cd /d "%~dp0apps\web"
start "VANTAGE Web Server" cmd /k "set NODE_OPTIONS=--max-old-space-size=4096 && npm run dev"

:: Wait for web server to start
timeout /t 5 /nobreak >nul

:: Start API server
echo [3/3] Starting API server...
cd /d "%~dp0apps\api"
start "VANTAGE API Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Web Server:  http://localhost:3000
echo API Server:  http://localhost:4000
echo.
echo Both servers will open in separate windows.
echo Keep those windows open while developing.
echo ========================================
echo.
pause
