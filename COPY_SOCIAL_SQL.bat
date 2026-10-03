@echo off
setlocal
powershell -NoProfile -Command "Get-Content -Raw '%~dp0supabase\10_social_feed.sql' | Set-Clipboard"
if errorlevel 1 (
  echo.
  echo FEHLER: SQL konnte nicht in die Zwischenablage kopiert werden.
  pause
  exit /b 1
)
echo.
echo [OK] Social-SQL wurde in die Zwischenablage kopiert.
echo Supabase Dashboard wird geoeffnet.
echo Waehle dein After-Dark Projekt ^> SQL Editor ^> New query ^> Einfuegen ^> Run.
start "" "https://supabase.com/dashboard"
pause
