@echo off
setlocal
cd /d "%~dp0"

if not exist ".env.local" (
  echo.
  echo Noch keine Service-Konfiguration gefunden.
  echo Bitte zuerst SETUP_KI_MAPS.bat starten.
  echo.
  pause
  exit /b 1
)

start "AfterDark KI" cmd /k ""%~dp0START_AI_PROXY.bat""
timeout /t 2 /nobreak >nul
start "AfterDark App" cmd /k ""%~dp0START_AFTER_DARK.bat""

echo.
echo KI-Bridge und After[Dark wurden gestartet.
echo Das KI-Fenster offen lassen.
echo.
pause
endlocal
