@echo off
title RIHAISH Server Launcher
echo ========================================================
echo        Starting RIHAISH Platform (Backend & Frontend)
echo ========================================================
echo.

:: 1. Launch FastAPI Backend in a new window
echo [1/2] Starting Backend Server (Port 8000)...
start "RIHAISH Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python run.py"

:: 2. Launch Vite Frontend in a new window
echo [2/2] Starting Frontend Server (Port 3000)...
start "RIHAISH Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  Both servers launched successfully!
echo  - Frontend: http://localhost:3000
echo  - Backend:  http://127.0.0.1:8000
echo  - API Docs: http://127.0.0.1:8000/docs
echo ========================================================
timeout /t 5
