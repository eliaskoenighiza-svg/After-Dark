@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo   AFTER[DARK] - IN-APP MAP V8 INSTALL
 echo ==========================================
echo.
call npx.cmd expo install react-native-webview
if errorlevel 1 (
  echo.
  echo Installation fehlgeschlagen.
  pause
  exit /b 1
)
echo.
echo WebView installiert. Kein Cloudflare-Deploy noetig.
pause
endlocal
