@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist ".env.local" (
  if exist ".env.example" (
    echo Creating .env.local from .env.example...
    copy ".env.example" ".env.local" >nul
    echo Edit .env.local before playing for real coordinates.
  )
)

echo Starting Collecto at http://localhost:3000
start "" "http://localhost:3000"
call npm run dev

pause
