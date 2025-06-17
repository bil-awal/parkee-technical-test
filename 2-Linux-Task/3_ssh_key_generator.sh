#!/bin/bash
# =============================================================================
# File: ssh_key_generator.sh
# Deskripsi: Membuat SSH key pair dan menyimpannya di direktori yang ditentukan
# Author: https://github.com/bil-awal
# 
# =============================================================================

# Fungsi untuk menampilkan cara penggunaan
usage() {
    echo "Penggunaan: $0 <direktori_tujuan>"
    echo "Contoh: $0 /home/user/.ssh"
    echo "        $0 /opt/ssh_keys"
    exit 1
}

# Validasi parameter
if [ "$#" -ne 1 ]; then
    echo "Error: Parameter direktori tujuan diperlukan!"
    usage
fi

# Variabel
TARGET_DIR="$1"
KEY_NAME="id_rsa_$(date +%Y%m%d_%H%M%S)"
KEY_PATH="$TARGET_DIR/$KEY_NAME"
KEY_TYPE="rsa"
KEY_SIZE="4096"
COMMENT="Generated on $(hostname) at $(date)"

# Fungsi untuk membuat direktori dengan permission yang aman
create_secure_directory() {
    local dir="$1"
    
    # Buat direktori jika belum ada
    if [ ! -d "$dir" ]; then
        echo "Direktori '$dir' tidak ditemukan. Membuat direktori..."
        if mkdir -p "$dir"; then
            echo "Direktori berhasil dibuat."
        else
            echo "Error: Gagal membuat direktori '$dir'"
            exit 1
        fi
    fi
    
    # Set permission yang aman untuk direktori SSH
    chmod 700 "$dir"
    echo "Permission direktori diset ke 700 (rwx------)"
}

# Fungsi untuk generate SSH key
generate_ssh_key() {
    echo "=========================================="
    echo "Membuat SSH Key Pair"
    echo "=========================================="
    echo "Tipe Key: $KEY_TYPE"
    echo "Ukuran Key: $KEY_SIZE bits"
    echo "Lokasi: $KEY_PATH"
    echo "=========================================="
    
    # Generate SSH key dengan ssh-keygen
    # -t: tipe key (rsa, dsa, ecdsa, ed25519)
    # -b: ukuran key dalam bits
    # -f: nama file output
    # -C: komentar
    # -N: passphrase (kosong untuk no passphrase)
    if ssh-keygen -t "$KEY_TYPE" \
                  -b "$KEY_SIZE" \
                  -f "$KEY_PATH" \
                  -C "$COMMENT" \
                  -N ""; then
        echo "SSH key pair berhasil dibuat!"
    else
        echo "Error: Gagal membuat SSH key pair"
        exit 1
    fi
}

# Fungsi untuk mengatur permission yang aman untuk key files
secure_key_permissions() {
    # Private key harus read-only untuk owner saja
    chmod 600 "$KEY_PATH"
    echo "Permission private key diset ke 600 (rw-------)"
    
    # Public key bisa dibaca oleh others
    chmod 644 "$KEY_PATH.pub"
    echo "Permission public key diset ke 644 (rw-r--r--)"
}

# Fungsi untuk menampilkan informasi key
display_key_info() {
    echo ""
    echo "=========================================="
    echo "INFORMASI SSH KEY"
    echo "=========================================="
    echo "Private Key: $KEY_PATH"
    echo "Public Key: $KEY_PATH.pub"
    echo ""
    echo "Fingerprint:"
    ssh-keygen -lf "$KEY_PATH.pub"
    echo ""
    echo "Public Key Content:"
    echo "---"
    cat "$KEY_PATH.pub"
    echo "---"
    echo ""
    echo "Untuk menggunakan key ini:"
    echo "1. Copy public key ke server tujuan:"
    echo "   ssh-copy-id -i $KEY_PATH.pub user@server"
    echo ""
    echo "2. Atau tambahkan manual ke ~/.ssh/authorized_keys di server"
    echo ""
    echo "3. Gunakan private key untuk koneksi:"
    echo "   ssh -i $KEY_PATH user@server"
    echo "=========================================="
}

# Fungsi untuk backup key yang ada (jika ada)
backup_existing_keys() {
    local backup_dir="$TARGET_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    local found_keys=false
    
    # Cek apakah ada file key di direktori
    for key_file in "$TARGET_DIR"/id_*; do
        if [ -f "$key_file" ]; then
            found_keys=true
            break
        fi
    done
    
    if [ "$found_keys" = true ]; then
        echo "Ditemukan SSH key yang sudah ada. Membuat backup..."
        mkdir -p "$backup_dir"
        
        # Backup semua file key yang ada
        for key_file in "$TARGET_DIR"/id_*; do
            if [ -f "$key_file" ]; then
                cp -p "$key_file" "$backup_dir/"
            fi
        done
        
        echo "Backup disimpan di: $backup_dir"
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "SSH Key Generator"
    echo "=========================================="
    
    # Cek apakah ssh-keygen tersedia
    if ! command -v ssh-keygen &> /dev/null; then
        echo "Error: ssh-keygen tidak ditemukan. Install openssh-client terlebih dahulu."
        exit 1
    fi
    
    # Buat direktori tujuan dengan permission yang aman
    create_secure_directory "$TARGET_DIR"
    
    # Backup key yang ada (opsional)
    backup_existing_keys
    
    # Generate SSH key pair
    generate_ssh_key
    
    # Set permission yang aman
    secure_key_permissions
    
    # Tampilkan informasi key
    display_key_info
    
    echo "Proses selesai!"
}

# Jalankan main function
main