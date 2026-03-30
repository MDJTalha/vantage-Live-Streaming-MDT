@echo off
REM ============================================
REM   VANTAGE Platform - Local PostgreSQL Setup
REM ============================================
echo.
echo ============================================
echo   VANTAGE Platform - Setup (Local PostgreSQL)
echo ============================================
echo.

REM Add PostgreSQL to PATH
set "PATH=C:\Program Files\PostgreSQL\15\bin;%PATH%"

REM Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    pause
    exit /b 1
)
echo OK: Node.js %node --version%
echo.

REM Check PostgreSQL
echo [2/8] Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    pause
    exit /b 1
)
echo OK: PostgreSQL found
echo.

REM Install root dependencies
echo [3/8] Installing root dependencies...
call npm install --silent
if %errorlevel% neq 0 (
    echo WARNING: Root dependencies may have failed
)
echo OK: Root dependencies
echo.

REM Setup environment
echo [4/8] Setting up environment...
if not exist .env.local (
    copy .env.example .env.local >nul
    echo Created .env.local
) else (
    echo .env.local exists
)
echo.
echo IMPORTANT: Edit .env.local and set your PostgreSQL password
echo DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vantage
echo.
set /p CONTINUE="Have you updated .env.local? (y/n): "
if /i not "%CONTINUE%"=="y" (
    echo Please update .env.local first
    pause
    exit /b 1
)
echo.

REM Create database
echo [5/8] Creating database...
set /p PGPASSWORD="Enter PostgreSQL password: "
set PGPASSWORD=%PGPASSWORD%
psql -U postgres -h localhost -c "CREATE DATABASE vantage;" >nul 2>&1
if %errorlevel% neq 0 (
    echo Database may already exist, continuing...
)
psql -U postgres -h localhost -c "CREATE USER vantage WITH PASSWORD 'vantage_password';" >nul 2>&1
if %errorlevel% neq 0 (
    echo User may already exist, continuing...
)
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;" >nul 2>&1
echo OK: Database ready
echo.

REM Install API dependencies
echo [6/8] Installing API dependencies...
cd apps\api
call npm install --silent
echo OK: API dependencies
echo.

REM Generate Prisma Client
echo [7/8] Generating Prisma Client...
set DATABASE_URL=postgresql://vantage:vantage_password@localhost:5432/vantage?schema=public
call npm run db:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo OK: Prisma Client generated
echo.

REM Run migrations
echo [8/8] Running database migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo WARNING: Migrations may have failed
)
echo.

REM Seed database
set /p SEED="Seed database with demo data? (y/n): "
if /i "%SEED%"=="y" (
    call npm run db:seed
    echo OK: Database seeded
)
echo.

cd c:\Projects\Live-Streaming-

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start development servers:
echo   npm run dev
echo.
echo Access points:
echo   - Web App: http://localhost:3000
echo   - API:     http://localhost:4000
echo   - WebSocket: ws://localhost:4000
echo.
echo Demo credentials:
echo   - Admin: admin@vantage.live / admin123
echo   - Host:  host@vantage.live / host123
echo   - User:  user@vantage.live / user123
echo.
pause
