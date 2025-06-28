#!/bin/bash

# Security Camera System - Launcher Script
# Linux/macOS Version

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}      Security Camera System - Launcher${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo
}

print_header

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Dependencies belum terinstall!"
    echo "Menjalankan installer..."
    chmod +x setup.sh
    ./setup.sh
    echo
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARNING]${NC} File .env belum ada!"
    echo "Menjalankan setup..."
    chmod +x setup.sh
    ./setup.sh
    echo
fi

echo -e "${BLUE}[INFO]${NC} Memulai Security Camera System..."
echo
echo -e "${GREEN}Akses aplikasi di: http://localhost:5000${NC}"
echo -e "${YELLOW}Tekan Ctrl+C untuk menghentikan aplikasi${NC}"
echo

npm run dev