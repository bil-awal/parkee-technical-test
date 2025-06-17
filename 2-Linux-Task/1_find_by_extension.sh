#!/bin/bash
# =============================================================================
# File: find_by_extension.sh
# Deskripsi: Mencari semua file dengan ekstensi tertentu dalam direktori
# Author: https://github.com/bil-awal
# 
# =============================================================================

# Fungsi untuk menampilkan cara penggunaan
usage() {
    echo "Penggunaan: $0 <direktori> <ekstensi>"
    echo "Contoh: $0 /home/user txt"
    echo "        $0 /var/log log"
    exit 1
}

# Validasi jumlah parameter
if [ "$#" -ne 2 ]; then
    echo "Error: Jumlah parameter tidak sesuai!"
    usage
fi

# Assign parameter ke variabel dengan nama yang jelas
SEARCH_DIR="$1"
FILE_EXTENSION="$2"

# Validasi direktori
if [ ! -d "$SEARCH_DIR" ]; then
    echo "Error: Direktori '$SEARCH_DIR' tidak ditemukan!"
    exit 1
fi

# Validasi ekstensi tidak kosong
if [ -z "$FILE_EXTENSION" ]; then
    echo "Error: Ekstensi file tidak boleh kosong!"
    exit 1
fi

# Tampilkan informasi pencarian
echo "=========================================="
echo "Mencari file dengan ekstensi: .$FILE_EXTENSION"
echo "Dalam direktori: $SEARCH_DIR"
echo "=========================================="

# Counter untuk menghitung jumlah file yang ditemukan
FILE_COUNT=0

# Lakukan pencarian menggunakan find dengan error handling
# -type f: hanya mencari file (bukan direktori)
# -name: mencari berdasarkan nama file
# 2>/dev/null: redirect error ke null untuk menghindari pesan permission denied
while IFS= read -r file; do
    echo "$file"
    ((FILE_COUNT++))
done < <(find "$SEARCH_DIR" -type f -name "*.$FILE_EXTENSION" 2>/dev/null)

# Tampilkan hasil summary
echo "=========================================="
echo "Total file ditemukan: $FILE_COUNT"
echo "=========================================="

# Exit dengan status sukses
exit 0