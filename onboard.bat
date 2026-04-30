@echo off
title Discord Music Bot - Env Onboarding
echo.
echo   ==============================================
echo    Discord Music Bot - Env Onboarding
echo   ==============================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\onboard.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Env onboarding hit an error.
    echo.
)

pause
