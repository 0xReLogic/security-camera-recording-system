@echo off
title Security Camera System - Production Deployment

echo ===============================================
echo   Security Camera System - Production Deploy
echo ===============================================
echo.

echo [INFO] Building application for production...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [INFO] Setting up production environment...

REM Create production .env if not exists
if not exist ".env.production" (
    echo [INFO] Creating .env.production template...
    (
        echo # Production Environment Configuration
        echo NODE_ENV=production
        echo.
        echo # Database Configuration
        echo DATABASE_URL=postgresql://username:password@host:port/database
        echo.
        echo # Camera RTSP Configuration
        echo RTSP_URL=rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1^&subtype=0
        echo.
        echo # Video Storage
        echo VIDEO_OUTPUT_DIR=./recordings
        echo.
        echo # Email Configuration
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_SECURE=false
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-app-password
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo HOST=0.0.0.0
    ) > .env.production
    
    echo [IMPORTANT] File .env.production telah dibuat!
    echo Silakan edit file ini untuk konfigurasi production.
    echo.
    set /p edit_prod="Edit .env.production sekarang? (y/n): "
    if /i "%edit_prod%"=="y" (
        notepad .env.production
    )
)

echo.
echo [INFO] Ensuring production directories exist...
if not exist "recordings" mkdir recordings
if not exist "logs" mkdir logs

echo.
echo [INFO] Setting up database for production...
set NODE_ENV=production
call npm run db:push
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Database setup gagal. Periksa konfigurasi DATABASE_URL.
)

echo.
echo [INFO] Installing PM2 for process management...
call npm install -g pm2
if %ERRORLEVEL% neq 0 (
    echo [WARNING] PM2 installation gagal. Install manual: npm install -g pm2
)

echo.
echo [INFO] Creating PM2 configuration...
(
    echo {
    echo   "name": "security-camera-system",
    echo   "script": "dist/index.js",
    echo   "instances": 1,
    echo   "exec_mode": "cluster",
    echo   "env": {
    echo     "NODE_ENV": "production",
    echo     "PORT": 5000
    echo   },
    echo   "log_file": "./logs/app.log",
    echo   "out_file": "./logs/out.log",
    echo   "error_file": "./logs/error.log",
    echo   "log_date_format": "YYYY-MM-DD HH:mm:ss",
    echo   "watch": false,
    echo   "ignore_watch": ["node_modules", "recordings", "logs"],
    echo   "restart_delay": 4000,
    echo   "max_restarts": 10
    echo }
) > ecosystem.config.json

echo.
echo ===============================================
echo         Production Deployment Ready!
echo ===============================================
echo.
echo Untuk memulai production server:
echo   pm2 start ecosystem.config.json
echo   pm2 save
echo   pm2 startup
echo.
echo Untuk monitoring:
echo   pm2 status
echo   pm2 logs security-camera-system
echo   pm2 monit
echo.
echo Untuk stop/restart:
echo   pm2 stop security-camera-system
echo   pm2 restart security-camera-system
echo.
set /p start_prod="Start production server sekarang? (y/n): "
if /i "%start_prod%"=="y" (
    echo [INFO] Starting production server...
    pm2 start ecosystem.config.json
    pm2 save
    echo.
    echo [SUCCESS] Production server started!
    echo Access: http://localhost:5000
    pm2 status
)

echo.
pause