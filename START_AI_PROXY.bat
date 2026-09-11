@echo off
cd /d "%~dp0"
if "%ANTHROPIC_API_KEY%"=="" (
  set /p ANTHROPIC_API_KEY=Anthropic API-Key eingeben ^(wird nicht gespeichert^): 
)
node server\index.mjs
pause
