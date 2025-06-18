#!/bin/bash
# =============================================================================
# File: 5b_remote_copy_rsync_modified.sh
# Deskripsi: Menyalin file ke server remote menggunakan RSYNC/SCP (Auto-Fallback)
# Author: Modified from original by bil-awal
# =============================================================================

# Konfigurasi default
DEFAULT_PORT=22
DEFAULT_RSYNC_OPTIONS="-ahz --info=progress2"
DEFAULT_SCP_OPTIONS="-r -p -v"
SSH_TIMEOUT=10

# Global variable untuk transfer method
TRANSFER_METHOD=""

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
RSYNC_OPTIONS="${RSYNC_OPTIONS:-$DEFAULT_RSYNC_OPTIONS}"
SCP_OPTIONS="${SCP_OPTIONS:-$DEFAULT_SCP_OPTIONS}"

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

# Fungsi untuk cek dependencies dan pilih method
select_transfer_method() {
    # Cek SSH (critical)
    if ! command -v ssh &> /dev/null; then
        log "ERROR" "SSH client tidak ditemukan! Install openssh-client."
        exit 1
    fi
    
    # Cek rsync atau scp
    if command -v rsync &> /dev/null; then
        TRANSFER_METHOD="rsync"
        log "SUCCESS" "RSYNC tersedia - menggunakan rsync"
    elif command -v scp &> /dev/null; then
        TRANSFER_METHOD="scp"
        log "WARNING" "RSYNC tidak tersedia - fallback ke SCP"
    else
        log "ERROR" "Baik rsync maupun scp tidak tersedia!"
        exit 1
    fi
    
    # Check optional commands
    if ! command -v timeout &> /dev/null; then
        log "WARNING" "Command 'timeout' tidak tersedia - menggunakan default timeout"
    fi
}

# Fungsi untuk cek konektivitas SSH yang robust
check_ssh_connectivity() {
    log "INFO" "Memeriksa koneksi SSH ke $REMOTE_USER@$REMOTE_IP:$REMOTE_PORT..."
    
    # Prepare SSH options
    local ssh_opts="-p $REMOTE_PORT -o ConnectTimeout=5 -o BatchMode=yes -o LogLevel=ERROR"
    local ssh_cmd="ssh $ssh_opts $REMOTE_USER@$REMOTE_IP exit"
    
    # Test SSH connectivity dengan atau tanpa timeout
    if command -v timeout &> /dev/null; then
        ssh_cmd="timeout $SSH_TIMEOUT $ssh_cmd"
    fi
    
    if $ssh_cmd 2>/dev/null; then
        log "SUCCESS" "SSH connection berhasil ke $REMOTE_IP:$REMOTE_PORT"
        return 0
    else
        log "WARNING" "SSH key-based authentication gagal. Kemungkinan penyebab:"
        echo "  - SSH service tidak berjalan pada port $REMOTE_PORT"
        echo "  - SSH keys belum dikonfigurasi"
        echo "  - Authentication memerlukan password"
        echo "  - Server tidak dapat dijangkau"
        
        read -p "Lanjutkan dengan password authentication? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        return 1
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
        log "INFO" "SSH key tidak ditemukan. Password authentication akan digunakan."
        echo "Tips: Gunakan 'ssh-keygen -t ed25519' untuk membuat SSH key pair."
    fi
    
    # Test SSH agent
    if ssh-add -l &>/dev/null; then
        log "INFO" "SSH agent aktif dengan $(ssh-add -l | wc -l) key(s) loaded."
    fi
}

# Fungsi untuk mendapatkan info file/direktori yang detail
get_source_info() {
    local size type file_count dir_count
    
    if [ -f "$SOURCE_PATH" ]; then
        type="File"
        size=$(du -h "$SOURCE_PATH" | cut -f1)
        file_count="1"
        dir_count="0"
    elif [ -d "$SOURCE_PATH" ]; then
        type="Direktori"
        size=$(du -sh "$SOURCE_PATH" 2>/dev/null | cut -f1)
        file_count=$(find "$SOURCE_PATH" -type f 2>/dev/null | wc -l)
        dir_count=$(find "$SOURCE_PATH" -type d 2>/dev/null | wc -l)
        dir_count=$((dir_count - 1))  # Exclude source directory itself
    else
        type="Unknown"
        size="N/A"
        file_count="N/A"
        dir_count="N/A"
    fi
    
    echo "Tipe: $type"
    echo "Ukuran: $size"
    echo "Files: $file_count"
    if [ "$dir_count" != "0" ] && [ "$dir_count" != "N/A" ]; then
        echo "Directories: $dir_count"
    fi
    echo "Path: $SOURCE_PATH"
}

# Fungsi untuk memilih mode transfer (adapted untuk SCP)
select_transfer_mode() {
    echo ""
    echo "Method: $TRANSFER_METHOD"
    
    if [ "$TRANSFER_METHOD" = "rsync" ]; then
        echo "Pilih mode sinkronisasi RSYNC:"
        echo "1. Normal     - Copy file baru dan update yang berubah"
        echo "2. Mirror     - Sinkronisasi penuh (hapus file di tujuan yang tidak ada di source)"
        echo "3. Backup     - Normal + backup file yang akan dioverwrite"
        echo "4. Checksum   - Validasi dengan checksum (lebih akurat, lebih lambat)"
        echo "5. Dry-run    - Simulasi saja, tidak melakukan transfer"
        echo "6. Custom     - Masukkan opsi rsync sendiri"
        echo ""
        read -p "Pilih mode (1-6) [default: 1]: " mode_choice
        
        case "$mode_choice" in
            2)
                RSYNC_OPTIONS="$RSYNC_OPTIONS --delete"
                log "INFO" "Mode: Mirror (dengan --delete)"
                ;;
            3)
                local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
                RSYNC_OPTIONS="$RSYNC_OPTIONS --backup --backup-dir=$backup_dir"
                log "INFO" "Mode: Backup (backup dir: $backup_dir)"
                ;;
            4)
                RSYNC_OPTIONS="$RSYNC_OPTIONS --checksum"
                log "INFO" "Mode: Checksum validation"
                ;;
            5)
                RSYNC_OPTIONS="$RSYNC_OPTIONS --dry-run"
                log "INFO" "Mode: Dry-run (simulasi)"
                ;;
            6)
                echo "Opsi rsync saat ini: $RSYNC_OPTIONS"
                read -p "Masukkan opsi tambahan: " custom_opts
                if [ -n "$custom_opts" ]; then
                    RSYNC_OPTIONS="$RSYNC_OPTIONS $custom_opts"
                fi
                log "INFO" "Mode: Custom"
                ;;
            *)
                log "INFO" "Mode: Normal"
                ;;
        esac
    else
        echo "Mode SCP: Normal copy (SCP tidak mendukung advanced sync modes)"
        echo "Options yang tersedia untuk SCP:"
        echo "  -r: Recursive (untuk direktori)"
        echo "  -p: Preserve timestamps dan permissions"  
        echo "  -v: Verbose output"
        log "INFO" "Mode: SCP Normal"
    fi
}

# Fungsi untuk bandwidth limiting (works untuk both rsync dan scp)
set_bandwidth_limit() {
    echo ""
    read -p "Apakah ingin membatasi bandwidth? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$TRANSFER_METHOD" = "rsync" ]; then
            echo "Contoh: 1000 (KB/s), 5M (MB/s)"
            read -p "Masukkan limit bandwidth: " bw_limit
            if [ -n "$bw_limit" ]; then
                RSYNC_OPTIONS="$RSYNC_OPTIONS --bwlimit=$bw_limit"
                log "INFO" "RSYNC Bandwidth limit: $bw_limit"
            fi
        else
            echo "Contoh: 1000 (KB/s)"
            read -p "Masukkan limit bandwidth (KB/s): " bw_limit
            if [ -n "$bw_limit" ]; then
                SCP_OPTIONS="$SCP_OPTIONS -l $bw_limit"
                log "INFO" "SCP Bandwidth limit: ${bw_limit} KB/s"
            fi
        fi
    fi
}

# Fungsi untuk exclude patterns (hanya untuk rsync)
create_exclude_patterns() {
    if [ "$TRANSFER_METHOD" != "rsync" ]; then
        log "INFO" "Exclude patterns hanya tersedia untuk RSYNC"
        return
    fi
    
    local exclude_file="/tmp/rsync_exclude_$$"
    
    echo ""
    read -p "Apakah ada file/direktori yang ingin di-exclude? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Pilih exclude method:"
        echo "1. Manual input"
        echo "2. Common patterns (logs, cache, tmp files)"
        echo "3. Development patterns (node_modules, .git, build dirs)"
        read -p "Pilih (1-3): " exclude_method
        
        case "$exclude_method" in
            2)
                cat > "$exclude_file" << EOF
*.log
*.tmp
*.cache
*~
.DS_Store
Thumbs.db
EOF
                log "INFO" "Common exclude patterns applied"
                ;;
            3)
                cat > "$exclude_file" << EOF
node_modules/
.git/
.svn/
.hg/
__pycache__/
*.pyc
*.pyo
.pytest_cache/
target/
build/
dist/
.gradle/
.idea/
.vscode/
*.swp
*.swo
EOF
                log "INFO" "Development exclude patterns applied"
                ;;
            *)
                echo "Masukkan pattern yang ingin di-exclude (satu per baris, akhiri dengan CTRL+D):"
                echo "Contoh: *.log, node_modules/, .git/, __pycache__/"
                cat > "$exclude_file"
                ;;
        esac
        
        if [ -s "$exclude_file" ]; then
            RSYNC_OPTIONS="$RSYNC_OPTIONS --exclude-from=$exclude_file"
            echo "✓ Exclude patterns tersimpan."
            echo "Preview exclude patterns:"
            cat "$exclude_file" | sed 's/^/  - /'
        fi
    fi
}

# Fungsi untuk melakukan transfer dengan fallback
perform_transfer() {
    local source="$1"
    local destination="$2"
    local start_time=$(date +%s)
    
    echo ""
    log "INFO" "Memulai transfer menggunakan $TRANSFER_METHOD..."
    echo "Dari: $source"
    echo "Ke: $destination"
    echo "Port: $REMOTE_PORT"
    
    case "$TRANSFER_METHOD" in
        "rsync")
            # Tambahkan trailing slash untuk direktori (rsync behavior)
            if [ -d "$source" ]; then
                source="${source%/}/"
            fi
            
            echo "Options: $RSYNC_OPTIONS"
            echo ""
            
            # Build rsync command
            local rsync_cmd
            if [ "$REMOTE_PORT" != "22" ]; then
                rsync_cmd="rsync $RSYNC_OPTIONS -e \"ssh -p $REMOTE_PORT\" \"$source\" \"$destination\""
            else
                rsync_cmd="rsync $RSYNC_OPTIONS \"$source\" \"$destination\""
            fi
            
            if eval $rsync_cmd; then
                local end_time=$(date +%s)
                local duration=$((end_time - start_time))
                
                echo ""
                log "SUCCESS" "RSYNC transfer berhasil!"
                echo "Waktu transfer: ${duration} detik"
                
                # Cleanup exclude file jika ada
                if [[ "$RSYNC_OPTIONS" == *"--exclude-from"* ]]; then
                    rm -f /tmp/rsync_exclude_$$
                fi
                
                return 0
            else
                local exit_code=$?
                log "ERROR" "RSYNC transfer gagal dengan exit code: $exit_code"
                return $exit_code
            fi
            ;;
        "scp")
            echo "Options: $SCP_OPTIONS"
            echo ""
            
            # Build SCP command
            local scp_cmd
            if [ "$REMOTE_PORT" != "22" ]; then
                SCP_OPTIONS="$SCP_OPTIONS -P $REMOTE_PORT"
            fi
            
            scp_cmd="scp $SCP_OPTIONS \"$source\" \"$destination\""
            
            if eval $scp_cmd; then
                local end_time=$(date +%s)
                local duration=$((end_time - start_time))
                
                echo ""
                log "SUCCESS" "SCP transfer berhasil!"
                echo "Waktu transfer: ${duration} detik"
                return 0
            else
                local exit_code=$?
                log "ERROR" "SCP transfer gagal dengan exit code: $exit_code"
                return $exit_code
            fi
            ;;
    esac
}

# Fungsi untuk menampilkan tips optimasi
suggest_optimization() {
    echo ""
    if [ "$TRANSFER_METHOD" = "rsync" ]; then
        echo "💡 Tips RSYNC Optimization:"
        echo "📁 File besar: --partial --append-verify --inplace"
        echo "🌐 Network: --compress-level=6 --bwlimit=RATE"
        echo "💾 Backup: --backup --backup-dir=backup_\$(date +%Y%m%d)"
        echo "🔍 Validasi: --checksum (akurat) atau --size-only (cepat)"
        echo "📊 Monitoring: --progress --stats -v"
        echo "🚀 Performance: --whole-file (LAN) atau --no-whole-file (WAN)"
    else
        echo "💡 Tips SCP Optimization:"
        echo "📁 Compression: -C (enable compression)"
        echo "🌐 Network: -l LIMIT (bandwidth limit)"
        echo "🔐 Security: -o (SSH options)"
        echo "📊 Monitoring: -v (verbose output)"
    fi
}

# Fungsi untuk menampilkan transfer summary
show_transfer_summary() {
    echo ""
    echo "=========================================="
    echo "RINGKASAN TRANSFER ($TRANSFER_METHOD)"
    echo "=========================================="
    echo "Source: $SOURCE_PATH"
    echo "Destination: $DESTINATION"
    echo "Port: $REMOTE_PORT"
    echo "Method: $TRANSFER_METHOD"
    if [ "$TRANSFER_METHOD" = "rsync" ]; then
        echo "Options: $RSYNC_OPTIONS"
    else
        echo "Options: $SCP_OPTIONS"
    fi
    echo "=========================================="
}

# Main execution
main() {
    echo "=========================================="
    echo "Remote Copy (RSYNC/SCP Hybrid)"
    echo "=========================================="
    
    # Select transfer method
    select_transfer_method
    
    # Validasi input
    validate_inputs
    
    # Tampilkan informasi transfer
    echo ""
    echo "Informasi Transfer:"
    echo "-------------------"
    get_source_info
    echo "Tujuan: $REMOTE_USER@$REMOTE_IP:$REMOTE_DEST"
    echo "Port: $REMOTE_PORT"
    echo "Method: $TRANSFER_METHOD"
    
    # Cek konektivitas SSH
    check_ssh_connectivity
    
    # Cek SSH authentication
    check_ssh_auth
    
    # Pilih mode transfer
    select_transfer_mode
    
    # Set bandwidth limit
    set_bandwidth_limit
    
    # Tanyakan exclude patterns (hanya untuk rsync)
    create_exclude_patterns
    
    # Tampilkan tips optimasi
    suggest_optimization
    
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
    
    # Lakukan transfer
    if perform_transfer "$SOURCE_PATH" "$DESTINATION"; then
        echo ""
        echo "=========================================="
        log "SUCCESS" "File/direktori berhasil ditransfer!"
        echo "Lokasi: $DESTINATION"
        echo "=========================================="
        exit 0
    else
        echo ""
        echo "=========================================="
        log "ERROR" "Gagal melakukan transfer."
        echo "=========================================="
        exit 1
    fi
}

# Handle Ctrl+C gracefully
trap 'echo ""; log "INFO" "Transfer dibatalkan oleh user."; exit 1' INT

# Jalankan main function
main