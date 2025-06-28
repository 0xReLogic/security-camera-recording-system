@echo off
title Security Camera System - Quick Installer

REM Quick installer that downloads and runs the main setup
echo ===============================================
echo    Security Camera System - Quick Installer
echo ===============================================
echo.
echo Script ini akan mengunduh dan menjalankan installer lengkap
echo yang dapat menginstall semua dependencies otomatis.
echo.

REM Check if PowerShell is available
powershell -Command "exit" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] PowerShell tidak tersedia, menggunakan batch script...
    call setup.bat
) else (
    echo [INFO] Menggunakan PowerShell installer untuk hasil terbaik...
    echo.
    set /p auto="Install semua dependencies otomatis? (y/n): "
    if /i "%auto%"=="y" (
        powershell -ExecutionPolicy Bypass -File setup.ps1 -AutoInstall
    ) else (
        powershell -ExecutionPolicy Bypass -File setup.ps1
    )
)

echo.
echo Setup selesai!
pause