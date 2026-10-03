@echo off
cd /d "%~dp0"
echo After[Dark V14 - benoetigte Module pruefen/installieren...
call npx.cmd expo install expo-location react-native-webview expo-updates
if errorlevel 1 goto :err
call npm.cmd install
if errorlevel 1 goto :err
echo.
echo Fertig. Jetzt starten mit: npx.cmd expo start -c
pause
exit /b 0
:err
echo.
echo Installation ist fehlgeschlagen. Bitte diese Ausgabe an ChatGPT schicken.
pause
exit /b 1
