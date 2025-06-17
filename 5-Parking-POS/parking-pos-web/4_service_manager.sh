#!/bin/bash
# =============================================================================
# File: service_manager.sh
# Deskripsi: Mengelola service (start, stop, status) di sistem Linux
# Author: https://github.com/bil-awal
# 
# =============================================================================

# Fungsi untuk menampilkan cara penggunaan
usage() {
    echo "Penggunaan: $0 <action> <service_name>"
    echo ""
    echo "Actions:"
    echo "  start   - Memulai service"
    echo "  stop    - Menghentikan service"
    echo "  status  - Memeriksa status service"
    echo "  restart - Restart service"
    echo "  enable  - Enable service saat boot"
    echo "  disable - Disable service saat boot"
    echo ""
    echo "Contoh:"
    echo "  $0 start nginx"
    echo "  $0 stop apache2"
    echo "  $0 status postgresql"
    exit 1
}

# Validasi jumlah parameter
if [ "$#" -ne 2 ]; then
    echo "Error: Jumlah parameter tidak sesuai!"
    usage
fi

# Variabel
ACTION="$1"
SERVICE_NAME="$2"
INIT_SYSTEM=""

# Fungsi untuk mendeteksi init system
detect_init_system() {
    if command -v systemctl &> /dev/null; then
        INIT_SYSTEM="systemd"
    elif command -v service &> /dev/null; then
        INIT_SYSTEM="sysvinit"
    elif [ -d /etc/init.d ]; then
        INIT_SYSTEM="init.d"
    else
        echo "Error: Tidak dapat mendeteksi init system!"
        exit 1
    fi
    
    echo "Init system terdeteksi: $INIT_SYSTEM"
}

# Fungsi untuk memeriksa apakah user memiliki akses root/sudo
check_privileges() {
    if [ "$EUID" -ne 0 ]; then
        if ! command -v sudo &> /dev/null; then
            echo "Error: Script ini memerlukan akses root atau sudo!"
            exit 1
        fi
        # Gunakan sudo untuk semua command
        SUDO_CMD="sudo"
    else
        SUDO_CMD=""
    fi
}

# Fungsi untuk validasi service name
validate_service() {
    local service="$1"
    
    case $INIT_SYSTEM in
        systemd)
            # Cek apakah service unit file ada
            if ! $SUDO_CMD systemctl list-unit-files | grep -q "^${service}\\.service"; then
                echo "Warning: Service '$service' mungkin tidak ada dalam sistem."
                echo "Melanjutkan operasi..."
            fi
            ;;
        sysvinit|init.d)
            # Cek apakah service script ada
            if [ ! -f "/etc/init.d/$service" ]; then
                echo "Warning: Service script '/etc/init.d/$service' tidak ditemukan."
                echo "Melanjutkan operasi..."
            fi
            ;;
    esac
}

# Fungsi untuk menjalankan action pada service
execute_service_action() {
    local action="$1"
    local service="$2"
    local result=0
    
    echo "=========================================="
    echo "Menjalankan: $action pada service $service"
    echo "=========================================="
    
    case $INIT_SYSTEM in
        systemd)
            case $action in
                start)
                    $SUDO_CMD systemctl start "$service"
                    result=$?
                    ;;
                stop)
                    $SUDO_CMD systemctl stop "$service"
                    result=$?
                    ;;
                status)
                    $SUDO_CMD systemctl status "$service" --no-pager
                    result=$?
                    ;;
                restart)
                    $SUDO_CMD systemctl restart "$service"
                    result=$?
                    ;;
                enable)
                    $SUDO_CMD systemctl enable "$service"
                    result=$?
                    ;;
                disable)
                    $SUDO_CMD systemctl disable "$service"
                    result=$?
                    ;;
            esac
            ;;
            
        sysvinit)
            case $action in
                start|stop|status|restart)
                    $SUDO_CMD service "$service" "$action"
                    result=$?
                    ;;
                enable)
                    if command -v update-rc.d &> /dev/null; then
                        $SUDO_CMD update-rc.d "$service" enable
                        result=$?
                    elif command -v chkconfig &> /dev/null; then
                        $SUDO_CMD chkconfig "$service" on
                        result=$?
                    else
                        echo "Error: Tidak dapat enable service. Tool tidak ditemukan."
                        result=1
                    fi
                    ;;
                disable)
                    if command -v update-rc.d &> /dev/null; then
                        $SUDO_CMD update-rc.d "$service" disable
                        result=$?
                    elif command -v chkconfig &> /dev/null; then
                        $SUDO_CMD chkconfig "$service" off
                        result=$?
                    else
                        echo "Error: Tidak dapat disable service. Tool tidak ditemukan."
                        result=1
                    fi
                    ;;
            esac
            ;;
            
        init.d)
            case $action in
                start|stop|status|restart)
                    $SUDO_CMD /etc/init.d/"$service" "$action"
                    result=$?
                    ;;
                enable|disable)
                    echo "Error: Enable/disable tidak didukung untuk init.d secara langsung."
                    echo "Gunakan update-rc.d atau chkconfig jika tersedia."
                    result=1
                    ;;
            esac
            ;;
    esac
    
    return $result
}

# Fungsi untuk menampilkan hasil operasi
show_result() {
    local action="$1"
    local service="$2"
    local result="$3"
    
    echo ""
    echo "=========================================="
    if [ "$result" -eq 0 ]; then
        echo "✓ Sukses: $action service $service berhasil dijalankan."
        
        # Tampilkan status tambahan untuk beberapa action
        case $action in
            start|restart)
                echo "Service $service sekarang berjalan."
                ;;
            stop)
                echo "Service $service telah dihentikan."
                ;;
            enable)
                echo "Service $service akan otomatis start saat boot."
                ;;
            disable)
                echo "Service $service tidak akan start saat boot."
                ;;
        esac
    else
        echo "✗ Error: Gagal menjalankan $action pada service $service."
        echo "Exit code: $result"
    fi
    echo "=========================================="
}

# Main execution
main() {
    # Konversi action ke lowercase untuk konsistensi
    ACTION=$(echo "$ACTION" | tr '[:upper:]' '[:lower:]')
    
    # Validasi action
    case $ACTION in
        start|stop|status|restart|enable|disable)
            # Action valid
            ;;
        *)
            echo "Error: Action '$ACTION' tidak valid!"
            usage
            ;;
    esac
    
    # Deteksi init system
    detect_init_system
    
    # Cek privileges
    check_privileges
    
    # Validasi service (warning saja, tidak exit)
    validate_service "$SERVICE_NAME"
    
    # Jalankan action
    execute_service_action "$ACTION" "$SERVICE_NAME"
    RESULT=$?
    
    # Tampilkan hasil
    show_result "$ACTION" "$SERVICE_NAME" "$RESULT"
    
    exit $RESULT
}

# Jalankan main function
main