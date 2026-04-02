@echo off
REM PostgreSQL Database Setup for VANTAGE
REM Run this file as Administrator

echo ============================================
echo VANTAGE PostgreSQL Database Setup
echo ============================================
echo.

cd "C:\Program Files\PostgreSQL\15\bin"

echo Step 1: Creating database 'vantage'...
psql -U postgres -c "CREATE DATABASE vantage;" 2>nul || echo Database may already exist

echo Step 2: Creating user 'vantage'...
psql -U postgres -c "CREATE USER vantage WITH PASSWORD 'vantage_dev_password_2026';" 2>nul || echo User may already exist

echo Step 3: Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;" 2>nul

echo Step 4: Setting schema permissions...
psql -U postgres -d vantage -c "GRANT ALL ON SCHEMA public TO vantage;" 2>nul

echo.
echo ============================================
echo Database setup complete!
echo ============================================
echo.
echo Connection details:
echo   Host: localhost
echo   Port: 5432
echo   Database: vantage
echo   User: vantage
echo   Password: vantage_dev_password_2026
echo.
echo Next steps:
echo 1. Update .env.local with DATABASE_URL
echo 2. Run: npx prisma migrate dev
echo 3. Run: npx prisma generate
echo.
pause
