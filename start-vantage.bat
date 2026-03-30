@echo off
REM ========================================
REM   VANTAGE Platform - Complete Startup
REM ========================================
REM   This script starts all VANTAGE services
REM ========================================

echo.
echo ========================================
echo   Starting VANTAGE Platform
echo ========================================
echo.
echo Starting services...
echo.

REM Start API Server
echo [1/4] Starting VANTAGE API Server...
start "VANTAGE API - Port 4000" cmd /k "cd /d %~dp0apps\api && echo Starting API Server... && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Web App
echo [2/4] Starting VANTAGE Web App...
start "VANTAGE Web - Port 3000" cmd /k "cd /d %~dp0apps\web && echo Starting Web App... && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Media Server
echo [3/4] Starting VANTAGE Media Server...
start "VANTAGE Media - Port 4443" cmd /k "cd /d %~dp0apps\media-server && echo Starting Media Server... && npm run dev"
timeout /t 3 /nobreak >nul

REM Start AI Services
echo [4/4] Starting VANTAGE AI Services...
start "VANTAGE AI - Port 8000" cmd /k "cd /d %~dp0apps\ai-services && echo Starting AI Services... && npm run dev"

echo.
echo ========================================
echo   All Services Starting!
echo ========================================
echo.
echo Services will be available at:
echo   - API Server:      http://localhost:4000
echo   - Health Check:    http://localhost:4000/health
echo   - Web App:         http://localhost:3000
echo   - Media Server:    http://localhost:4443
echo   - AI Services:     http://localhost:8000
echo   - Grafana:         http://localhost:3001 (if Docker running)
echo.
echo Wait 30 seconds for all services to initialize.
echo.
echo To stop all services, close the terminal windows.
echo ========================================
echo.

REM Wait for services to initialize
echo Initializing services...
timeout /t 30 /nobreak

REM Check if API is responding
echo.
echo Checking API health...
curl -s http://localhost:4000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ API Server is responding!
) else (
    echo ⚠ API Server is still starting...
)

echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

REM Open web app in browser
start http://localhost:3000

echo.
echo ========================================
echo   VANTAGE Platform Ready!
echo ========================================
echo.
