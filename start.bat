@echo off
echo ========================================
echo   VANTAGE - Starting Development Server
echo ========================================
echo.

cd /d "%~dp0apps\web"

echo Starting Next.js development server...
echo.
echo Server will be available at:
echo   - Local:    http://localhost:3000
echo   - Network:  http://YOUR_IP:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev
