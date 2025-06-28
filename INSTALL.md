# Panduan Instalasi Security Camera System

## 🚀 Instalasi Cepat (Recommended)

### Windows
1. **Download/Clone project**
2. **Klik kanan `install.bat` → Run as Administrator**
3. **Ikuti instruksi di layar**

### Linux/macOS
```bash
chmod +x setup.sh
./setup.sh
```

## 📋 File Setup yang Tersedia

### Untuk Windows:
- **`install.bat`** - Installer cepat (pilih otomatis atau manual)
- **`setup.bat`** - Setup manual dengan panduan step-by-step
- **`setup.ps1`** - PowerShell script dengan auto-install dependencies
- **`start.bat`** - Launcher aplikasi dengan auto-check
- **`deploy.bat`** - Production deployment dengan PM2

### Untuk Linux/macOS:
- **`setup.sh`** - Setup lengkap dengan auto-install dependencies
- **`start.sh`** - Launcher aplikasi dengan auto-check

## 🔧 Manual Installation

### 1. Persyaratan Sistem
- **Node.js** v18+ (LTS recommended)
- **PostgreSQL** v12+
- **FFmpeg** (untuk video processing)
- **Git** (untuk clone repository)

### 2. Install Dependencies

#### Windows (dengan Chocolatey):
```cmd
# Install Chocolatey (sebagai Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs postgresql ffmpeg -y
```

#### Windows (Manual):
1. **Node.js**: Download dari https://nodejs.org/
2. **PostgreSQL**: Download dari https://www.postgresql.org/download/windows/
3. **FFmpeg**: Download dari https://ffmpeg.org/download.html
   - Extract ke `C:\ffmpeg`
   - Tambahkan `C:\ffmpeg\bin` ke PATH

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install nodejs npm postgresql postgresql-contrib ffmpeg -y
```

#### CentOS/RHEL:
```bash
sudo yum install nodejs npm postgresql-server postgresql-contrib ffmpeg -y
# atau untuk versi baru:
sudo dnf install nodejs npm postgresql-server postgresql-contrib ffmpeg -y
```

#### macOS (dengan Homebrew):
```bash
# Install Homebrew jika belum ada
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql ffmpeg
brew services start postgresql
```

### 3. Setup Project

```bash
# Clone repository
git clone <repository-url>
cd security-camera-system

# Install Node.js dependencies
npm install

# Create recordings directory
mkdir recordings

# Setup database schema
npm run db:push
```

### 4. Konfigurasi

#### Buat file `.env`:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/security_camera

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
```

#### Setup Database PostgreSQL:
```sql
-- Login ke PostgreSQL
psql -U postgres

-- Buat database
CREATE DATABASE security_camera;

-- Buat user (opsional)
CREATE USER camera_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE security_camera TO camera_user;
```

### 5. Jalankan Aplikasi

#### Development Mode:
```bash
npm run dev
```

#### Production Mode:
```bash
npm run build
npm run start
```

## 🐳 Docker Installation (Opsional)

### Buat `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/security_camera
      - RTSP_URL=rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
    volumes:
      - ./recordings:/app/recordings
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=security_camera
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Jalankan dengan Docker:
```bash
docker-compose up -d
```

## 🔧 Konfigurasi Kamera RTSP

### Format URL RTSP umum:
```
rtsp://username:password@ip:port/path
```

### Contoh untuk berbagai merk:

#### Hikvision:
```
rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101
rtsp://admin:password@192.168.1.100:554/Streaming/Channels/102  # substream
```

#### Dahua:
```
rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=1  # substream
```

#### Axis:
```
rtsp://admin:password@192.168.1.100:554/axis-media/media.amp
```

#### Generic/ONVIF:
```
rtsp://admin:password@192.168.1.100:554/stream1
rtsp://admin:password@192.168.1.100:554/stream2
```

### Test RTSP Connection:
```bash
# Dengan FFmpeg
ffmpeg -i "rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0" -t 10 test.mp4

# Dengan VLC (GUI)
vlc "rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0"
```

## 📧 Konfigurasi Email

### Gmail Setup:
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
3. Gunakan App Password sebagai `SMTP_PASS`

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## 🚀 Production Deployment

### Dengan PM2 (Recommended):
```bash
# Install PM2 globally
npm install -g pm2

# Build untuk production
npm run build

# Start dengan PM2
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

# Setup auto-start pada boot
pm2 startup
```

### Dengan systemd (Linux):
```bash
# Buat service file
sudo nano /etc/systemd/system/security-camera.service
```

```ini
[Unit]
Description=Security Camera System
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/security-camera-system
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable dan start service
sudo systemctl enable security-camera
sudo systemctl start security-camera
sudo systemctl status security-camera
```

### Dengan Windows Service:
```bash
# Install node-windows
npm install -g node-windows

# Buat service script
node create-windows-service.js
```

## 🔧 Troubleshooting

### Common Issues:

#### FFmpeg Error:
```
Error: spawn ffmpeg ENOENT
```
**Solusi**: Install FFmpeg dan pastikan ada di PATH

#### Database Connection:
```
Database connection failed
```
**Solusi**: 
- Periksa DATABASE_URL
- Pastikan PostgreSQL service running
- Test koneksi: `psql -h localhost -U postgres -d security_camera`

#### RTSP Connection Failed:
```
Error opening input file rtsp://...
```
**Solusi**:
- Test dengan VLC player
- Periksa IP, port, username, password
- Pastikan kamera support RTSP

#### Port Already in Use:
```
Error: listen EADDRINUSE :::5000
```
**Solusi**:
- Ganti PORT di .env
- Kill process: `lsof -ti:5000 | xargs kill -9` (Linux/macOS)
- Kill process: `netstat -ano | findstr :5000` → `taskkill /PID <PID> /F` (Windows)

### Logs dan Debugging:

#### Development:
```bash
npm run dev  # Logs akan muncul di console
```

#### Production dengan PM2:
```bash
pm2 logs security-camera-system  # Real-time logs
pm2 logs security-camera-system --lines 100  # Last 100 lines
```

#### Manual log file:
```bash
tail -f logs/app.log     # Application logs
tail -f logs/error.log   # Error logs
```

## 📞 Support

### Jika mengalami masalah:
1. Periksa logs untuk error messages
2. Pastikan semua dependencies terinstall
3. Verifikasi konfigurasi .env
4. Test koneksi kamera dan database secara terpisah
5. Buat issue di GitHub repository

### Useful Commands:
```bash
# Check Node.js version
node --version

# Check npm version  
npm --version

# Check FFmpeg
ffmpeg -version

# Check PostgreSQL
psql --version

# Test database connection
npm run db:push

# Check port usage
netstat -tulpn | grep 5000  # Linux
netstat -ano | findstr :5000  # Windows
```