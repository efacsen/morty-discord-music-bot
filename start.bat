@echo off
title Morty Music Bot
cd /d "%~dp0"

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
echo      "Oh geez, h-here we go!"
echo.
echo   ==============================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] Aw geez, .env file not found!
    echo         Please run setup.bat first.
    echo.
    pause
    exit /b 1
)

REM Use portable runtime if available, otherwise use system PATH
if exist "runtime\node\node.exe" (
    set "PATH=%~dp0runtime\node;%~dp0runtime;%PATH%"
    echo [INFO] Using portable runtime
) else (
    echo [INFO] Using system-installed tools
    where node >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js not found!
        echo         Run setup.bat to install, or install Node.js manually.
        echo.
        pause
        exit /b 1
    )
)

echo [INFO] Press Ctrl+C to stop the bot
echo.

node src/index.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Aw geez, the bot crashed.
    echo         Check the output above for details.
    echo.
    pause
)
