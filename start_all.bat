@echo off
title Launch VIT-AP AI Copilot
echo ==============================================================
echo   Launching VIT-AP AI Copilot Full-Stack Platform
echo ==============================================================
start "VIT-AP Backend" "%~dp0run_backend.bat"
start "VIT-AP Frontend" "%~dp0run_frontend.bat"
echo.
echo Both servers have been launched in separate terminal windows.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo.
ping 127.0.0.1 -n 3 >nul
