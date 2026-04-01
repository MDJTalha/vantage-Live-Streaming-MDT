@echo off
title VANTAGE Development Server
color 0A

echo.
echo ============================================
echo   VANTAGE Live Streaming - Development Server
echo ============================================
echo.
echo Starting Next.js development server...
echo.
echo This window must stay open while server runs
echo.
echo Server will be available at:
echo   http://localhost:3000
echo.
echo Press Ctrl+C to stop server
echo ============================================
echo.

cd /d "%~dp0apps\web"
call npm run dev

pause
