@echo off
echo ===============================================
echo    Security Camera System - Auto Setup
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo.
    echo Silakan install Node.js dari: https://nodejs.org/
    echo Pilih versi LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js ditemukan: 
node --version

REM Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] FFmpeg tidak ditemukan!
    echo FFmpeg diperlukan untuk video recording.
    echo.
    echo Untuk install FFmpeg:
    echo 1. Download dari: https://ffmpeg.org/download.html
    echo 2. Extract ke folder C:\ffmpeg
    echo 3. Tambahkan C:\ffmpeg\bin ke PATH environment variable
    echo.
    set /p choice="Lanjutkan tanpa FFmpeg? (y/n): "
    if /i "%choice%" neq "y" (
        echo Setup dibatalkan.
        pause
        exit /b 1
    )
) else (
    echo [INFO] FFmpeg ditemukan
)

echo.
echo [INFO] Menginstall dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal menginstall dependencies!
    pause
    exit /b 1
)

echo.
echo [INFO] Membuat folder recordings...
if not exist "recordings" mkdir recordings

echo.
echo [INFO] Checking environment configuration...
if not exist ".env" (
    echo [INFO] Membuat file .env template...
    (
        echo # Database Configuration
        echo DATABASE_URL=postgresql://username:password@host:port/database
        echo.
        echo # Camera RTSP Configuration
        echo RTSP_URL=rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1^&subtype=0
        echo.
        echo # Video Storage
        echo VIDEO_OUTPUT_DIR=./recordings
        echo.
        echo # Email Configuration ^(Optional^)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_SECURE=false
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-app-password
    ) > .env
    
    echo.
    echo [IMPORTANT] File .env telah dibuat!
    echo Silakan edit file .env dan sesuaikan konfigurasi:
    echo - DATABASE_URL: URL koneksi database PostgreSQL
    echo - RTSP_URL: URL RTSP stream kamera Anda
    echo - SMTP_*: Konfigurasi email (opsional)
    echo.
    set /p edit_env="Buka file .env untuk edit sekarang? (y/n): "
    if /i "%edit_env%"=="y" (
        notepad .env
    )
)

echo.
echo [INFO] Setup database schema...
call npm run db:push
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Database setup gagal. Pastikan DATABASE_URL sudah benar di .env
    echo Anda bisa menjalankan 'npm run db:push' nanti setelah konfigurasi database.
)

echo.
echo ===============================================
echo           Setup Selesai!
echo ===============================================
echo.
echo Untuk menjalankan aplikasi:
echo   npm run dev        - Development mode
echo   npm run build      - Build untuk production  
echo   npm run start      - Production mode
echo.
echo Akses aplikasi di: http://localhost:5000
echo.
echo File konfigurasi penting:
echo   .env              - Environment variables
echo   recordings/       - Folder penyimpanan video
echo   README.md         - Dokumentasi lengkap
echo.
set /p run_now="Jalankan aplikasi sekarang? (y/n): "
if /i "%run_now%"=="y" (
    echo.
    echo [INFO] Memulai aplikasi...
    call npm run dev
)

echo.
echo Terima kasih telah menggunakan Security Camera System!
pause