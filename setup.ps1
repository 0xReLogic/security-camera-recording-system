# Security Camera System - PowerShell Setup Script
# Windows Version with automatic dependency installation

param(
    [switch]$SkipDependencies,
    [switch]$AutoInstall
)

# Require Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Script ini memerlukan hak Administrator!" -ForegroundColor Red
    Write-Host "Klik kanan pada PowerShell dan pilih 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    Write-ColorText "===============================================" "Blue"
    Write-ColorText "    Security Camera System - Auto Setup" "Blue"
    Write-ColorText "===============================================" "Blue"
    Write-Host ""
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Install-Chocolatey {
    Write-ColorText "[INFO] Installing Chocolatey package manager..." "Cyan"
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-NodeJS {
    if (Test-Command "node") {
        Write-ColorText "[SUCCESS] Node.js sudah terinstall: $(node --version)" "Green"
        return
    }
    
    Write-ColorText "[INFO] Installing Node.js..." "Cyan"
    if (Test-Command "choco") {
        choco install nodejs -y
    } else {
        Write-ColorText "[INFO] Downloading Node.js installer..." "Cyan"
        $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
        $nodePath = "$env:TEMP\nodejs.msi"
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodePath
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodePath, "/quiet" -Wait
        Remove-Item $nodePath
    }
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-FFmpeg {
    if (Test-Command "ffmpeg") {
        Write-ColorText "[SUCCESS] FFmpeg sudah terinstall" "Green"
        return
    }
    
    Write-ColorText "[INFO] Installing FFmpeg..." "Cyan"
    if (Test-Command "choco") {
        choco install ffmpeg -y
    } else {
        # Manual installation
        Write-ColorText "[INFO] Downloading FFmpeg..." "Cyan"
        $ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        $ffmpegZip = "$env:TEMP\ffmpeg.zip"
        $ffmpegDir = "C:\ffmpeg"
        
        Invoke-WebRequest -Uri $ffmpegUrl -OutFile $ffmpegZip
        Expand-Archive -Path $ffmpegZip -DestinationPath $env:TEMP -Force
        
        # Find extracted folder
        $extractedFolder = Get-ChildItem "$env:TEMP\ffmpeg-*" | Select-Object -First 1
        Move-Item $extractedFolder.FullName $ffmpegDir -Force
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$ffmpegDir\bin*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$ffmpegDir\bin", "Machine")
        }
        
        Remove-Item $ffmpegZip
    }
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-PostgreSQL {
    if (Test-Command "psql") {
        Write-ColorText "[SUCCESS] PostgreSQL sudah terinstall" "Green"
        return
    }
    
    $installPG = "n"
    if ($AutoInstall) {
        $installPG = "y"
    } else {
        $installPG = Read-Host "Install PostgreSQL? (y/n)"
    }
    
    if ($installPG -match "^[Yy]") {
        Write-ColorText "[INFO] Installing PostgreSQL..." "Cyan"
        if (Test-Command "choco") {
            choco install postgresql -y --params '/Password:postgres'
        } else {
            Write-ColorText "[INFO] Downloading PostgreSQL installer..." "Cyan"
            $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64.exe"
            $pgPath = "$env:TEMP\postgresql.exe"
            Invoke-WebRequest -Uri $pgUrl -OutFile $pgPath
            Start-Process -FilePath $pgPath -ArgumentList "--mode", "unattended", "--superpassword", "postgres" -Wait
            Remove-Item $pgPath
        }
        
        Write-ColorText "[SUCCESS] PostgreSQL terinstall dengan password default: postgres" "Green"
    }
}

function Create-EnvFile {
    if (Test-Path ".env") {
        Write-ColorText "[INFO] File .env sudah ada" "Yellow"
        return
    }
    
    Write-ColorText "[INFO] Membuat file .env template..." "Cyan"
    
    $envContent = @"
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/security_camera

# Camera RTSP Configuration
RTSP_URL=rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0

# Video Storage
VIDEO_OUTPUT_DIR=./recordings

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-ColorText "[IMPORTANT] File .env telah dibuat!" "Yellow"
    Write-ColorText "Silakan edit file .env dan sesuaikan konfigurasi:" "Cyan"
    Write-ColorText "- DATABASE_URL: URL koneksi database PostgreSQL" "Cyan"
    Write-ColorText "- RTSP_URL: URL RTSP stream kamera Anda" "Cyan"
    Write-ColorText "- SMTP_*: Konfigurasi email (opsional)" "Cyan"
    Write-Host ""
    
    $editEnv = "n"
    if (-not $AutoInstall) {
        $editEnv = Read-Host "Buka file .env untuk edit sekarang? (y/n)"
    }
    
    if ($editEnv -match "^[Yy]") {
        Start-Process notepad ".env"
        Read-Host "Tekan Enter setelah selesai edit .env"
    }
}

function Setup-Database {
    Write-ColorText "[INFO] Setting up database..." "Cyan"
    
    if (Test-Command "psql") {
        try {
            # Create database if not exists
            $createDbCmd = "psql -U postgres -h localhost -c `"CREATE DATABASE security_camera;`" 2>nul || echo Database already exists"
            Invoke-Expression $createDbCmd
            Write-ColorText "[SUCCESS] Database setup completed" "Green"
        }
        catch {
            Write-ColorText "[WARNING] Could not create database automatically" "Yellow"
        }
    }
    
    # Run Drizzle migrations
    try {
        npm run db:push
        Write-ColorText "[SUCCESS] Database schema setup berhasil!" "Green"
    }
    catch {
        Write-ColorText "[WARNING] Database schema setup gagal. Pastikan DATABASE_URL sudah benar di .env" "Yellow"
        Write-ColorText "Anda bisa menjalankan 'npm run db:push' nanti setelah konfigurasi database." "Cyan"
    }
}

function Main {
    Write-Header
    
    # Install Chocolatey if not available and not skipping dependencies
    if (-not $SkipDependencies -and -not (Test-Command "choco")) {
        $installChoco = "y"
        if (-not $AutoInstall) {
            $installChoco = Read-Host "Install Chocolatey package manager untuk kemudahan instalasi? (y/n)"
        }
        
        if ($installChoco -match "^[Yy]") {
            Install-Chocolatey
        }
    }
    
    # Install dependencies
    if (-not $SkipDependencies) {
        Install-NodeJS
        Install-FFmpeg
        Install-PostgreSQL
    }
    
    # Verify Node.js
    if (-not (Test-Command "node")) {
        Write-ColorText "[ERROR] Node.js tidak ditemukan! Install Node.js dari https://nodejs.org/" "Red"
        Read-Host "Tekan Enter untuk keluar"
        exit 1
    }
    
    Write-ColorText "[INFO] Installing Node.js dependencies..." "Cyan"
    npm install
    
    Write-ColorText "[INFO] Creating recordings directory..." "Cyan"
    New-Item -ItemType Directory -Path "recordings" -Force | Out-Null
    
    Create-EnvFile
    Setup-Database
    
    Write-Host ""
    Write-ColorText "===============================================" "Green"
    Write-ColorText "           Setup Selesai!" "Green"
    Write-ColorText "===============================================" "Green"
    Write-Host ""
    Write-ColorText "Untuk menjalankan aplikasi:" "Cyan"
    Write-ColorText "  npm run dev        - Development mode" "Cyan"
    Write-ColorText "  npm run build      - Build untuk production" "Cyan"
    Write-ColorText "  npm run start      - Production mode" "Cyan"
    Write-Host ""
    Write-ColorText "Akses aplikasi di: http://localhost:5000" "Cyan"
    Write-Host ""
    Write-ColorText "File konfigurasi penting:" "Cyan"
    Write-ColorText "  .env              - Environment variables" "Cyan"
    Write-ColorText "  recordings/       - Folder penyimpanan video" "Cyan"
    Write-ColorText "  README.md         - Dokumentasi lengkap" "Cyan"
    Write-Host ""
    
    $runNow = "n"
    if (-not $AutoInstall) {
        $runNow = Read-Host "Jalankan aplikasi sekarang? (y/n)"
    }
    
    if ($runNow -match "^[Yy]") {
        Write-ColorText "[INFO] Memulai aplikasi..." "Cyan"
        npm run dev
    }
    
    Write-Host ""
    Write-ColorText "Terima kasih telah menggunakan Security Camera System!" "Green"
    
    if (-not $AutoInstall) {
        Read-Host "Tekan Enter untuk keluar"
    }
}

# Run main function
Main