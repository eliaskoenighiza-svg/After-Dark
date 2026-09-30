@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "ANTHROPIC_API_KEY="

if exist ".env.local" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
    if /I "%%A"=="ANTHROPIC_API_KEY" set "ANTHROPIC_API_KEY=%%B"
  )
)

if "%ANTHROPIC_API_KEY%"=="" (
  echo.
  echo Anthropic API-Key fehlt.
  echo Bitte zuerst SETUP_KI_MAPS.bat starten.
  echo.
  pause
  exit /b 1
)

echo.
echo Starte After[Dark KI-Bridge ...
echo Dieses Fenster offen lassen.
echo.
node server\index.mjs
echo.
pause
endlocal
