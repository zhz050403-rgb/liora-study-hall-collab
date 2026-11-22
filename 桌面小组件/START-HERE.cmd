@echo off
rem Liora Study Hall - Desktop Todo Widget launcher (no installation needed)
start "" /min powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0desktop-pet.ps1"
exit /b
