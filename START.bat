@echo off
title Admission Tracker - Starting...
color 0A

REM ---- Always run from the folder where this bat file lives ----
cd /d "%~dp0"

echo.
echo  ==========================================
echo   ADMISSION TRACKER - ONE CLICK START
echo  ==========================================
echo.

REM ---- Check if .env exists ----
if not exist "backend\.env" (
    echo  [SETUP] First time setup detected!
    echo.
    copy "backend\.env.example" "backend\.env" >nul
    echo  [!] ACTION REQUIRED: Open backend\.env and paste your MongoDB URI
    echo.
    echo  Your MongoDB URI looks like:
    echo  mongodb+srv://username:password@cluster.mongodb.net/admission_tracker
    echo.
    echo  Steps:
    echo   1. Go to mongodb.com ^> your cluster ^> Connect ^> Drivers
    echo   2. Copy the connection string
    echo   3. Open backend\.env in Notepad
    echo   4. Replace MONGODB_URI=... with your connection string
    echo   5. Save and run START.bat again
    echo.
    start notepad "backend\.env"
    pause
    exit /b
)

REM ---- Install backend deps ----
echo  [1/3] Installing backend packages...
cd backend
if not exist "node_modules" (
    call npm install --silent
    if errorlevel 1 (
        echo  [ERROR] Backend install failed. Check your internet connection.
        pause
        exit /b 1
    )
)
echo  [1/3] Backend packages ready!
cd ..

REM ---- Install frontend deps ----
echo  [2/3] Installing frontend packages...
cd frontend
if not exist "node_modules" (
    call npm install --silent
    if errorlevel 1 (
        echo  [ERROR] Frontend install failed.
        pause
        exit /b 1
    )
)
echo  [2/3] Frontend packages ready!
cd ..

REM ---- Seed database (first time) ----
if not exist ".seeded" (
    echo  [2.5] Seeding database with sample data...
    cd backend
    call node src/migrations/seed.js
    cd ..
    echo. > .seeded
    echo  [2.5] Sample data added! Login: admin@college.com / Admin@123
)

echo.
echo  [3/3] Starting servers...
echo.
echo  ==========================================
echo   App will open at: http://localhost:3000
echo   Backend API at:   http://localhost:5000
echo   Login: admin@college.com / Admin@123
echo  ==========================================
echo.

REM ---- Start backend ----
start "Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM ---- Wait 3 seconds for backend to boot ----
timeout /t 3 /nobreak >nul

REM ---- Start frontend ----
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

REM ---- Open browser after a few seconds ----
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo  Both servers are running in separate windows.
echo  Close those windows to stop the app.
echo.
pause
