@echo off
title Morty Music Bot - Setup
echo.
echo   ==============================================
echo.
echo    M   M  OOO  RRRR  TTTTT Y   Y
echo    MM MM O   O R   R   T    Y Y
echo    M M M O   O RRRR    T     Y
echo    M   M O   O R  R    T     Y
echo    M   M  OOO  R   R   T     Y
echo.
echo      Discord Music Bot v3.0.0
echo      "Oh geez, l-let me set this up for you!"
echo.
echo   ==============================================
echo.
echo   This will download and set up everything you
echo   need to run the bot. No admin rights needed!
echo.
echo   Press any key to start...
pause >nul

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Aw geez, setup hit an error.
    echo         Check your internet connection and try again.
    echo.
)

pause
