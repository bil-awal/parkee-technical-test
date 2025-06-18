#!/bin/bash
# =============================================================================
# File: 5a_remote_copy_scp.sh
# Deskripsi: Menyalin file ke server remote menggunakan SCP
# Author: from original by bil-awal
# 
# =============================================================================

# Konfigurasi default
DEFAULT_PORT=22
DEFAULT_SCP_OPTIONS="-r -p -v"
SSH_TIMEOUT=10

# Fungsi untuk menampilkan cara penggunaan
usage() {
    echo "Penggunaan: $0 <file_source> <username> <ip_address> [port] [destination_path]"
    echo ""
    echo "Parameter:"
    echo "  file_source      - File atau direktori yang akan disalin"
    echo "  username         - Username di server remote"
    echo "  ip_address       - IP address server tujuan"
    echo "  port (opsional)  - Port SSH (default: 22)"
    echo "  destination_path (opsional) - Path tujuan (default: /home/username/)"
    echo ""
    echo "Contoh:"
    echo "  $0 /home/user/document.txt admin 192.168.1.100"
    echo "  $0 /var/log/myapp/ deploy 10.0.0.5 2222"
    echo "  $0 backup.tar.gz user 192.168.1.50 22 /tmp/"
    echo ""
    echo "Environment Variables:"
    echo "  SCP_OPTIONS - Custom SCP options (default: $DEFAULT_SCP_OPTIONS)"
    exit 1
}

# Fungsi logging
log() {
    local level="$1"
    shift
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $*"
}

# Validasi jumlah parameter
if [ "$#" -lt 3 ] || [ "$#" -gt 5 ]; then
    echo "Error: Jumlah parameter tidak sesuai!"
    usage
fi

# Variabel
SOURCE_PATH="$1"
REMOTE_USER="$2"
REMOTE_IP="$3"
REMOTE_PORT="${4:-$DEFAULT_PORT}"
REMOTE_DEST="${5:-/home/$REMOTE_USER/}"
SCP_OPTIONS="${SCP_OPTIONS:-$DEFAULT_SCP_OPTIONS}"

# Tambahkan port ke SCP options jika bukan default
if [ "$REMOTE_PORT" != "22" ]; then
    SCP_OPTIONS="$SCP_OPTIONS -P $REMOTE_PORT"
fi

# Fungsi untuk validasi input yang lebih baik
validate_inputs() {
    # Validasi source path
    if [ ! -e "$SOURCE_PATH" ]; then
        log "ERROR" "File atau direktori '$SOURCE_PATH' tidak ditemukan!"
        exit 1
    fi
    
    # Validasi username tidak kosong
    if [ -z "$REMOTE_USER" ]; then
        log "ERROR" "Username tidak boleh kosong!"
        exit 1
    fi
    
    # Validasi port (harus numerik dan dalam range valid)
    if ! [[ "$REMOTE_PORT" =~ ^[0-9]+$ ]] || [ "$REMOTE_PORT" -lt 1 ] || [ "$REMOTE_PORT" -gt 65535 ]; then
        log "ERROR" "Port '$REMOTE_PORT' tidak valid! Harus antara 1-65535."
        exit 1
    fi
    
    # Validasi format IP address atau hostname
    if echo "$REMOTE_IP" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
        # Validasi IP address lebih detail
        IFS='.' read -ra ADDR <<< "$REMOTE_IP"
        for i in "${ADDR[@]}"; do
            if [ "$i" -gt 255 ]; then
                log "ERROR" "IP address '$REMOTE_IP' tidak valid!"
                exit 1
            fi
        done
    else
        log "INFO" "'$REMOTE_IP' terdeteksi sebagai hostname/FQDN."
    fi
}

# Fungsi untuk cek konektivitas yang lebih baik
check_connectivity() {
    log "INFO" "Memeriksa konektivitas ke $REMOTE_IP:$REMOTE_PORT..."
    
    # Test SSH connectivity dengan atau tanpa timeout
    local ssh_test_cmd
    if command -v timeout &> /dev/null; then
        ssh_test_cmd="timeout $SSH_TIMEOUT ssh -p $REMOTE_PORT -o ConnectTimeout=5 -o BatchMode=yes $REMOTE_USER@$REMOTE_IP exit"
    else
        ssh_test_cmd="ssh -p $REMOTE_PORT -o ConnectTimeout=5 -o BatchMode=yes $REMOTE_USER@$REMOTE_IP exit"
    fi
    
    if $ssh_test_cmd 2>/dev/null; then
        log "SUCCESS" "SSH connection berhasil ke $REMOTE_IP:$REMOTE_PORT"
        return 0
    else
        log "WARNING" "SSH connection gagal. Kemungkinan penyebab:"
        echo "  - SSH service tidak berjalan"
        echo "  - Port $REMOTE_PORT diblokir firewall"
        echo "  - Authentication diperlukan"
        echo "  - Server tidak dapat dijangkau"
        
        read -p "Lanjutkan transfer? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Fungsi untuk cek SSH key dengan lebih detail
check_ssh_auth() {
    local key_types=("rsa" "ed25519" "ecdsa" "dsa")
    local found_keys=()
    
    for key_type in "${key_types[@]}"; do
        local key_file="$HOME/.ssh/id_$key_type"
        if [ -f "$key_file" ]; then
            found_keys+=("$key_type")
        fi
    done
    
    if [ ${#found_keys[@]} -gt 0 ]; then
        log "SUCCESS" "SSH keys ditemukan: ${found_keys[*]}"
    else
        log "INFO" "SSH key tidak ditemukan. Anda akan diminta password."
        echo "Tips: Gunakan 'ssh-keygen -t ed25519' untuk membuat SSH key pair."
    fi
    
    # Test SSH agent
    if ssh-add -l &>/dev/null; then
        log "INFO" "SSH agent aktif dengan $(ssh-add -l | wc -l) key(s) loaded."
    fi
}

# Fungsi untuk mendapatkan info file/direktori yang lebih detail
get_source_info() {
    local size type file_count
    
    if [ -f "$SOURCE_PATH" ]; then
        type="File"
        size=$(du -h "$SOURCE_PATH" | cut -f1)
        file_count="1"
    elif [ -d "$SOURCE_PATH" ]; then
        type="Direktori"
        size=$(du -sh "$SOURCE_PATH" | cut -f1)
        file_count=$(find "$SOURCE_PATH" -type f | wc -l)
    else
        type="Unknown"
        size="N/A"
        file_count="N/A"
    fi
    
    echo "Tipe: $type"
    echo "Ukuran: $size"
    echo "Jumlah file: $file_count"
    echo "Path: $SOURCE_PATH"
}

# Fungsi untuk melakukan SCP dengan progress monitoring
perform_scp() {
    local source="$1"
    local destination="$2"
    local start_time=$(date +%s)
    
    echo ""
    log "INFO" "Memulai transfer SCP..."
    echo "Command: scp $SCP_OPTIONS \"$source\" \"$destination\""
    echo ""
    
    # Jalankan SCP
    if scp $SCP_OPTIONS "$source" "$destination"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo ""
        log "SUCCESS" "Transfer berhasil!"
        echo "Waktu transfer: ${duration} detik"
        
        # Verifikasi transfer (opsional)
        if [[ "$SCP_OPTIONS" != *"-q"* ]]; then
            log "INFO" "Verifikasi transfer..."
            # Bisa ditambahkan checksum verification di sini
        fi
        
        return 0
    else
        local exit_code=$?
        echo ""
        log "ERROR" "Transfer gagal dengan exit code: $exit_code"
        return $exit_code
    fi
}

# Fungsi untuk menampilkan summary transfer
show_transfer_summary() {
    echo ""
    echo "=========================================="
    echo "RINGKASAN TRANSFER"
    echo "=========================================="
    echo "Source: $SOURCE_PATH"
    echo "Destination: $DESTINATION"
    echo "Port: $REMOTE_PORT"
    echo "SCP Options: $SCP_OPTIONS"
    echo "=========================================="
}

# Main execution
main() {
    echo "=========================================="
    echo "Remote Copy dengan SCP"
    echo "=========================================="
    
    # Cek dependencies (critical ones only)
    local missing_critical=()
    for cmd in scp ssh; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_critical+=("$cmd")
        fi
    done
    
    if [ ${#missing_critical[@]} -gt 0 ]; then
        log "ERROR" "Command critical tidak ditemukan: ${missing_critical[*]}"
        echo "Install openssh-client package yang diperlukan"
        exit 1
    fi
    
    # Check optional commands
    if ! command -v ping &> /dev/null; then
        log "WARNING" "Command 'ping' tidak tersedia - skip ping test"
    fi
    
    if ! command -v timeout &> /dev/null; then
        log "WARNING" "Command 'timeout' tidak tersedia - menggunakan default timeout"
    fi
    
    # Validasi input
    validate_inputs
    
    # Tampilkan informasi transfer
    echo ""
    echo "Informasi Transfer:"
    echo "-------------------"
    get_source_info
    echo "Tujuan: $REMOTE_USER@$REMOTE_IP:$REMOTE_DEST"
    echo "Port: $REMOTE_PORT"
    echo ""
    
    # Cek konektivitas
    check_connectivity
    
    # Cek SSH authentication
    check_ssh_auth
    
    # Buat destination path
    DESTINATION="$REMOTE_USER@$REMOTE_IP:$REMOTE_DEST"
    
    # Tampilkan summary
    show_transfer_summary
    
    # Konfirmasi sebelum transfer
    echo ""
    read -p "Mulai transfer? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Transfer dibatalkan oleh user."
        exit 0
    fi
    
    # Lakukan SCP
    if perform_scp "$SOURCE_PATH" "$DESTINATION"; then
        echo ""
        echo "=========================================="
        log "SUCCESS" "File/direktori berhasil disalin!"
        echo "Lokasi: $DESTINATION"
        echo "=========================================="
        exit 0
    else
        echo ""
        echo "=========================================="
        log "ERROR" "Gagal menyalin file/direktori."
        echo "Periksa log error di atas untuk detail."
        echo "=========================================="
        exit 1
    fi
}

# Handle Ctrl+C gracefully
trap 'echo ""; log "INFO" "Transfer dibatalkan oleh user."; exit 1' INT

# Jalankan main function
main