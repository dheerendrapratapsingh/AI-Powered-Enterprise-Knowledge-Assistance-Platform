Write-Host "=== AI-Powered Enterprise Knowledge Assistance Platform ===" -ForegroundColor Cyan

# 1. Setup Backend environment if not present
if (-not (Test-Path "backend\venv")) {
    Write-Host "Creating Python virtual environment in backend\venv..." -ForegroundColor Yellow
    py -m venv backend\venv
    Write-Host "Installing backend requirements..." -ForegroundColor Yellow
    & "backend\venv\Scripts\pip.exe" install -r backend\requirements.txt
}

# 2. Setup Frontend dependencies if not present
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# 3. Seed demo accounts if database doesn't exist
if (-not (Test-Path "backend\copilot.db")) {
    Write-Host "Initializing database and seeding default users..." -ForegroundColor Yellow
    Push-Location backend
    & ".\venv\Scripts\python.exe" seed_users.py
    Pop-Location
}

Write-Host "Starting Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"

Write-Host "Starting Frontend Server on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All servers launched in separate windows!" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API docs at:           http://127.0.0.1:8000/docs" -ForegroundColor Green
