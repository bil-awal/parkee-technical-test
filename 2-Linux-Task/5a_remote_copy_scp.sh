#!/bin/bash
# =============================================================================
# File: remote_copy_scp.sh
# Deskripsi: Menyalin file ke server remote menggunakan SCP
# Author: https://github.com/bil-awal
# 
# =============================================================================

# Fungsi untuk menampilkan cara penggunaan
usage() {
    echo "Penggunaan: $0 <file_source> <username> <ip_address>"
    echo ""
    echo "Parameter:"
    echo "  file_source - File atau direktori yang akan disalin"
    echo "  username    - Username di server remote"
    echo "  ip_address  - IP address server tujuan"
    echo ""
    echo "Contoh:"
    echo "  $0 /home/user/document.txt admin 192.168.1.100"
    echo "  $0 /var/log/myapp/ deploy 10.0.0.5"
    exit 1
}

# Validasi jumlah parameter
if [ "$#" -ne 3 ]; then
    echo "Error: Jumlah parameter tidak sesuai!"
    usage
fi

# Variabel
SOURCE_PATH="$1"
REMOTE_USER="$2"
REMOTE_IP="$3"
REMOTE_HOME="/home/$REMOTE_USER"
SCP_OPTIONS="-r -p -v"  # -r: recursive, -p: preserve times, -v: verbose

# Fungsi untuk validasi input
validate_inputs() {
    # Validasi source path
    if [ ! -e "$SOURCE_PATH" ]; then
        echo "Error: File atau direktori '$SOURCE_PATH' tidak ditemukan!"
        exit 1
    fi
    
    # Validasi username tidak kosong
    if [ -z "$REMOTE_USER" ]; then
        echo "Error: Username tidak boleh kosong!"
        exit 1
    fi
    
    # Validasi format IP address (basic check)
    if ! echo "$REMOTE_IP" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
        echo "Warning: '$REMOTE_IP' mungkin bukan IP address yang valid."
        echo "Melanjutkan operasi..."
    fi
}

# Fungsi untuk cek konektivitas
check_connectivity() {
    echo "Memeriksa konektivitas ke $REMOTE_IP..."
    
    # Ping test (timeout 3 detik)
    if ping -c 1 -W 3 "$REMOTE_IP" &> /dev/null; then
        echo "✓ Server $REMOTE_IP dapat dijangkau."
    else
        echo "Warning: Tidak dapat ping ke $REMOTE_IP."
        echo "Server mungkin memblokir ICMP atau tidak dapat dijangkau."
        read -p "Lanjutkan? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Fungsi untuk cek SSH key
check_ssh_key() {
    local ssh_key="$HOME/.ssh/id_rsa"
    local ssh_key_ed25519="$HOME/.ssh/id_ed25519"
    
    if [ -f "$ssh_key" ] || [ -f "$ssh_key_ed25519" ]; then
        echo "✓ SSH key ditemukan."
    else
        echo "Info: SSH key tidak ditemukan. Anda akan diminta password."
        echo "Tips: Gunakan ssh-keygen untuk membuat SSH key pair."
    fi
}

# Fungsi untuk mendapatkan info file/direktori
get_source_info() {
    local size
    local type
    
    if [ -f "$SOURCE_PATH" ]; then
        type="File"
        size=$(du -h "$SOURCE_PATH" | cut -f1)
    elif [ -d "$SOURCE_PATH" ]; then
        type="Direktori"
        size=$(du -sh "$SOURCE_PATH" | cut -f1)
    else
        type="Unknown"
        size="N/A"
    fi
    
    echo "Tipe: $type"
    echo "Ukuran: $size"
    echo "Path: $SOURCE_PATH"
}

# Fungsi untuk melakukan SCP
perform_scp() {
    local source="$1"
    local destination="$2"
    local start_time=$(date +%s)
    
    echo ""
    echo "Menjalankan SCP..."
    echo "Command: scp $SCP_OPTIONS \"$source\" \"$destination\""
    echo ""
    
    # Jalankan SCP
    if scp $SCP_OPTIONS "$source" "$destination"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo ""
        echo "✓ Transfer berhasil!"
        echo "Waktu transfer: ${duration} detik"
        return 0
    else
        echo ""
        echo "✗ Transfer gagal!"
        return 1
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "Remote Copy dengan SCP"
    echo "=========================================="
    
    # Cek apakah scp tersedia
    if ! command -v scp &> /dev/null; then
        echo "Error: scp tidak ditemukan. Install openssh-client terlebih dahulu."
        exit 1
    fi
    
    # Validasi input
    validate_inputs
    
    # Tampilkan informasi transfer
    echo ""
    echo "Informasi Transfer:"
    echo "-------------------"
    get_source_info
    echo "Tujuan: $REMOTE_USER@$REMOTE_IP:$REMOTE_HOME/"
    echo ""
    
    # Cek konektivitas
    check_connectivity
    
    # Cek SSH key
    check_ssh_key
    
    # Konfirmasi sebelum transfer
    echo ""
    read -p "Mulai transfer? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Transfer dibatalkan."
        exit 0
    fi
    
    # Buat destination path
    DESTINATION="$REMOTE_USER@$REMOTE_IP:$REMOTE_HOME/"
    
    # Lakukan SCP
    if perform_scp "$SOURCE_PATH" "$DESTINATION"; then
        echo ""
        echo "=========================================="
        echo "File/direktori berhasil disalin ke:"
        echo "$DESTINATION"
        echo "=========================================="
        exit 0
    else
        echo ""
        echo "=========================================="
        echo "Gagal menyalin file/direktori."
        echo "Periksa permission dan koneksi."
        echo "=========================================="
        exit 1
    fi
}

# Jalankan main function
main