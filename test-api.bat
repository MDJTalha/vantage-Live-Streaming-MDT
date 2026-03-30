@echo off
REM ========================================
REM   VANTAGE - Test API Without Database
REM ========================================

echo.
echo ========================================
echo   Testing API Server
echo ========================================
echo.

REM Start API server in background
echo Starting API server...
start "VANTAGE API Test" cmd /k "cd apps\api && npm run dev"

echo Waiting 15 seconds for API to start...
timeout /t 15 /nobreak >nul

echo.
echo [1/3] Testing health endpoint...
curl -s http://localhost:4000/health
if %errorlevel% equ 0 (
    echo ✓ Health endpoint responding
) else (
    echo ✗ Health endpoint NOT responding
    echo.
    echo Check API server logs for errors
)

echo.
echo [2/3] Testing API root...
curl -s http://localhost:4000/api/v1
if %errorlevel% equ 0 (
    echo ✓ API root responding
) else (
    echo ✗ API root NOT responding
)

echo.
echo [3/3] Testing login endpoint (should fail without DB)...
curl -s -X POST http://localhost:4000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test\"}"
echo.

echo.
echo ========================================
echo   Test Complete
echo ========================================
echo.
echo If health endpoint works but login fails:
echo   → Database is not connected
echo   → Run: setup-database.bat
echo.
echo If nothing works:
echo   → Check Node.js is installed
echo   → Check npm install was run
echo   → Check .env.local configuration
echo.
echo ========================================
echo.

pause
