@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [TESLA] Installing packages (npm install --legacy-peer-deps)...
rem PrimeNG 21 declares Angular 21 as peer; this project uses Angular 22, so --legacy-peer-deps is required
call npm.cmd install --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo [TESLA] npm install FAILED - copy the error above and send to Claude
  pause
  exit /b 1
)
echo.
echo [TESLA] Install complete. Next: run start.bat
pause
