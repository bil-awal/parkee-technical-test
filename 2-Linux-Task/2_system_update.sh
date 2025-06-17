#!/bin/bash
# =============================================================================
# File: system_update.sh
# Deskripsi: Otomatis memperbarui semua package di sistem dengan logging
# Author: https://github.com/bil-awal
# 
# =============================================================================

# Set strict mode untuk error handling yang lebih baik
set -euo pipefail

# Definisi variabel global
LOG_DIR="/var/log/system_updates"
LOG_FILE="$LOG_DIR/update_$(date +%Y%m%d_%H%M%S).log"
DISTRO=""
PKG_MANAGER=""

# Fungsi untuk membuat direktori log jika belum ada
create_log_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        # Coba buat direktori, jika gagal gunakan /tmp
        if ! sudo mkdir -p "$LOG_DIR" 2>/dev/null; then
            LOG_DIR="/tmp/system_updates"
            mkdir -p "$LOG_DIR"
            LOG_FILE="$LOG_DIR/update_$(date +%Y%m%d_%H%M%S).log"
        fi
    fi
}

# Fungsi untuk menulis log dengan timestamp
log_message() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE"
}

# Fungsi untuk mendeteksi distribusi Linux dan package manager
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        
        # Tentukan package manager berdasarkan distribusi
        case $DISTRO in
            ubuntu|debian)
                PKG_MANAGER="apt"
                ;;
            fedora|rhel|centos)
                PKG_MANAGER="yum"
                # Untuk Fedora versi baru dan RHEL 8+
                if command -v dnf &> /dev/null; then
                    PKG_MANAGER="dnf"
                fi
                ;;
            arch|manjaro)
                PKG_MANAGER="pacman"
                ;;
            opensuse*)
                PKG_MANAGER="zypper"
                ;;
            *)
                log_message "Error: Distribusi tidak dikenal atau tidak didukung: $DISTRO"
                exit 1
                ;;
        esac
    else
        log_message "Error: File /etc/os-release tidak ditemukan. Tidak dapat mendeteksi distribusi."
        exit 1
    fi
}

# Fungsi untuk memeriksa apakah user memiliki akses sudo
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_message "Warning: Script memerlukan akses sudo. Meminta password..."
        if ! sudo true; then
            log_message "Error: Gagal mendapatkan akses sudo."
            exit 1
        fi
    fi
}

# Fungsi untuk update sistem berdasarkan package manager
update_system() {
    log_message "Memulai update sistem menggunakan $PKG_MANAGER..."
    
    case $PKG_MANAGER in
        apt)
            # Update package list
            log_message "Mengupdate package list..."
            if sudo apt update >> "$LOG_FILE" 2>&1; then
                log_message "Package list berhasil diupdate."
            else
                log_message "Error: Gagal mengupdate package list."
                return 1
            fi
            
            # Upgrade packages
            log_message "Mengupgrade packages..."
            if sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y >> "$LOG_FILE" 2>&1; then
                log_message "Packages berhasil diupgrade."
            else
                log_message "Error: Gagal mengupgrade packages."
                return 1
            fi
            
            # Autoremove unused packages
            log_message "Menghapus packages yang tidak terpakai..."
            sudo apt autoremove -y >> "$LOG_FILE" 2>&1
            ;;
            
        yum|dnf)
            log_message "Mengupdate semua packages..."
            if sudo $PKG_MANAGER update -y >> "$LOG_FILE" 2>&1; then
                log_message "Packages berhasil diupdate."
            else
                log_message "Error: Gagal mengupdate packages."
                return 1
            fi
            
            # Clean cache
            log_message "Membersihkan cache..."
            sudo $PKG_MANAGER clean all >> "$LOG_FILE" 2>&1
            ;;
            
        pacman)
            log_message "Mengupdate sistem..."
            if sudo pacman -Syu --noconfirm >> "$LOG_FILE" 2>&1; then
                log_message "Sistem berhasil diupdate."
            else
                log_message "Error: Gagal mengupdate sistem."
                return 1
            fi
            ;;
            
        zypper)
            log_message "Mengupdate sistem..."
            if sudo zypper update -y >> "$LOG_FILE" 2>&1; then
                log_message "Sistem berhasil diupdate."
            else
                log_message "Error: Gagal mengupdate sistem."
                return 1
            fi
            ;;
    esac
}

# Fungsi untuk menampilkan ringkasan update
show_summary() {
    log_message "=========================================="
    log_message "RINGKASAN UPDATE SISTEM"
    log_message "=========================================="
    log_message "Distribusi: $DISTRO"
    log_message "Package Manager: $PKG_MANAGER"
    log_message "Log File: $LOG_FILE"
    
    # Hitung jumlah packages yang diupdate (jika memungkinkan)
    case $PKG_MANAGER in
        apt)
            local upgraded=$(grep -c "^Unpacking" "$LOG_FILE" 2>/dev/null || echo "0")
            log_message "Packages yang diupgrade: $upgraded"
            ;;
    esac
    
    log_message "=========================================="
}

# Main execution
main() {
    echo "=========================================="
    echo "Script Automasi Update Sistem"
    echo "=========================================="
    
    # Buat direktori log
    create_log_dir
    
    # Mulai logging
    log_message "Memulai proses update sistem..."
    
    # Deteksi distribusi
    detect_distro
    log_message "Terdeteksi: $DISTRO dengan package manager $PKG_MANAGER"
    
    # Cek akses sudo
    check_sudo
    
    # Lakukan update
    if update_system; then
        log_message "Update sistem berhasil diselesaikan."
        show_summary
        exit 0
    else
        log_message "Update sistem gagal. Periksa log untuk detail."
        exit 1
    fi
}

# Jalankan main function
main