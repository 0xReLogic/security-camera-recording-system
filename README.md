# Sistem Monitoring dan Rekaman Video Kamera Keamanan

*Powered by ReLogic*

Aplikasi web full-stack untuk sistem rekaman kamera keamanan dengan fitur monitoring real-time, rekaman otomatis, dan notifikasi email ketika rekaman dibuat.

## 🎯 Fitur Utama

### 📹 Manajemen Rekaman Video
- **Mulai/Stop Rekaman**: Kontrol rekaman secara manual melalui dashboard
- **Format Nama File**: Otomatis dengan format tanggal (DDMMYYYY_HHMMSS.mp4)
- **Tracking Real-time**: Durasi rekaman dan ukuran file yang terupdate secara langsung
- **Penyimpanan Metadata**: Informasi lengkap rekaman disimpan di database

### 📧 Sistem Notifikasi Email
- **SMTP Integration**: Menggunakan nodemailer untuk pengiriman email
- **Queue System**: Sistem antrian email dengan logika retry otomatis
- **Error Handling**: Pelacakan email gagal dengan mekanisme retry
- **Template Email**: Template yang dapat dikonfigurasi

### 📊 Dashboard Real-time
- **Live Video Feed**: Tampilan video langsung dari kamera
- **Status Monitor**: Monitoring status sistem (internet, database, NVR, email)
- **Riwayat Rekaman**: Daftar rekaman dengan fitur filtering
- **Queue Management**: Status dan manajemen antrian email

### ⚙️ Background Processing
- **Cron Jobs**: Pemrosesan antrian email berbasis cron
- **Auto Retry**: Sistem retry otomatis untuk email gagal
- **Health Monitoring**: Monitoring kesehatan sistem

## 🏗️ Arsitektur Sistem

### Frontend
- **Framework**: React 18 dengan TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query untuk server state
- **Routing**: Wouter untuk client-side routing
- **Build Tool**: Vite untuk development dan bundling
- **Real-time**: WebSocket client untuk update langsung

### Backend
- **Runtime**: Node.js dengan Express.js
- **Language**: TypeScript dengan ES modules
- **Database**: Drizzle ORM dengan PostgreSQL
- **Real-time**: WebSocket server untuk broadcasting
- **File Processing**: Multer untuk upload dan handling video
- **Task Scheduling**: Node-cron untuk background jobs

### Database
- **Database**: PostgreSQL (dikonfigurasi untuk Neon serverless)
- **ORM**: Drizzle ORM dengan dukungan migration
- **Schema**: 4 tabel utama - users, recordings, email_queue, system_config

## 📋 Persyaratan Sistem

### Software Dependencies
- **Node.js** v20+ 
- **PostgreSQL** database
- **FFmpeg** untuk video processing
- **SMTP Server** untuk email notifications

### Hardware Requirements
- **RAM**: Minimum 2GB (Recommended 4GB+)
- **Storage**: Sesuai kebutuhan penyimpanan video
- **Network**: Koneksi internet stabil untuk RTSP dan email

## 🚀 Instalasi dan Setup

### 📦 Instalasi Otomatis (Recommended)

#### Untuk Windows:
1. **Download/Clone project ini**
2. **Klik kanan `install.bat` → "Run as Administrator"**
3. **Pilih "y" untuk install otomatis semua dependencies**
4. **Tunggu hingga setup selesai**
5. **Double-click `start.bat` untuk menjalankan aplikasi**

#### Untuk Linux/macOS:
```bash
# Make executable dan jalankan setup
chmod +x setup.sh
./setup.sh

# Setelah setup selesai, jalankan aplikasi
chmod +x start.sh
./start.sh
```

### 🛠️ File Setup Yang Tersedia

#### Windows Users:
- **`install.bat`** - ⚡ Quick installer (klik 2x untuk mulai)
- **`setup.bat`** - 📋 Setup manual dengan panduan
- **`setup.ps1`** - 🔧 PowerShell script dengan auto-install
- **`start.bat`** - 🚀 Launcher aplikasi (klik 2x untuk jalankan)
- **`deploy.bat`** - 🏭 Production deployment

#### Linux/macOS Users:
- **`setup.sh`** - 🔧 Setup lengkap dengan auto-install
- **`start.sh`** - 🚀 Launcher aplikasi

### ⚙️ Yang Akan Di-install Otomatis:
- ✅ **Node.js** v20+ (jika belum ada)
- ✅ **FFmpeg** (untuk video processing)
- ✅ **PostgreSQL** (opsional, dengan konfigurasi)
- ✅ **NPM Dependencies** (semua package otomatis)
- ✅ **Environment Setup** (file .env otomatis dibuat)
- ✅ **Database Schema** (otomatis setup)

### 🔧 Manual Installation (Jika Diperlukan)

#### 1. Persyaratan Sistem
- **Node.js** v18+ (download dari https://nodejs.org/)
- **PostgreSQL** v12+ (download dari https://postgresql.org/)
- **FFmpeg** (download dari https://ffmpeg.org/)

#### 2. Clone dan Setup
```bash
# Clone repository
git clone <repository-url>
cd security-camera-system

# Install dependencies
npm install

# Setup database schema
npm run db:push
```

#### 3. Konfigurasi Environment
File `.env` akan otomatis dibuat oleh setup script, atau buat manual:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/security_camera

# RTSP Camera Stream
RTSP_URL=rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0

# Video Storage
VIDEO_OUTPUT_DIR=./recordings

# Email Configuration (Opsional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 4. Jalankan Aplikasi
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

Aplikasi akan berjalan di `http://localhost:5000`

## 📱 Cara Penggunaan

### 🎯 Quick Start (Setelah Setup)
1. **Jalankan Aplikasi**: Double-click `start.bat` (Windows) atau jalankan `./start.sh` (Linux/macOS)
2. **Buka Browser**: Akses `http://localhost:5000`
3. **Mulai Recording**: Klik tombol "Start Recording"
4. **Monitor Dashboard**: Lihat status real-time sistem dan rekaman

### 1. Akses Dashboard
- Buka browser dan akses `http://localhost:5000`
- Dashboard akan menampilkan status sistem dan kontrol rekaman
- Semua fitur dapat diakses dari satu halaman utama

### 2. Mulai Rekaman
- Klik tombol "Start Recording" di dashboard
- Sistem akan mulai merekam dari kamera RTSP yang dikonfigurasi
- Status rekaman akan ditampilkan secara real-time
- File disimpan otomatis dengan format: `DDMMYYYY_HHMMSS.mp4`

### 3. Stop Rekaman
- Klik tombol "Stop Recording" untuk menghentikan
- File video akan disimpan di folder `recordings/`
- Email notifikasi akan dikirim otomatis (jika SMTP dikonfigurasi)
- Durasi dan ukuran file akan ditampilkan

### 4. Kelola Rekaman
- Lihat daftar rekaman di panel "Recording History"
- Download rekaman dengan klik tombol download
- Hapus rekaman yang tidak diperlukan
- Monitor status pengiriman email di queue panel

### 5. Monitor Sistem
Panel status real-time menampilkan kondisi:
- 🌐 **Internet**: Koneksi internet aktif
- 🗄️ **Database**: Koneksi PostgreSQL
- 📹 **NVR/Camera**: Status kamera RTSP  
- 📧 **Email**: Service SMTP untuk notifikasi

### 6. Konfigurasi Kamera
- Edit file `.env` untuk mengubah URL RTSP
- Format: `rtsp://username:password@ip:port/path`
- Restart aplikasi setelah perubahan konfigurasi
- Test koneksi kamera melalui dashboard

## ⚙️ Konfigurasi

### RTSP Camera Setup
Pastikan kamera IP/NVR mendukung RTSP stream dengan format:
```
rtsp://username:password@ip:port/path
```

Contoh untuk berbagai merk kamera:
- **Hikvision**: `rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101`
- **Dahua**: `rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0`
- **Generic**: `rtsp://admin:admin@192.168.1.100:554/stream1`

### Email Configuration
Untuk Gmail, gunakan App Password:
1. Enable 2-Factor Authentication
2. Generate App Password di Google Account Settings
3. Gunakan App Password sebagai SMTP_PASS

### Storage Configuration
Video disimpan di direktori yang dikonfigurasi di `VIDEO_OUTPUT_DIR`. Pastikan:
- Direktori memiliki permission write
- Storage mencukupi untuk rekaman video
- Backup rutin untuk file penting

## 🛠️ Development

### Project Structure
```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Backend Express app
│   ├── services/          # Business logic
│   ├── routes.ts          # API endpoints
│   └── storage.ts         # Database operations
├── shared/                # Shared types and schemas
└── recordings/            # Video storage directory
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio

# Type checking
npm run type-check
```

### Adding New Features
1. Update schema di `shared/schema.ts`
2. Update storage interface di `server/storage.ts`
3. Tambah API routes di `server/routes.ts`
4. Implementasi UI di `client/src/`

## 🔧 Troubleshooting

### 🚨 Masalah Setup Executable

#### 1. Install.bat Tidak Bisa Jalan
**Error**: "Access denied" atau "Permission error"
**Solusi**:
- Klik kanan `install.bat` → "Run as Administrator"
- Disable antivirus sementara saat install
- Pastikan Windows tidak memblokir file

#### 2. PowerShell Execution Policy Error
**Error**: "execution of scripts is disabled on this system"
**Solusi**:
```cmd
# Jalankan sebagai Administrator
powershell -ExecutionPolicy Bypass -File setup.ps1
```

#### 3. Node.js Installation Gagal
**Error**: Download atau install Node.js gagal
**Solusi**:
- Install manual dari https://nodejs.org/
- Pilih versi LTS (Long Term Support)
- Restart Command Prompt setelah install

#### 4. Chocolatey Install Gagal
**Error**: Chocolatey tidak bisa install
**Solusi**:
- Jalankan PowerShell sebagai Administrator
- Bypass execution policy: `Set-ExecutionPolicy Bypass -Scope Process`
- Install manual packages yang diperlukan

### 🐛 Masalah Aplikasi

#### 1. FFmpeg Error
```
Error: spawn ffmpeg ENOENT
```
**Solusi**:
- Windows: Download dari https://ffmpeg.org/, extract ke C:\ffmpeg, tambahkan ke PATH
- Linux: `sudo apt install ffmpeg`
- macOS: `brew install ffmpeg`
- Test dengan command: `ffmpeg -version`

#### 2. RTSP Connection Failed
```
Error opening input file rtsp://...
```
**Solusi**:
- Periksa IP address dan port kamera
- Verifikasi username/password kamera
- Test dengan VLC: Media → Open Network Stream
- Pastikan kamera mendukung RTSP protocol
- Coba format URL yang berbeda sesuai merk kamera

#### 3. Database Connection Error
```
Database connection failed
```
**Solusi**:
- Periksa DATABASE_URL di file .env
- Pastikan PostgreSQL service berjalan
- Test koneksi: `psql -h localhost -U postgres`
- Buat database: `CREATE DATABASE security_camera;`

#### 4. Port 5000 Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solusi**:
- Windows: `netstat -ano | findstr :5000` → `taskkill /PID <PID> /F`
- Linux/macOS: `lsof -ti:5000 | xargs kill -9`
- Atau ubah PORT di file .env

#### 5. Email Not Sending
```
SMTP credentials not provided, email service disabled
```
**Solusi**:
- Lengkapi konfigurasi SMTP di file .env
- Untuk Gmail: gunakan App Password, bukan password biasa
- Test dengan tool online SMTP tester
- Periksa firewall untuk port 587/465

### 🔍 Debugging dan Logs

#### Development Mode:
```bash
npm run dev  # Logs muncul langsung di console
```

#### Production Mode dengan PM2:
```bash
pm2 logs security-camera-system         # Real-time logs
pm2 logs security-camera-system --lines 100  # 100 baris terakhir
pm2 monit                                # Monitoring dashboard
```

#### Manual Log Files:
```bash
# Lihat error logs
cat logs/error.log
tail -f logs/error.log    # Real-time error monitoring

# Lihat application logs  
cat logs/app.log
tail -f logs/app.log      # Real-time app monitoring
```

### 📞 Jika Masih Bermasalah

#### Quick Checks:
```bash
# Verifikasi installations
node --version
npm --version
ffmpeg -version
psql --version

# Test database connection
npm run db:push

# Test port availability
netstat -tulpn | grep 5000   # Linux
netstat -ano | findstr :5000 # Windows
```

#### Reset Complete:
1. Hapus folder `node_modules`
2. Hapus file `.env`
3. Jalankan `install.bat` atau `setup.sh` lagi
4. Konfigurasi ulang file .env sesuai kebutuhan

## 🏭 Production Deployment

### 🚀 Quick Production Setup

#### Windows:
```cmd
# Jalankan production deployment
deploy.bat
```

#### Linux/macOS:
```bash
# Build untuk production
npm run build

# Install PM2 untuk process management
npm install -g pm2

# Start dengan PM2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

### ⚙️ Production Configuration

#### Environment Variables Production:
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (gunakan production database)
DATABASE_URL=postgresql://user:pass@prod-server:5432/security_camera

# RTSP Camera (production camera)
RTSP_URL=rtsp://admin:password@camera-ip:554/stream

# Storage (dengan backup)
VIDEO_OUTPUT_DIR=/var/recordings

# Email (production SMTP)
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@company.com
SMTP_PASS=production-password
```

### 🔒 Security Considerations

#### Network Security:
- Gunakan HTTPS dengan SSL certificate
- Setup firewall untuk port yang diperlukan (5000, 5432, 554)
- VPN untuk akses remote ke sistem

#### Database Security:
- Password yang kuat untuk PostgreSQL
- Backup database secara berkala
- Enkripsi koneksi database

#### File Security:
- Permission yang tepat untuk folder recordings
- Regular cleanup untuk video lama
- Backup storage untuk video penting

### 📊 Monitoring Production

#### System Health:
```bash
# Monitor dengan PM2
pm2 monit

# Check logs
pm2 logs security-camera-system

# Status aplikasi
pm2 status
```

#### Performance Monitoring:
- Monitor disk space untuk recordings
- Monitor RAM usage FFmpeg processes
- Network bandwidth untuk RTSP streams
- Database connection pool usage

## ❓ FAQ (Frequently Asked Questions)

### 🎥 Tentang Recording

**Q: Berapa lama video bisa direkam?**
A: Tidak ada batasan waktu, tergantung storage yang tersedia. Sistem otomatis stop jika disk penuh.

**Q: Format video apa yang dihasilkan?**
A: MP4 dengan codec H.264 untuk video dan AAC untuk audio, kompatibel dengan semua media player.

**Q: Bisa recording multiple kamera sekaligus?**
A: Saat ini support 1 kamera per instance. Untuk multiple kamera, jalankan instance terpisah di port berbeda.

**Q: Apakah bisa recording otomatis berdasarkan jadwal?**
A: Fitur scheduling belum tersedia di versi ini, tapi bisa ditambahkan dengan cron jobs.

### 🔧 Tentang Setup

**Q: Apakah harus install PostgreSQL?**
A: Ya, PostgreSQL diperlukan untuk menyimpan metadata recording dan email queue. Setup script bisa install otomatis.

**Q: Bisa pakai database lain selain PostgreSQL?**
A: Saat ini hanya support PostgreSQL. Untuk database lain perlu modifikasi kode.

**Q: Minimum spek komputer yang diperlukan?**
A: CPU: dual-core, RAM: 2GB, Storage: 50GB+ (tergantung kebutuhan recording).

**Q: Apakah bisa jalan di Raspberry Pi?**
A: Ya, tapi perlu install dependencies manual dan pastikan FFmpeg support hardware encoding.

### 📧 Tentang Email

**Q: Email notification berisi apa saja?**
A: Informasi recording (waktu mulai/selesai, durasi, ukuran file) dan link download jika tersedia.

**Q: Apakah email wajib dikonfigurasi?**
A: Tidak wajib. Sistem tetap bisa recording tanpa email, notifikasi hanya opsional.

**Q: Mendukung email provider apa saja?**
A: Semua provider yang support SMTP (Gmail, Outlook, Yahoo, corporate email servers).

### 🌐 Tentang Kamera

**Q: Merk kamera apa saja yang didukung?**
A: Semua kamera yang support RTSP protocol (Hikvision, Dahua, Axis, dll).

**Q: Bagaimana cara tahu URL RTSP kamera?**
A: Cek manual kamera atau gunakan ONVIF discovery tools. Format umum: `rtsp://user:pass@ip:port/stream`.

**Q: Kamera tidak bisa connect, kenapa?**
A: Periksa IP address, credentials, firewall, dan pastikan kamera support RTSP.

### 🔄 Tentang Maintenance

**Q: Bagaimana backup data recording?**
A: Copy folder `recordings/` ke storage external atau cloud. Database bisa di-export dengan `pg_dump`.

**Q: Apakah perlu maintenance berkala?**
A: Ya, cleanup video lama, backup database, update dependencies secara berkala.

**Q: Bagaimana cara update sistem?**
A: Pull latest code, jalankan `npm install`, restart aplikasi. Backup data sebelum update.

## 📞 Support dan Bantuan

### 💬 Komunitas
- GitHub Issues untuk bug reports
- GitHub Discussions untuk pertanyaan umum
- README.md dan INSTALL.md untuk dokumentasi lengkap

### 🛠️ Development
- Fork repository untuk kontribusi
- Follow coding standards yang ada
- Buat pull request untuk improvements

### 📋 Checklist Troubleshooting
- [ ] Node.js dan npm terinstall dengan benar
- [ ] FFmpeg tersedia di PATH
- [ ] PostgreSQL service berjalan
- [ ] File .env dikonfigurasi dengan benar
- [ ] Port 5000 tidak digunakan aplikasi lain
- [ ] Firewall tidak memblokir koneksi
- [ ] Kamera accessible via RTSP
- [ ] Disk space mencukupi untuk recording

---

## 🏢 Credits

**Developed by ReLogic**  
Security Camera Recording System with Real-time Monitoring

**Catatan**: Sistem ini dirancang untuk kemudahan penggunaan dengan setup otomatis. Untuk masalah atau pertanyaan, refer ke dokumentasi atau buat issue di repository GitHub.

---

*© 2025 ReLogic. All rights reserved.*

### Performance Optimization

#### Video Recording
- Gunakan preset FFmpeg yang sesuai (`ultrafast` untuk real-time, `slow` untuk kualitas)
- Adjust segment time sesuai kebutuhan storage
- Monitor disk space secara berkala

#### Database
- Index pada kolom yang sering di-query
- Regular vacuum dan analyze untuk PostgreSQL
- Monitor connection pool usage

#### Memory Management
- Set limit untuk concurrent recordings
- Implement cleanup untuk old recordings
- Monitor memory usage untuk FFmpeg processes

## 🔒 Security Considerations

### Network Security
- Gunakan HTTPS untuk production deployment
- Implement firewall rules untuk RTSP ports
- Secure database connections dengan SSL

### Access Control
- Implement authentication untuk web interface
- Use strong passwords untuk RTSP cameras
- Regular security updates untuk dependencies

### Data Protection
- Encrypt sensitive data di database
- Secure storage untuk video files
- Regular backup dan disaster recovery plan

## 📈 Monitoring dan Logging

### System Logs
- Application logs di console output
- FFmpeg process logs untuk debugging
- Database query logs untuk performance monitoring

### Health Checks
- Built-in status endpoints untuk monitoring
- WebSocket connection status
- Background job status tracking

### Metrics
- Recording success/failure rates
- Email delivery statistics
- System resource utilization

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Implement changes dengan tests
4. Update documentation
5. Submit pull request

### Code Standards
- TypeScript untuk type safety
- ESLint dan Prettier untuk code formatting
- Comprehensive error handling
- Clear variable dan function naming

## 📄 License

Project ini menggunakan MIT License. Lihat file LICENSE untuk detail lengkap.

## 📞 Support

Untuk pertanyaan, bug reports, atau feature requests:
- GitHub Issues: [Create new issue]
- Documentation: Lihat file `replit.md` untuk technical details
- Community: Join discussion di GitHub Discussions

---

**Catatan**: Sistem ini dirancang untuk environment Replit dengan optimasi khusus untuk deployment di platform tersebut. Untuk deployment di environment lain, mungkin diperlukan penyesuaian konfigurasi.