@echo off
setlocal
cd /d "%~dp0"

echo.
echo After[Dark Service-Check
echo -----------------------
echo.

set "MAPS="
if exist ".env.local" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do (
    if /I "%%A"=="GOOGLE_MAPS_API_KEY" set "MAPS=%%B"
  )
)

if defined MAPS (
  echo Google Maps Key: VORHANDEN
) else (
  echo Google Maps Key: FEHLT
)

echo.
echo KI-Bridge:
curl -s --max-time 4 http://127.0.0.1:8787/health
echo.
echo.
pause
endlocal
