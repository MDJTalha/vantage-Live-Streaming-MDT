@echo off
echo ============================================
echo   VANTAGE Platform - Setup Script
echo ============================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js >= 20.0.0
    echo Visit: https://nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js is installed
echo.

:: Check if Docker is installed
echo [2/6] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed. Please install Docker Desktop
    echo Visit: https://docker.com
    pause
    exit /b 1
)
echo OK: Docker is installed
echo.

:: Install root dependencies
echo [3/6] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo OK: Root dependencies installed
echo.

:: Copy environment file
echo [4/6] Setting up environment variables...
if not exist .env.local (
    copy .env.example .env.local
    echo OK: Created .env.local from .env.example
) else (
    echo OK: .env.local already exists
)
echo.

:: Start Docker containers
echo [5/6] Starting Docker containers (PostgreSQL, Redis, Coturn)...
call docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker containers
    echo Make sure Docker Desktop is running
    pause
    exit /b 1
)
echo OK: Docker containers started
echo.

:: Wait for PostgreSQL to be ready
echo [6/6] Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

:: Setup API and database
echo.
echo ============================================
echo   Setting up API and Database
echo ============================================
echo.

cd apps\api

:: Install API dependencies
echo Installing API dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install API dependencies
    pause
    exit /b 1
)
echo OK: API dependencies installed
echo.

:: Generate Prisma Client
echo Generating Prisma Client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo OK: Prisma Client generated
echo.

:: Run database migrations
echo Running database migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo WARNING: Migration might have already run or failed
)
echo OK: Database migrations completed
echo.

:: Seed database
echo Seeding database with demo data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo WARNING: Seeding might have already been done or failed
)
echo OK: Database seeded
echo.

:: Go back to root
cd c:\Projects\Live-Streaming-

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo You can now start the development servers:
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
