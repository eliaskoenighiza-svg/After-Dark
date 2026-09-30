@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo   AFTER[DARK] - KI + MAPS EINRICHTUNG
echo ==========================================
echo.
node tools\setup-services.mjs
echo.
pause
endlocal
