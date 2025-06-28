#!/bin/bash

# Security Camera System - Auto Setup Script
# Linux/macOS Version

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}    Security Camera System - Auto Setup${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

install_node() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Installing Node.js for Linux..."
        if check_command "apt"; then
            sudo apt update
            sudo apt install -y nodejs npm
        elif check_command "yum"; then
            sudo yum install -y nodejs npm
        elif check_command "dnf"; then
            sudo dnf install -y nodejs npm
        else
            print_error "Package manager tidak didukung. Install Node.js manual dari https://nodejs.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Installing Node.js for macOS..."
        if check_command "brew"; then
            brew install node
        else
            print_error "Homebrew tidak ditemukan. Install dari https://brew.sh/ atau download Node.js dari https://nodejs.org/"
            exit 1
        fi
    fi
}

install_ffmpeg() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Installing FFmpeg for Linux..."
        if check_command "apt"; then
            sudo apt install -y ffmpeg
        elif check_command "yum"; then
            sudo yum install -y ffmpeg
        elif check_command "dnf"; then
            sudo dnf install -y ffmpeg
        else
            print_warning "Tidak bisa install FFmpeg otomatis. Install manual dengan package manager Anda."
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Installing FFmpeg for macOS..."
        if check_command "brew"; then
            brew install ffmpeg
        else
            print_warning "Homebrew tidak ditemukan. Install FFmpeg manual."
        fi
    fi
}

install_postgresql() {
    read -p "Install PostgreSQL? (y/n): " install_pg
    if [[ $install_pg =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if check_command "apt"; then
                sudo apt install -y postgresql postgresql-contrib
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            elif check_command "yum"; then
                sudo yum install -y postgresql-server postgresql-contrib
                sudo postgresql-setup initdb
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if check_command "brew"; then
                brew install postgresql
                brew services start postgresql
            fi
        fi
        print_success "PostgreSQL terinstall. Setup database manual sesuai kebutuhan."
    fi
}

main() {
    print_header
    
    # Check Node.js
    if ! check_command "node"; then
        print_warning "Node.js tidak ditemukan!"
        read -p "Install Node.js sekarang? (y/n): " install_node_choice
        if [[ $install_node_choice =~ ^[Yy]$ ]]; then
            install_node
        else
            print_error "Node.js diperlukan untuk menjalankan aplikasi!"
            exit 1
        fi
    else
        print_success "Node.js ditemukan: $(node --version)"
    fi
    
    # Check npm
    if ! check_command "npm"; then
        print_error "npm tidak ditemukan! Install Node.js dengan benar."
        exit 1
    fi
    
    # Check FFmpeg
    if ! check_command "ffmpeg"; then
        print_warning "FFmpeg tidak ditemukan!"
        read -p "Install FFmpeg sekarang? (y/n): " install_ffmpeg_choice
        if [[ $install_ffmpeg_choice =~ ^[Yy]$ ]]; then
            install_ffmpeg
        else
            print_warning "FFmpeg diperlukan untuk video recording!"
        fi
    else
        print_success "FFmpeg ditemukan"
    fi
    
    # Check PostgreSQL
    if ! check_command "psql"; then
        print_warning "PostgreSQL tidak ditemukan!"
        install_postgresql
    else
        print_success "PostgreSQL ditemukan"
    fi
    
    print_info "Installing Node.js dependencies..."
    npm install
    
    print_info "Creating recordings directory..."
    mkdir -p recordings
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        print_info "Creating .env template..."
        cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

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
EOL
        
        echo
        print_warning "File .env telah dibuat!"
        print_info "Silakan edit file .env dan sesuaikan konfigurasi:"
        print_info "- DATABASE_URL: URL koneksi database PostgreSQL"
        print_info "- RTSP_URL: URL RTSP stream kamera Anda"
        print_info "- SMTP_*: Konfigurasi email (opsional)"
        echo
        
        read -p "Buka file .env untuk edit sekarang? (y/n): " edit_env
        if [[ $edit_env =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    fi
    
    print_info "Setting up database schema..."
    if npm run db:push; then
        print_success "Database schema setup berhasil!"
    else
        print_warning "Database setup gagal. Pastikan DATABASE_URL sudah benar di .env"
        print_info "Anda bisa menjalankan 'npm run db:push' nanti setelah konfigurasi database."
    fi
    
    echo
    print_success "==============================================="
    print_success "           Setup Selesai!"
    print_success "==============================================="
    echo
    print_info "Untuk menjalankan aplikasi:"
    print_info "  npm run dev        - Development mode"
    print_info "  npm run build      - Build untuk production"
    print_info "  npm run start      - Production mode"
    echo
    print_info "Akses aplikasi di: http://localhost:5000"
    echo
    print_info "File konfigurasi penting:"
    print_info "  .env              - Environment variables"
    print_info "  recordings/       - Folder penyimpanan video"
    print_info "  README.md         - Dokumentasi lengkap"
    echo
    
    read -p "Jalankan aplikasi sekarang? (y/n): " run_now
    if [[ $run_now =~ ^[Yy]$ ]]; then
        print_info "Memulai aplikasi..."
        npm run dev
    fi
    
    echo
    print_success "Terima kasih telah menggunakan Security Camera System!"
}

# Make script executable
chmod +x "$0"

# Run main function
main "$@"