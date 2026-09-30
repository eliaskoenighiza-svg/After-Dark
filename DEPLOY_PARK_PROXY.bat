@echo off
setlocal
cd /d "%~dp0cloudflare-ai"
echo.
echo ==========================================
echo   AFTER[DARK] - PARK + WETTER PROXY V7 DEPLOY
echo ==========================================
echo.
call npx.cmd wrangler deploy
echo.
echo Wenn oben "Deployed" und die workers.dev-Adresse steht, ist V7 online.
pause
endlocal
