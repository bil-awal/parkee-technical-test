#!/bin/bash
# =============================================================================
# File: remote_copy_rsync.sh
# Deskripsi: Menyalin file ke server remote menggunakan RSYNC
# Author: http://github.com/bil-awal
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
# Opsi rsync: -a (archive), -v (verbose), -h (human readable), 
# -P (progress + partial), -z (compress), --delete (sync deletions)
RSYNC_OPTIONS="-avhPz --stats"

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

# Fungsi untuk cek konektivitas SSH
check_ssh_connectivity() {
    echo "Memeriksa koneksi SSH ke $REMOTE_USER@$REMOTE_IP..."
    
    # Test SSH connection dengan timeout
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$REMOTE_IP" exit 2>/dev/null; then
        echo "✓ Koneksi SSH berhasil."
        return 0
    else
        echo "Info: Tidak dapat melakukan koneksi SSH tanpa password."
        echo "Anda mungkin akan diminta password saat transfer."
        return 1
    fi
}

# Fungsi untuk mendapatkan info file/direktori
get_source_info() {
    local size
    local type
    local file_count
    
    if [ -f "$SOURCE_PATH" ]; then
        type="File"
        size=$(du -h "$SOURCE_PATH" | cut -f1)
        file_count="1 file"
    elif [ -d "$SOURCE_PATH" ]; then
        type="Direktori"
        size=$(du -sh "$SOURCE_PATH" | cut -f1)
        file_count=$(find "$SOURCE_PATH" -type f | wc -l)
        file_count="$file_count files"
    else
        type="Unknown"
        size="N/A"
        file_count="N/A"
    fi
    
    echo "Tipe: $type"
    echo "Ukuran: $size"
    echo "Jumlah: $file_count"
    echo "Path: $SOURCE_PATH"
}

# Fungsi untuk memilih mode rsync
select_rsync_mode() {
    echo ""
    echo "Pilih mode sinkronisasi:"
    echo "1. Normal - Copy file baru dan update yang berubah"
    echo "2. Mirror - Sinkronisasi penuh (hapus file di tujuan yang tidak ada di source)"
    echo "3. Dry-run - Simulasi saja, tidak melakukan transfer"
    echo ""
    read -p "Pilih mode (1/2/3) [default: 1]: " mode_choice
    
    case "$mode_choice" in
        2)
            RSYNC_OPTIONS="$RSYNC_OPTIONS --delete"
            echo "Mode: Mirror (dengan --delete)"
            ;;
        3)
            RSYNC_OPTIONS="$RSYNC_OPTIONS --dry-run"
            echo "Mode: Dry-run (simulasi)"
            ;;
        *)
            echo "Mode: Normal"
            ;;
    esac
}

# Fungsi untuk membuat exclude file jika diperlukan
create_exclude_patterns() {
    local exclude_file="/tmp/rsync_exclude_$$"
    
    echo "Apakah ada file/direktori yang ingin di-exclude? (y/n): "
    read -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Masukkan pattern yang ingin di-exclude (satu per baris, akhiri dengan CTRL+D):"
        cat > "$exclude_file"
        
        if [ -s "$exclude_file" ]; then
            RSYNC_OPTIONS="$RSYNC_OPTIONS --exclude-from=$exclude_file"
            echo "Exclude patterns tersimpan."
        fi
    fi
}

# Fungsi untuk melakukan rsync
perform_rsync() {
    local source="$1"
    local destination="$2"
    local start_time=$(date +%s)
    
    # Tambahkan trailing slash untuk direktori (rsync behavior)
    if [ -d "$source" ]; then
        source="${source%/}/"
    fi
    
    echo ""
    echo "=========================================="
    echo "Menjalankan RSYNC..."
    echo "Command: rsync $RSYNC_OPTIONS \"$source\" \"$destination\""
    echo "=========================================="
    echo ""
    
    # Jalankan rsync
    if rsync $RSYNC_OPTIONS "$source" "$destination"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo ""
        echo "=========================================="
        echo "✓ Transfer berhasil!"
        echo "Waktu transfer: ${duration} detik"
        
        # Cleanup exclude file jika ada
        if [[ "$RSYNC_OPTIONS" == *"--exclude-from"* ]]; then
            rm -f /tmp/rsync_exclude_$$
        fi
        
        return 0
    else
        echo ""
        echo "✗ Transfer gagal!"
        
        # Cleanup exclude file jika ada
        if [[ "$RSYNC_OPTIONS" == *"--exclude-from"* ]]; then
            rm -f /tmp/rsync_exclude_$$
        fi
        
        return 1
    fi
}

# Fungsi untuk setup rsync daemon config (opsional)
suggest_rsync_optimization() {
    echo ""
    echo "Tips Optimasi RSYNC:"
    echo "-------------------"
    echo "1. Untuk transfer file besar, gunakan: --partial --append-verify"
    echo "2. Untuk bandwidth terbatas, gunakan: --bwlimit=KBPS"
    echo "3. Untuk backup incremental, gunakan: --backup --backup-dir=DIR"
    echo "4. Untuk checksum validation, gunakan: --checksum"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Remote Copy dengan RSYNC"
    echo "=========================================="
    
    # Cek apakah rsync tersedia
    if ! command -v rsync &> /dev/null; then
        echo "Error: rsync tidak ditemukan. Install rsync terlebih dahulu:"
        echo "  Ubuntu/Debian: sudo apt install rsync"
        echo "  RHEL/CentOS: sudo yum install rsync"
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
    
    # Cek konektivitas SSH
    check_ssh_connectivity
    
    # Pilih mode rsync
    select_rsync_mode
    
    # Tanyakan exclude patterns
    create_exclude_patterns
    
    # Tampilkan tips optimasi
    suggest_rsync_optimization
    
    # Konfirmasi sebelum transfer
    echo "Siap melakukan transfer dengan opsi: $RSYNC_OPTIONS"
    read -p "Mulai transfer? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Transfer dibatalkan."
        exit 0
    fi
    
    # Buat destination path
    DESTINATION="$REMOTE_USER@$REMOTE_IP:$REMOTE_HOME/"
    
    # Lakukan rsync
    if perform_rsync "$SOURCE_PATH" "$DESTINATION"; then
        echo "=========================================="
        echo "File/direktori berhasil disinkronisasi!"
        echo "=========================================="
        exit 0
    else
        echo "=========================================="
        echo "Gagal melakukan sinkronisasi."
        echo "Periksa log error di atas."
        echo "=========================================="
        exit 1
    fi
}

# Jalankan main function
main