@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo [TESLA] node_modules not found - running npm install first...
  call npm.cmd install --legacy-peer-deps || (pause & exit /b 1)
)
echo [TESLA] Starting server (3000) + Angular (4200)...  Press Ctrl+C to stop
call npm.cmd start
pause
