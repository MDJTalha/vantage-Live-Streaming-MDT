@echo off
REM ========================================
REM   VANTAGE - Start with Rancher Desktop
REM ========================================

echo.
echo ========================================
echo   Starting VANTAGE with Rancher Desktop
echo ========================================
echo.

REM Define Docker path
set DOCKER_PATH=C:\Program Files\Rancher Desktop\resources\resources\win32\bin
set DOCKER=%DOCKER_PATH%\docker.exe
set DOCKER_COMPOSE=%DOCKER_PATH%\docker-compose.exe

REM Check if Rancher Desktop docker exists
if not exist "%DOCKER%" (
    echo ERROR: Rancher Desktop docker not found at:
    echo   %DOCKER%
    echo.
    echo Please ensure Rancher Desktop is installed and running.
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking Rancher Desktop status...
"%DOCKER%" --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Rancher Desktop is accessible
) else (
    echo ✗ Rancher Desktop is not responding
    echo.
    echo Please:
    echo   1. Open Rancher Desktop application
    echo   2. Wait for Kubernetes to start (if enabled)
    echo   3. Try again
    echo.
    pause
    exit /b 1
)

echo.
echo [2/5] Starting PostgreSQL and Redis...
cd /d %~dp0

REM Try docker-compose first, fall back to docker compose
"%DOCKER_COMPOSE%" up -d postgres redis 2>nul
if %errorlevel% neq 0 (
    "%DOCKER%" compose up -d postgres redis 2>nul
    if %errorlevel% neq 0 (
        echo ✗ Failed to start containers
        echo.
        echo Please check Rancher Desktop is running with dockerd (moby) enabled
        echo.
        pause
        exit /b 1
    )
)

echo ✓ Containers starting...
timeout /t 5 /nobreak >nul

echo.
echo [3/5] Verifying database status...
"%DOCKER_COMPOSE%" ps postgres 2>nul | findstr "Up" >nul
if %errorlevel% neq 0 (
    "%DOCKER%" compose ps postgres 2>nul | findstr "Up" >nul
)

if %errorlevel% equ 0 (
    echo ✓ PostgreSQL is running
) else (
    echo ⚠ PostgreSQL status unknown (may still be starting)
)

"%DOCKER_COMPOSE%" ps redis 2>nul | findstr "Up" >nul
if %errorlevel% neq 0 (
    "%DOCKER%" compose ps redis 2>nul | findstr "Up" >nul
)

if %errorlevel% equ 0 (
    echo ✓ Redis is running
) else (
    echo ⚠ Redis status unknown (may still be starting)
)

echo.
echo [4/5] Running database migrations...
cd apps\api

REM Check if .env.local has correct database URL
findstr /C:"DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage" .env.local >nul
if %errorlevel% neq 0 (
    echo ⚠ Database URL might need updating in .env.local
    echo   Expected: postgresql://vantage:vantage_password@localhost:5432/vantage
)

REM Generate Prisma Client
npx prisma generate

REM Run migrations
echo.
echo Running migrations...
npx prisma migrate dev

if %errorlevel% equ 0 (
    echo ✓ Database migrations complete
) else (
    echo ⚠ Migrations failed - check database connection
    echo   Make sure PostgreSQL container is healthy
)

echo.
echo [5/5] Starting API Server...
cd ..\..

REM Start API server
start "VANTAGE API Server" cmd /k "cd apps\api && npm run dev"

timeout /t 3 /nobreak >nul

start "VANTAGE Web App" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo   VANTAGE Platform Starting!
echo ========================================
echo.
echo Services:
echo   - PostgreSQL:    localhost:5432
echo   - Redis:         localhost:6379
echo   - API Server:    http://localhost:4000
echo   - Web App:       http://localhost:3000
echo.
echo Wait 30 seconds for services to initialize.
echo Then open: http://localhost:3000
echo.
echo To stop all services:
echo   "%DOCKER_COMPOSE%" down
echo.
echo ========================================
echo.
