@echo off
title Pak Lurah Music Bot - Setup
echo.
echo ================================================
echo    Pak Lurah Music Bot - Setup
echo ================================================
echo.
echo  This will download and set up everything you
echo  need to run the bot. No admin rights needed!
echo.
echo  Press any key to start...
pause >nul

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Setup encountered an error.
    echo         If downloads failed, check your internet connection and try again.
    echo.
)

pause
