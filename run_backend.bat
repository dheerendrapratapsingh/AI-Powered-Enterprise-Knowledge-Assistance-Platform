@echo off
title VIT-AP AI Copilot - Backend Server (Port 8000)
cd /d "%~dp0backend"
echo ==============================================================
echo   Starting VIT-AP AI Copilot Backend (FastAPI on Port 8000)
echo ==============================================================
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Backend crashed with error code %ERRORLEVEL%.
    pause
)
