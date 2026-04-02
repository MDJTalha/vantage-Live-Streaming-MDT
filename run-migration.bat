@echo off
REM Run Prisma Migration Automatically
cd /d "%~dp0apps\api"

echo Running Prisma Migration...
node ..\..\node_modules\prisma\build\index.js migrate dev --name init --skip-generate --force-apply

echo.
echo Migration complete!
echo.
echo Generating Prisma Client...
node ..\..\node_modules\prisma\build\index.js generate

echo.
echo Setup complete!
pause
