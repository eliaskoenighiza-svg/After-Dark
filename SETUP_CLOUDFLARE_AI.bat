@echo off
setlocal
cd /d "%~dp0"

echo.
echo ==========================================
echo   AFTER[DARK] - CLOUDFLARE AI SETUP
echo ==========================================
echo.
echo Schritt 1: Cloudflare Login
echo Es oeffnet sich gleich ein Browserfenster.
echo.
pause

pushd cloudflare-ai
call npx wrangler@latest login
if errorlevel 1 (
  popd
  echo.
  echo Login fehlgeschlagen.
  pause
  exit /b 1
)

echo.
echo Schritt 2: Gemma 4 Worker deployen
echo.
call npx wrangler@latest deploy
if errorlevel 1 (
  popd
  echo.
  echo Deployment fehlgeschlagen.
  pause
  exit /b 1
)
popd

echo.
echo ==========================================
echo   DEPLOYMENT FERTIG
echo ==========================================
echo.
echo Oben steht eine URL wie:
echo https://after-dark-ai.DEINNAME.workers.dev
echo.
echo Kopiere diese URL. Im naechsten Schritt fuegst du sie ein.
echo.
pause
node tools\set-cloudflare-url.mjs
if errorlevel 1 (
  echo.
  echo URL konnte nicht gespeichert werden.
  pause
  exit /b 1
)

echo.
echo Fertig. Starte jetzt START_AFTER_DARK.bat neu.
echo.
pause
endlocal
