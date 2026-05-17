@echo off
title Aura CRM Launcher
color 0A

echo.
echo  =========================================
echo     AURA CRM - Starting All Services...
echo  =========================================
echo.

echo  [1/2] Starting Backend (Port 5000)...
start "Aura CRM - Backend" cmd /k "cd /d d:\CRM With Backup\backend && node index.js"

timeout /t 2 /nobreak >nul

echo  [2/2] Starting Frontend (Port 5173)...
start "Aura CRM - Frontend" cmd /k "cd /d d:\CRM With Backup\frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo  =========================================
echo     Opening CRM in your browser...
echo  =========================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173/

echo  Both servers are running!
echo  Backend  --^>  http://localhost:5000
echo  Frontend --^>  http://localhost:5173
echo.
echo  (You can close this window. The 2 server
echo   windows must stay open while using CRM)
echo.
pause
