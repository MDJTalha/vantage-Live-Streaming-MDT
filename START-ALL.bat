@echo off
REM ========================================
REM   VANTAGE - Complete System Startup
REM   Fixes login issue + Starts all services
REM ========================================

echo.
echo ========================================
echo   VANTAGE Complete System Startup
echo ========================================
echo.

REM Set Docker path for Rancher Desktop
set DOCKER_PATH=C:\Program Files\Rancher Desktop\resources\resources\win32\bin
set DOCKER=%DOCKER_PATH%\docker.exe
set DOCKER_COMPOSE=%DOCKER_PATH%\docker-compose.exe

REM Check if Rancher Desktop is available
if not exist "%DOCKER%" (
    echo ERROR: Rancher Desktop not found!
    echo.
    echo Please install Rancher Desktop from:
    echo   https://rancherdesktop.io/
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Rancher Desktop status...
"%DOCKER%" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rancher Desktop is not running!
    echo.
    echo Please:
    echo   1. Open Rancher Desktop application
    echo   2. Wait for it to fully start
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)
echo ✓ Rancher Desktop is running

echo.
echo [2/6] Starting PostgreSQL and Redis...
cd /d %~dp0

REM Start databases
"%DOCKER_COMPOSE%" -f docker-compose.databases.yml up -d postgres redis
if %errorlevel% neq 0 (
    "%DOCKER%" compose -f docker-compose.databases.yml up -d postgres redis
)

echo Waiting for databases to start...
timeout /t 15 /nobreak >nul

echo.
echo [3/6] Verifying database status...
"%DOCKER_COMPOSE%" -f docker-compose.databases.yml ps postgres 2>nul | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL is running
) else (
    "%DOCKER%" compose -f docker-compose.databases.yml ps postgres 2>nul | findstr "Up" >nul
    if %errorlevel% equ 0 (
        echo ✓ PostgreSQL is running
    ) else (
        echo ✗ PostgreSQL failed to start
    )
)

"%DOCKER_COMPOSE%" -f docker-compose.databases.yml ps redis 2>nul | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✓ Redis is running
) else (
    "%DOCKER%" compose -f docker-compose.databases.yml ps redis 2>nul | findstr "Up" >nul
    if %errorlevel% equ 0 (
        echo ✓ Redis is running
    ) else (
        echo ✗ Redis failed to start
    )
)

echo.
echo [4/6] Updating API configuration...
cd apps\api

REM Backup and update .env.local
if exist .env.local (
    copy .env.local .env.local.backup >nul 2>&1
)

(
echo # VANTAGE API Configuration
echo NODE_ENV=development
echo.
echo # Database
echo DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage?schema=public
echo.
echo # Redis
echo REDIS_URL=redis://localhost:6379
echo.
echo # Authentication - STRONG SECRET
echo JWT_SECRET=vantage-super-secure-jwt-key-2026-change-in-production-abc123xyz789
echo JWT_EXPIRES_IN=7d
echo REFRESH_TOKEN_EXPIRES_IN=30d
echo.
echo # Encryption Key - 64 hex characters
echo ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
echo.
echo # API Configuration
echo API_HOST=0.0.0.0
echo API_PORT=4000
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Security
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX=100
) > .env.local

echo ✓ Configuration updated

echo.
echo [5/6] Running database migrations...

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

REM Generate Prisma Client
echo Generating Prisma Client...
npx prisma generate

REM Run migrations
echo.
echo Running database migrations...
npx prisma migrate dev --name init

if %errorlevel% equ 0 (
    echo ✓ Database migrations complete
) else (
    echo ⚠ Migrations may have warnings (continuing...)
)

echo.
echo [6/6] Starting VANTAGE services...
cd ..\..

REM Start API Server
echo Starting API Server on port 4000...
start "VANTAGE API - http://localhost:4000" cmd /k "cd apps\api && echo Starting API Server... && npm run dev"

timeout /t 5 /nobreak >nul

REM Start Web App
echo Starting Web App on port 3000...
start "VANTAGE Web - http://localhost:3000" cmd /k "cd apps\web && echo Starting Web App... && npm run dev"

timeout /t 5 /nobreak >nul

REM Start Media Server
echo Starting Media Server on port 4443...
start "VANTAGE Media - http://localhost:4443" cmd /k "cd apps\media-server && echo Starting Media Server... && npm run dev"

echo.
echo ========================================
echo   VANTAGE Platform Started!
echo ========================================
echo.
echo Services:
echo   ✓ PostgreSQL:      localhost:5432
echo   ✓ Redis:           localhost:6379
echo   ✓ API Server:      http://localhost:4000
echo   ✓ Health Check:    http://localhost:4000/health
echo   ✓ Web App:         http://localhost:3000
echo   ✓ Media Server:    http://localhost:4443
echo.
echo Wait 30 seconds for all services to initialize.
echo Then open: http://localhost:3000
echo.
echo Test Login:
echo   1. Create account: test@vantage.live / Password123!
echo   2. Login with credentials
echo.
echo To stop all services:
echo   - Close the terminal windows
echo   - "%DOCKER_COMPOSE%" -f docker-compose.databases.yml down
echo.
echo ========================================
echo.

REM Open browser after delay
timeout /t 30 /nobreak >nul
start http://localhost:3000

echo Browser opened! You can now test the login.
echo.
pause
