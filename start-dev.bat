@echo off
setlocal enabledelayedexpansion

:: ============================================
::   VANTAGE - Development Server Starter
::   Version: 2.2.0 (Most Reliable)
:: ============================================

cd /d %~dp0

cls
echo.
echo ============================================
echo   VANTAGE Platform - Development Mode
echo ============================================
echo.

:: Step 1: Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo OK: %NODE_VER%
echo.

:: Step 2: Check Dependencies
echo [2/6] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
) else (
    echo OK: Dependencies installed
)
echo.

:: Step 3: Setup Environment
echo [3/6] Setting up environment...
if not exist ".env.local" (
    echo Creating .env.local...
    copy ".env.example" ".env.local" >nul
    echo WARNING: Update .env.local with your credentials!
) else (
    echo OK: .env.local exists
)
echo.

:: Step 4: Start Docker
echo [4/6] Starting infrastructure...
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    docker ps --format "{{.Names}}" | findstr vantage-postgres >nul 2>&1
    if %errorlevel% neq 0 (
        echo Starting PostgreSQL and Redis...
        docker compose up -d postgres redis >nul 2>&1
        if %errorlevel% neq 0 (
            docker-compose up -d postgres redis >nul 2>&1
        )
        echo Waiting for database... (15 seconds)
        timeout /t 15 /nobreak >nul
    ) else (
        echo OK: Database running
    )
) else (
    echo SKIP: Docker not available
)
echo.

:: Step 5: Build UI
echo [5/6] Building UI package...
cd packages\ui
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: UI built
) else (
    echo WARNING: UI build skipped
)
cd ..\..
echo.

:: Step 6: Start Servers
echo [6/6] Starting servers...
echo.

:: Start API Server
echo Starting API Server (Port 4000)...
cd apps\api
start /B npm run dev > ..\..\logs\api.log 2>&1
if %errorlevel% equ 0 (
    echo OK: API starting...
) else (
    echo ERROR: Failed to start API
)
cd ..\..

:: Wait for API
timeout /t 3 /nobreak >nul

:: Start Web Frontend
echo Starting Web Frontend (Port 3000)...
cd apps\web
start /B npm run dev > ..\..\logs\web.log 2>&1
if %errorlevel% equ 0 (
    echo OK: Web starting...
) else (
    echo ERROR: Failed to start Web
)
cd ..\..

:: Wait for servers
timeout /t 5 /nobreak >nul

:: Show success message
cls
echo.
echo ============================================
echo   VANTAGE Servers Running!
echo ============================================
echo.
echo   Web App:  http://localhost:3000
echo   API:      http://localhost:4000
echo   WebSocket: ws://localhost:4000
echo.
echo   Demo Credentials:
echo   - admin@vantage.live / admin123
echo   - host@vantage.live / host123
echo   - user@vantage.live / user123
echo.
echo ============================================
echo.
echo Servers are running in background.
echo.
echo To view logs:
echo   - API:  logs\api.log
echo   - Web:  logs\web.log
echo.
echo To stop servers:
echo   - Close this window
echo   - Or press Ctrl+C then type 'Y'
echo.
echo ============================================
echo.

:: Create logs directory if needed
if not exist "logs" mkdir logs

:: Keep window open
:monitor
timeout /t 30 /nobreak >nul
goto monitor
