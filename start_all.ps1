$root = $PSScriptRoot
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "   Launching VIT-AP AI Copilot Full-Stack Platform" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; Write-Host 'Starting Backend (Port 8000)...' -ForegroundColor Green; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; Write-Host 'Starting Frontend (Port 5173)...' -ForegroundColor Green; npm run dev -- --host 0.0.0.0 --port 5173"

Write-Host "`nBoth servers have been launched in separate PowerShell windows!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
