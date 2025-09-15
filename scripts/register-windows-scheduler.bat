@echo off
setlocal

set TASK_NAME=Laravel Schedule Runner
set PHP_PATH=C:\xampp\php\php.exe
set PROJECT_DIR=C:\xampp\htdocs\nsa-office

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0register-windows-scheduler.ps1" -TaskName "%TASK_NAME%" -PhpPath "%PHP_PATH%" -ProjectDir "%PROJECT_DIR%" -AsSystem

if %ERRORLEVEL% EQU 0 (
  echo Scheduled task "%TASK_NAME%" registered successfully.
) else (
  echo Failed to register scheduled task. ErrorLevel=%ERRORLEVEL%
)

endlocal
