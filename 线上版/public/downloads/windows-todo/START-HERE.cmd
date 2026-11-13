@echo off
setlocal
set "browser=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%browser%" set "browser=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%browser%" set "browser=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%browser%" set "browser=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%browser%" (
  echo Microsoft Edge or Google Chrome was not found.
  pause
  exit /b 1
)
start "" "%browser%" --user-data-dir="%LOCALAPPDATA%\LioraTodoPet\EdgeProfile" --app="https://liora-study-hall.app.workbuddy.host/todo.html?sharecode=L4NKT6REQ6&pet=1" --window-size=360,520 --no-first-run --no-default-browser-check
