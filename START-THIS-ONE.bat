@echo off
title VANTAGE Server - MUST KEEP OPEN
color 0A

echo.
echo ==================================================
echo   VANTAGE Development Server
echo ==================================================
echo.
echo INSTALLING DEPENDENCIES (first time only)...
echo.

cd /d "%~dp0apps\web"

call npm install

echo.
echo ==================================================
echo Starting server...
echo ==================================================
echo.
echo Server will be at: http://localhost:3000
echo.
echo !!! THIS WINDOW MUST STAY OPEN !!!
echo.
echo Do NOT close this window!
echo Minimize it if needed.
echo.
echo Server starting...
echo.

call npm run dev

echo.
echo Server stopped.
pause
