@echo off
title VIT-AP AI Copilot - Frontend Server (Port 5173)
cd /d "%~dp0frontend"
echo ==============================================================
echo   Starting VIT-AP AI Copilot Frontend (Vite on Port 5173)
echo ==============================================================
npm run dev -- --host 0.0.0.0 --port 5173
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Frontend crashed with error code %ERRORLEVEL%.
    pause
)
