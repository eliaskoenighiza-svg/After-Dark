@echo off
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js wurde nicht gefunden. Installiere zuerst Node.js 22.13 oder neuer.
  pause
  exit /b 1
)
if not exist .env (
  copy /Y .env.example .env >nul
)
if not exist node_modules (
  echo Installiere Abhaengigkeiten...
  call npm install
  if errorlevel 1 (
    echo npm install ist fehlgeschlagen.
    pause
    exit /b 1
  )
)
echo Starte After[Dark V4 im Android Emulator...
call npx expo start --android
pause
