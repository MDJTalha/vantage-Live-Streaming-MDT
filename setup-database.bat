@echo off
REM ========================================
REM   VANTAGE - Database Setup Script
REM ========================================

echo.
echo ========================================
echo   Setting Up VANTAGE Database
echo ========================================
echo.

REM Check if psql is available
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ PostgreSQL is NOT installed or not in PATH
    echo.
    echo Please install PostgreSQL from:
    echo   https://www.postgresql.org/download/windows/
    echo.
    echo Or use Docker:
    echo   docker run -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15
    echo.
    pause
    exit /b 1
)

echo [1/4] Creating database user...
psql -U postgres -c "CREATE USER vantage WITH PASSWORD 'vantage_password';" 2>nul
if %errorlevel% equ 0 (
    echo ✓ User created
) else (
    echo ⚠ User might already exist (continuing...)
)

echo.
echo [2/4] Creating database...
psql -U postgres -c "CREATE DATABASE vantage OWNER vantage;" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Database created
) else (
    echo ⚠ Database might already exist (continuing...)
)

echo.
echo [3/4] Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;" 2>nul
echo ✓ Privileges granted

echo.
echo [4/4] Running Prisma migrations...
cd apps\api

REM Check if .env.local exists
if not exist .env.local (
    echo ⚠ .env.local not found, creating...
    copy ..\..\.env.example .env.local
)

REM Generate Prisma Client
echo.
echo Generating Prisma Client...
npx prisma generate

REM Run migrations
echo.
echo Running database migrations...
npx prisma migrate dev --name init

echo.
echo ========================================
echo   Database Setup Complete!
echo ========================================
echo.
echo Database: vantage
echo Username: vantage
echo Password: vantage_password
echo.
echo You can now start the API server:
echo   npm run dev
echo.
echo ========================================
echo.

cd ..\..
pause
