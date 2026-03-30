@echo off
setlocal enabledelayedexpansion

:: ============================================
::   VANTAGE - Quick Start (Simple & Reliable)
::   Version: 2.1.0
:: ============================================

cd /d %~dp0

cls
echo.
echo ============================================
echo   VANTAGE Platform - Starting...
echo ============================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not installed!
    pause
    exit /b 1
)

:: Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local...
    copy ".env.example" ".env.local" >nul
)

:: Start Docker (if available)
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Docker services...
    docker compose up -d postgres redis >nul 2>&1
    if %errorlevel% neq 0 (
        docker-compose up -d postgres redis >nul 2>&1
    )
    echo Waiting for database... (10 seconds)
    timeout /t 10 /nobreak >nul
)

echo.
echo ============================================
echo   Starting Servers...
echo ============================================
echo.

:: Start API in background
echo [1/2] Starting API Server...
cd apps\api
start /B npm run dev
cd ..\..

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Start Web in background  
echo [2/2] Starting Web Frontend...
cd apps\web
start /B npm run dev
cd ..\..

:: Wait for servers to start
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   Servers Started!
echo ============================================
echo.
echo   Web App:  http://localhost:3000
echo   API:      http://localhost:4000
echo.
echo   Demo: admin@vantage.live / admin123
echo.
echo ============================================
echo.
echo Servers are running in background.
echo.
echo To stop: Press Ctrl+C or close this window
echo.

:: Keep window open and show status
:loop
timeout /t 30 /nobreak >nul
goto loop
