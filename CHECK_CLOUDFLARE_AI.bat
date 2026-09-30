@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
set "HEALTH="

if exist ".env.local" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
    if /I "%%A"=="EXPO_PUBLIC_AI_HEALTH_URL" set "HEALTH=%%B"
  )
)

if "%HEALTH%"=="" (
  echo.
  echo Cloudflare AI URL fehlt.
  echo Bitte zuerst SETUP_CLOUDFLARE_AI.bat starten.
  echo.
  pause
  exit /b 1
)

echo.
echo Pruefe: %HEALTH%
echo.
curl -s --max-time 10 "%HEALTH%"
echo.
echo.
pause
endlocal
