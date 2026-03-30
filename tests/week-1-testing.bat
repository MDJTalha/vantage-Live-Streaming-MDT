@echo off
REM VANTAGE Week 1 Testing Script - Windows Version
REM Run all critical tests to verify Phase 1 implementation

echo ========================================
echo   VANTAGE Phase 1 Testing Suite
echo ========================================
echo.

REM Configuration
set API_URL=http://localhost:4000
set TEST_EMAIL=test@vantage.live
set TEST_PASSWORD=TestPassword123!

echo Test 1: API Health Check
echo ----------------------------------------
curl -s -o nul -w "%%{http_code}" "%API_URL%/health" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo [PASS] API health check passed
) else (
    echo [FAIL] API health check failed
)
echo.

echo Test 2: User Registration
echo ----------------------------------------
curl -X POST "%API_URL%/api/v1/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"%TEST_PASSWORD%\",\"name\":\"Test User\"}"
echo.
echo Check response above for "success":true
echo.

echo Test 3: MFA Generation (requires auth token)
echo ----------------------------------------
echo Run manually with access token:
echo curl -X POST %API_URL%/api/v1/auth/mfa/generate -H "Authorization: Bearer YOUR_TOKEN"
echo.

echo Test 4: Rate Limiting
echo ----------------------------------------
echo Making 6 login attempts with wrong password...
for /l %%i in (1,1,6) do (
    echo Attempt %%i
    curl -X POST "%API_URL%/api/v1/auth/login" ^
      -H "Content-Type: application/json" ^
      -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"WrongPassword\"}"
    echo.
)
echo 6th attempt should return 429 Too Many Requests
echo.

echo Test 5: CSRF Token
echo ----------------------------------------
curl -X GET "%API_URL%/api/v1/csrf-token"
echo.

echo Test 6: Monitoring Stack
echo ----------------------------------------
echo Checking Prometheus...
curl -s -o nul -w "%%{http_code}" "http://localhost:9090/-/healthy" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo [PASS] Prometheus is healthy
) else (
    echo [WARN] Prometheus not accessible
    echo Start with: docker-compose -f docker-compose.monitoring.yml up -d
)

echo Checking Grafana...
curl -s -o nul -w "%%{http_code}" "http://localhost:3001/api/health" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo [PASS] Grafana is healthy
) else (
    echo [WARN] Grafana not accessible
)
echo.

echo ========================================
echo   Test Summary
echo ========================================
echo.
echo Tests Completed
echo API URL: %API_URL%
echo.
echo Next Steps:
echo 1. Run database migrations: cd apps/api ^&^& npx prisma migrate dev
echo 2. Install Electron: cd apps\desktop ^&^& npm install
echo 3. Start monitoring: docker-compose -f docker-compose.monitoring.yml up -d
echo.
echo ========================================

pause
