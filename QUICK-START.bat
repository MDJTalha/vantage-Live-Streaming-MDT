@echo off
title VANTAGE - Quick Start
color 0A

echo.
echo ==========================================
echo   VANTAGE Live Streaming Platform
echo ==========================================
echo.
echo Checking Node.js version...
node --version
echo.

:: Check if Node version is 20.x
node -e "if(process.version.split('.')[0].replace('v','') !== '20') { console.log('ERROR: You need Node.js v20.x.x'); console.log('Current version:', process.version); console.log('Please install Node.js 20 LTS from https://nodejs.org'); pause; exit(1); }"

echo Node.js version OK!
echo.
echo Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo ==========================================
echo   Starting Servers...
echo ==========================================
echo.
echo Frontend: http://localhost:3000
echo API:      http://localhost:4000
echo.
echo Press Ctrl+C to stop all servers
echo.

call npm run dev

pause
