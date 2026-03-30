@echo off
REM ========================================
REM   VANTAGE - Quick Fix for Login Issue
REM ========================================

echo.
echo ========================================
echo   Fixing Login Crash Issue
echo ========================================
echo.

REM Step 1: Update .env.local with secure values
echo [1/3] Updating environment configuration...

cd apps\api

REM Backup old .env.local
copy .env.local .env.local.backup >nul 2>&1

REM Create new .env.local with proper values
(
echo # VANTAGE Environment Configuration
echo NODE_ENV=development
echo.
echo # Database
echo DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage?schema=public
echo.
echo # Redis
echo REDIS_URL=redis://localhost:6379
echo REDIS_PASSWORD=
echo.
echo # Authentication - STRONG SECRET (32+ characters)
echo JWT_SECRET=vantage-super-secure-jwt-key-2026-change-in-production-abc123xyz
echo JWT_EXPIRES_IN=7d
echo REFRESH_TOKEN_EXPIRES_IN=30d
echo.
echo # Encryption Key - 64 hex characters (32 bytes)
echo ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
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

REM Step 2: Check if PostgreSQL is running
echo [2/3] Checking database connection...

REM Try to connect to PostgreSQL
psql -U postgres -c "\l" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL is running
) else (
    echo ⚠ PostgreSQL is NOT running
    echo.
    echo Please start PostgreSQL:
    echo   1. Open pgAdmin or PostgreSQL service
    echo   2. Create database: vantage
    echo   3. Create user: vantage with password: vantage_password
    echo   4. Grant all privileges on database to vantage
    echo.
    echo OR use the default connection string in .env.local
)

REM Step 3: Check if Redis is running
echo.
echo [3/3] Checking Redis connection...

redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Redis is running
) else (
    echo ⚠ Redis is NOT running
    echo.
    echo Please start Redis:
    echo   1. Download Redis for Windows from GitHub
    echo   2. Or use WSL: redis-server
    echo   3. Or install via Chocolatey: choco install redis-64
)

echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Make sure PostgreSQL is running on port 5432
echo 2. Make sure Redis is running on port 6379
echo 3. Run database migrations:
echo    cd apps\api
echo    npx prisma migrate dev
echo    npx prisma generate
echo.
echo 4. Restart the API server:
echo    npm run dev
echo.
echo ========================================
echo.

cd ..\..

pause
