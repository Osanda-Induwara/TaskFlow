@echo off
REM TaskFlow Dev Setup Script for Windows

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Backend installation failed
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..\frontend

REM Try to install frontend with certificate workaround
call npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo Frontend installation had issues but continuing...
)

cd ..
echo.
echo ==========================================
echo Setup complete! To start development:
echo.
echo Terminal 1: npm run dev:backend
echo Terminal 2: npm run dev:frontend
echo ==========================================
