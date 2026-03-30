@echo off
REM VANTAGE Executive Platform - Database Setup Script
REM For PostgreSQL 15 on Windows

set PGPATH=C:\Program Files\PostgreSQL\15\bin
set PGUSER=postgres
set PGPASSWORD=your_postgres_password
set DBNAME=vantage
set DBUSER=vantage
set DBPASSWORD=VantageExecutive2026!

echo ========================================
echo   VANTAGE Database Setup
echo ========================================
echo.

echo [1/5] Creating database user...
"%PGPATH%\psql.exe" -U %PGUSER% -c "CREATE USER %DBUSER% WITH PASSWORD '%DBPASSWORD%';"
echo.

echo [2/5] Creating database...
"%PGPATH%\psql.exe" -U %PGUSER% -c "CREATE DATABASE %DBNAME% OWNER %DBUSER%;"
echo.

echo [3/5] Granting privileges...
"%PGPATH%\psql.exe" -U %PGUSER% -c "GRANT ALL PRIVILEGES ON DATABASE %DBNAME% TO %DBUSER%;"
echo.

echo [4/5] Creating extensions...
"%PGPATH%\psql.exe" -U %PGUSER% -d %DBNAME% -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
echo.

echo [5/5] Verifying setup...
"%PGPATH%\psql.exe" -U %PGUSER% -d %DBNAME% -c "\du"
"%PGPATH%\psql.exe" -U %PGUSER% -d %DBNAME% -c "\l"
echo.

echo ========================================
echo   Database Setup Complete!
echo ========================================
echo.
echo Connection String:
echo postgresql://%DBUSER%:%DBPASSWORD%@localhost:5432/%DBNAME%
echo.
echo Next steps:
echo 1. Copy connection string to .env file
echo 2. Run: npx prisma migrate deploy
echo 3. Run: npx prisma generate
echo.
pause
