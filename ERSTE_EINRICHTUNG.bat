@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo AFTER[DARK] - ERSTE EINRICHTUNG
echo ==========================================
echo.
echo Hier werden nur die oeffentlichen Supabase-Appdaten eingetragen.
echo KEIN Datenbank-Passwort, KEIN service_role-Key und KEIN Anthropic-Key eingeben.
echo.
set /p SUPA_URL=Supabase Project URL: 
set /p SUPA_KEY=Supabase Publishable Key (sb_publishable_...): 
(
  echo # AFTER[DARK] - lokale App-Konfiguration
  echo EXPO_PUBLIC_SUPABASE_URL=%SUPA_URL%
  echo EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%SUPA_KEY%
  echo EXPO_PUBLIC_AI_PROXY_URL=http://10.0.2.2:8787/ai
) > .env

echo.
echo .env wurde erstellt.
echo Danach START_AFTER_DARK.bat starten.
echo Fuer lokale KI im Emulator zusaetzlich START_AI_PROXY.bat starten.
echo.
pause
