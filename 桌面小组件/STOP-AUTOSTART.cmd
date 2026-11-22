@echo off
rem Stop the desktop todo widget from starting automatically with Windows.
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v LioraTodoPet /f >nul 2>&1
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LioraTodoPet.lnk" >nul 2>&1
echo Done. The desktop todo widget will no longer start automatically.
timeout /t 2 >nul
exit /b
