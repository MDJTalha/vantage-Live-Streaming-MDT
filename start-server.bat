@echo off
title VANTAGE Development Server Monitor
color 0A

echo ========================================
echo   VANTAGE Server Monitor
echo ========================================
echo.
echo Starting development server...
echo Press Ctrl+C to stop monitoring
echo.

:restart
cd /d "%~dp0apps\web"
echo [%DATE% %TIME%] Starting server...
set NODE_OPTIONS=--max-old-space-size=4096
call npm run dev

echo.
echo [%DATE% %TIME%] Server crashed or stopped!
echo [%DATE% %TIME%] Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto restart
