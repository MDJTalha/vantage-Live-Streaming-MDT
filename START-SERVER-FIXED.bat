@echo off
title VANTAGE Server Diagnostic & Startup
color 0B

echo.
echo ==================================================
echo   VANTAGE - Complete Diagnostic and Startup
echo ==================================================
echo.

echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Install from nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js found
echo.

echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
echo OK: npm found
echo.

echo [3/6] Checking node_modules...
if not exist "node_modules" (
    echo WARNING: node_modules not found! Installing...
    call npm install
) else (
    echo OK: node_modules exists
)
echo.

echo [4/6] Checking Next.js installation...
if not exist "node_modules\next" (
    echo ERROR: Next.js not installed!
    echo Running npm install...
    call npm install
) else (
    echo OK: Next.js found
)
echo.

echo [5/6] Checking port 3000...
netstat -ano ^| findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 already in use!
    echo Kill existing process or use different port
    netstat -ano ^| findstr :3000
    echo.
    echo To kill process: taskkill /F /PID ^<PID^>
    pause
)
echo OK: Port 3000 is free
echo.

echo [6/6] Starting Next.js development server...
echo.
echo ================================================
echo Server starting...
echo This window MUST stay open for server to run
echo ================================================
echo.
echo Access at: http://localhost:3000
echo.

cd /d "%~dp0"
call npm run dev

echo.
echo Server stopped.
pause
