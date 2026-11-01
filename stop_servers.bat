@echo off
title RIHAISH Server Stopper
echo ========================================================
echo        Stopping RIHAISH Servers (Port 8000 & 3000)
echo ========================================================
echo.

echo Stopping processes on Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a 2>nul
)

echo Stopping processes on Port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a 2>nul
)

echo.
echo All RIHAISH servers stopped cleanly.
timeout /t 3
