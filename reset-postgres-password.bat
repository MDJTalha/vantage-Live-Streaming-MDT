@echo off
REM ============================================
REM   PostgreSQL Password Reset Script
REM ============================================
echo.
echo ============================================
echo   PostgreSQL Password Reset
echo ============================================
echo.

set PGINSTALL=C:\Program Files\PostgreSQL\15
set PGDATA=%PGINSTALL%\data

echo Step 1: Stopping PostgreSQL service...
net stop postgresql-x64-15 2>nul
if %errorlevel% neq 0 (
    echo Service might not be running or named differently
    echo Please stop PostgreSQL manually from Services (services.msc)
)
echo.

echo Step 2: Editing pg_hba.conf...
echo.
echo Opening pg_hba.conf in Notepad...
echo.
echo FIND THIS LINE:
echo   host    all    all    127.0.0.1/32    scram-sha-256
echo.
echo CHANGE TO:
echo   host    all    all    127.0.0.1/32    trust
echo.
echo Save and close Notepad when done.
echo.
pause

notepad %PGDATA%\pg_hba.conf

echo.
echo Step 3: Starting PostgreSQL temporarily...
net start postgresql-x64-15 2>nul
if %errorlevel% neq 0 (
    echo Please start PostgreSQL manually from Services
)
echo.

echo Step 4: Resetting password...
echo.
set /p NEWPASS="Enter new password for postgres user: "
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD '%NEWPASS%';"
echo.

echo Step 5: Stopping PostgreSQL again...
net stop postgresql-x64-15 2>nul
echo.

echo Step 6: Reverting pg_hba.conf...
echo.
echo Open pg_hba.conf again and CHANGE BACK:
echo   FROM: host    all    all    127.0.0.1/32    trust
echo   TO:   host    all    all    127.0.0.1/32    scram-sha-256
echo.
pause

notepad %PGDATA%\pg_hba.conf

echo.
echo Step 7: Starting PostgreSQL with new password...
net start postgresql-x64-15 2>nul
echo.

echo ============================================
echo   Password Reset Complete!
echo ============================================
echo.
echo Your new PostgreSQL password is: %NEWPASS%
echo.
echo Now run:
echo   cd c:\Projects\Live-Streaming-\apps\api
echo   npm run db:migrate
echo   npm run db:seed
echo   cd c:\Projects\Live-Streaming-
echo   npm run dev
echo.
pause
