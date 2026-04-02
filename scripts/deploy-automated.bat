@echo off
REM ============================================
REM VANTAGE Automated Deployment Script (Windows)
REM ============================================
REM This script automates deployment to GitHub and Vercel
REM ============================================

setlocal enabledelayedexpansion

REM Configuration
set REPO_NAME=MDJTalha/vantage-Live-Streaming-MDT
set VERCEL_PROJECT=vantage-live-streaming
set BRANCH=main

echo.
echo ╔════════════════════════════════════════╗
echo ║  VANTAGE Automated Deployment Script  ║
echo ╚════════════════════════════════════════╝
echo.

REM ============================================
REM Step 1: Pre-deployment Checks
REM ============================================
echo Step 1: Pre-deployment Checks
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)
echo [OK] Node.js installed: 
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    exit /b 1
)
echo [OK] npm installed: 
npm --version

REM Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed
    exit /b 1
)
echo [OK] Git installed: 
git --version

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Vercel CLI not found. Installing...
    npm install -g vercel
)
echo [OK] Vercel CLI installed
echo.

REM ============================================
REM Step 2: Build & Test
REM ============================================
echo Step 2: Build ^& Test
echo.

REM Install dependencies
echo Installing dependencies...
call npm ci --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma Client
    exit /b 1
)

REM Build web application
echo Building web application...
cd apps\web
call npm run build -- --no-lint
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    cd ..\..
    exit /b 1
)
cd ..\..

echo [OK] Build successful
echo.

REM ============================================
REM Step 3: Commit & Push to GitHub
REM ============================================
echo Step 3: Commit ^& Push to GitHub
echo.

REM Check for uncommitted changes
git status --porcelain | findstr /r "." >nul
if %errorlevel% equ 0 (
    echo Found uncommitted changes. Committing...
    git add -A
    git commit -m "chore: automated deployment %date% %time%"
)

REM Push to GitHub
echo Pushing to GitHub...
git push origin %BRANCH%
if %errorlevel% neq 0 (
    echo [ERROR] Failed to push to GitHub
    exit /b 1
)

echo [OK] Pushed to GitHub
echo.

REM ============================================
REM Step 4: Deploy to Vercel
REM ============================================
echo Step 4: Deploy to Vercel
echo.

REM Deploy to Vercel
echo Deploying to Vercel...
cd apps\web
call vercel --prod --yes
if %errorlevel% neq 0 (
    echo [ERROR] Failed to deploy to Vercel
    cd ..\..
    exit /b 1
)
cd ..\..

echo [OK] Deployed to Vercel
echo.

REM ============================================
REM Step 5: Post-deployment
REM ============================================
echo Step 5: Post-deployment
echo.

echo ╔════════════════════════════════════════╗
echo ║     Deployment Complete!              ║
echo ╚════════════════════════════════════════╝
echo.
echo Deployment Summary:
echo    • Repository: https://github.com/%REPO_NAME%
echo    • Production: https://%VERCEL_PROJECT%.vercel.app
echo    • Branch: %BRANCH%
echo    • Timestamp: %date% %time%
echo.
echo Quick Links:
echo    • GitHub: https://github.com/%REPO_NAME%/actions
echo    • Vercel: https://vercel.com/dashboard
echo.

endlocal
