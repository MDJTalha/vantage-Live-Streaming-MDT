@echo off
setlocal enabledelayedexpansion

:: ============================================
::   VANTAGE - Fix Login/Signup Errors
::   Fixes "Failed to fetch" error
:: ============================================

cd /d %~dp0

cls
echo.
echo ============================================
echo   VANTAGE - Login Fix Tool
echo ============================================
echo.

echo This script will:
echo   1. Stop all running servers
echo   2. Fix API dependencies
echo   3. Generate Prisma Client
echo   4. Check environment files
echo   5. Start API server
echo   6. Test API health
echo.
echo Press any key to start...
pause >nul
cls

:: ============================================
:: Step 1: Stop All Servers
:: ============================================
echo [1/7] Stopping all servers...
taskkill /F /FI "WINDOWTITLE eq VANTAGE*" /T >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo OK: Servers stopped
echo.

:: ============================================
:: Step 2: Fix API Dependencies
:: ============================================
echo [2/7] Fixing API dependencies...
cd apps\api

if exist "node_modules" (
    echo Cleaning node_modules...
    rmdir /s /q node_modules >nul 2>&1
)

echo Installing dependencies...
call npm install >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Dependencies installed
) else (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

:: ============================================
:: Step 3: Generate Prisma Client
:: ============================================
echo [3/7] Generating Prisma Client...
call npm run db:generate
if %errorlevel% equ 0 (
    echo OK: Prisma Client generated
) else (
    echo WARNING: Prisma generation had issues
)
cd ..\..
echo.

:: ============================================
:: Step 4: Check Environment Files
:: ============================================
echo [4/7] Checking environment files...

if not exist ".env.local" (
    echo Creating root .env.local...
    copy ".env.example" ".env.local" >nul
)

if not exist "apps\api\.env" (
    echo Creating API .env...
    copy "apps\api\.env.example" "apps\api\.env" >nul 2>&1
    echo WARNING: Please update apps\api\.env with your database password!
)

if not exist "apps\web\.env.local" (
    echo Creating Web .env.local...
    copy "apps\web\.env.example" "apps\web\.env.local" >nul
)

echo OK: Environment files checked
echo.

:: ============================================
:: Step 5: Start Docker (if available)
:: ============================================
echo [5/7] Starting database...

docker ps >nul 2>&1
if %errorlevel% equ 0 (
    docker ps --format "{{.Names}}" | findstr vantage-postgres >nul 2>&1
    if %errorlevel% neq 0 (
        echo Starting PostgreSQL...
        docker compose up -d postgres redis >nul 2>&1
        if %errorlevel% neq 0 (
            docker-compose up -d postgres redis >nul 2>&1
        )
        echo Waiting for database... (15 seconds)
        timeout /t 15 /nobreak >nul
    ) else (
        echo OK: Database already running
    )
) else (
    echo SKIP: Docker not available
    echo Make sure PostgreSQL is running manually
)
echo.

:: ============================================
:: Step 6: Start API Server
:: ============================================
echo [6/7] Starting API Server...
echo.

cd apps\api
start "VANTAGE API" cmd.exe /k "echo Starting API Server... && npm run dev"
cd ..\..

echo Waiting for API to start... (10 seconds)
timeout /t 10 /nobreak >nul
echo.

:: ============================================
:: Step 7: Test API Health
:: ============================================
echo [7/7] Testing API health...
echo.

curl -s http://localhost:4000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: API is running!
    echo.
    echo Testing health endpoint...
    curl http://localhost:4000/health
    echo.
    echo.
) else (
    echo WARNING: API may not be fully ready yet
    echo Check the API window for errors
)

:: ============================================
:: Summary
:: ============================================
cls
echo.
echo ============================================
echo   Fix Complete!
echo ============================================
echo.
echo Two windows should be open:
echo   1. VANTAGE API (Port 4000)
echo   2. This status window
echo.
echo Next Steps:
echo   1. Check API window for "Running" message
echo   2. Start Web server: npm run dev (in apps\web)
echo   3. Open browser: http://localhost:3000
echo   4. Try login: admin@vantage.live / admin123
echo.
echo API Health: http://localhost:4000/health
echo.
echo ============================================
echo.
echo If API shows errors, check:
echo   - Database is running (Docker or local)
echo   - apps\api\.env has correct DATABASE_URL
echo   - Port 4000 is not in use
echo.
echo Full troubleshooting guide:
echo   FIX_LOGIN_ERROR.md
echo.
pause
