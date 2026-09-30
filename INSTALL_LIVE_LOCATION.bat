@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo   AFTER[DARK] - LIVE-STANDORT INSTALL
 echo ==========================================
echo.
call npx expo install expo-location
if errorlevel 1 (
  echo.
  echo FEHLER: expo-location konnte nicht installiert werden.
  pause
  exit /b 1
)
echo.
echo Live-Standort installiert. Kein Cloudflare-Deploy noetig.
echo Beim ersten Oeffnen von Parks Standortzugriff erlauben.
pause
endlocal
