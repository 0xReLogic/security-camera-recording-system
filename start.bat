@echo off
title Security Camera System

echo ===============================================
echo      Security Camera System - Launcher
echo ===============================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies belum terinstall!
    echo Menjalankan installer...
    call install.bat
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] File .env belum ada!
    echo Menjalankan setup...
    call setup.bat
    echo.
)

echo [INFO] Memulai Security Camera System...
echo.
echo Akses aplikasi di: http://localhost:5000
echo Tekan Ctrl+C untuk menghentikan aplikasi
echo.

npm run dev