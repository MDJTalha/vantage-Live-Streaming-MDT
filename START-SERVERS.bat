@echo off
title VANTAGE Development Servers
color 0B

echo.
echo ==================================================
echo   VANTAGE Development Server Starter
echo ==================================================
echo.
echo Starting BOTH frontend (3000) and API (4000)...
echo.
echo This will keep running - minimize this window!
echo.
pause

:: Start API server in background
echo [1/2] Starting API server on port 4000...
start "VANTAGE API" cmd /k "cd /d %~dp0apps\api && npm run dev"
timeout /t 3 /nobreak >nul

:: Start Frontend server
echo [2/2] Starting Frontend on port 3000...
cd /d "%~dp0apps\web"
npm run dev

echo.
echo Servers stopped.
pause
