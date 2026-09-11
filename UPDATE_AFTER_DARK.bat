@echo off
setlocal EnableExtensions
title AFTER[DARK] - Update
cd /d "%~dp0"

echo.
echo ==========================================
echo        AFTER[DARK] - UPDATE
echo ==========================================
echo.

set "UPDATE_URL=https://codeload.github.com/eliaskoenighiza-svg/After-Dark/zip/refs/heads/main"
set "TMPDIR=%TEMP%\afterdark_update_%RANDOM%%RANDOM%"
set "ZIPFILE=%TMPDIR%\afterdark.zip"
set "EXTRACT=%TMPDIR%\extract"

mkdir "%TMPDIR%" >nul 2>&1
mkdir "%EXTRACT%" >nul 2>&1

if exist ".env" (
    copy /Y ".env" "%TMPDIR%\env.backup" >nul
)

echo [1/4] Lade die neueste After[DARK]-Version...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Invoke-WebRequest -UseBasicParsing -Uri '%UPDATE_URL%' -OutFile '%ZIPFILE%' -ErrorAction Stop } catch { exit 1 }"

if errorlevel 1 (
    echo.
    echo FEHLER: Update konnte nicht heruntergeladen werden.
    echo Pruefe deine Internetverbindung.
    echo Falls das GitHub-Repository privat ist, funktioniert dieser Update-Knopf nicht.
    echo.
    pause
    exit /b 1
)

echo [2/4] Entpacke Update...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Expand-Archive -LiteralPath '%ZIPFILE%' -DestinationPath '%EXTRACT%' -Force -ErrorAction Stop } catch { exit 1 }"

if errorlevel 1 (
    echo.
    echo FEHLER: Das Update konnte nicht entpackt werden.
    echo.
    pause
    exit /b 1
)

set "SRC=%EXTRACT%\After-Dark-main"
if not exist "%SRC%\package.json" (
    echo.
    echo FEHLER: Die heruntergeladene Version ist unvollstaendig.
    echo.
    pause
    exit /b 1
)

echo [3/4] Aktualisiere Dateien...
robocopy "%SRC%" "%CD%" /E /R:1 /W:1 /XD ".git" "node_modules" ".expo" /XF ".env" "UPDATE_AFTER_DARK.bat" >nul
set "ROBO=%ERRORLEVEL%"

if %ROBO% GEQ 8 (
    echo.
    echo FEHLER: Dateien konnten nicht vollstaendig aktualisiert werden.
    echo.
    pause
    exit /b 1
)

if exist "%TMPDIR%\env.backup" (
    copy /Y "%TMPDIR%\env.backup" ".env" >nul
)

echo [4/4] Pruefe Abhaengigkeiten...
where npm >nul 2>&1
if not errorlevel 1 (
    if exist "package.json" (
        call npm install --no-package-lock --no-audit --no-fund
    )
) else (
    echo Hinweis: npm wurde nicht gefunden. Die App-Dateien wurden trotzdem aktualisiert.
)

rmdir /S /Q "%TMPDIR%" >nul 2>&1

echo.
echo ==========================================
echo   UPDATE ERFOLGREICH
echo ==========================================
echo.

if exist "START_AFTER_DARK.bat" (
    echo After[DARK] wird gestartet...
    start "" "%CD%\START_AFTER_DARK.bat"
) else (
    echo START_AFTER_DARK.bat wurde nicht gefunden.
    pause
)

endlocal
