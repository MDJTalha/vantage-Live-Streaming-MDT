@echo off
echo ============================================
echo   Setting up VANTAGE PostgreSQL Database
echo ============================================
echo.

cd /d "C:\Program Files\PostgreSQL\15\bin"

echo [1/3] Creating vantage database user...
set PGPASSWORD=postgres
psql.exe -U postgres -c "DO $$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vantage') THEN CREATE ROLE vantage WITH LOGIN PASSWORD 'dev_password_change_me'; END IF; END$$;"
echo.

echo [2/3] Creating vantage database...
psql.exe -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'vantage'" | findstr "1" >nul
if %errorlevel% neq 0 (
    psql.exe -U postgres -c "CREATE DATABASE vantage OWNER vantage;"
    echo Database created successfully
) else (
    echo Database already exists
)
echo.

echo [3/3] Granting privileges...
psql.exe -U postgres -d vantage -c "GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;"
psql.exe -U postgres -d vantage -c "GRANT ALL ON SCHEMA public TO vantage;"
echo.

echo ============================================
echo   Database Setup Complete!
echo ============================================
echo User: vantage
echo Password: dev_password_change_me
echo Database: vantage
echo ============================================
pause
