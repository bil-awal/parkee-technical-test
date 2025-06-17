#!/bin/bash

# Parking POS Docker Management Script
# Usage: ./docker-management.sh [command]

set -e

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project name
PROJECT_NAME="parking-pos"

# Function untuk print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function untuk check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Function untuk setup initial directories
setup_directories() {
    print_info "Setting up directories..."

    mkdir -p ssl
    mkdir -p init-scripts
    mkdir -p temp

    print_success "Directories created"
}

# Function untuk build aplikasi
build() {
    print_info "Building Parking POS application..."

    check_prerequisites
    setup_directories

    docker-compose build --no-cache parking-pos-app

    print_success "Build completed successfully"
}

# Function untuk start semua services
start() {
    print_info "Starting Parking POS services..."

    check_prerequisites
    setup_directories

    docker-compose up -d

    print_info "Waiting for services to be ready..."
    sleep 30

    print_info "Checking service health..."
    docker-compose ps

    print_success "Services started successfully"
    print_info "Application URL: http://localhost:8081/api"
    print_info "Swagger UI: http://localhost:8081/swagger-ui.html"
    print_info "Health Check: http://localhost:8081/api/actuator/health"
}

# Function untuk stop semua services
stop() {
    print_info "Stopping Parking POS services..."

    docker-compose down

    print_success "Services stopped successfully"
}

# Function untuk restart services
restart() {
    print_info "Restarting Parking POS services..."

    stop
    start
}

# Function untuk clean up
clean() {
    print_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."

        docker-compose down -v --rmi all --remove-orphans
        docker system prune -f

        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function untuk show logs
logs() {
    SERVICE=${2:-}

    if [ -z "$SERVICE" ]; then
        print_info "Showing logs for all services..."
        docker-compose logs -f
    else
        print_info "Showing logs for $SERVICE..."
        docker-compose logs -f "$SERVICE"
    fi
}

# Function untuk run database migration
migrate() {
    print_info "Running database migration..."

    docker-compose exec parking-pos-app java -jar app.jar --spring.flyway.migrate=true

    print_success "Database migration completed"
}

# Function untuk backup database
backup() {
    print_info "Creating database backup..."

    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

    docker-compose exec postgres pg_dump -U postgres parking_pos_db > "$BACKUP_FILE"

    print_success "Database backup created: $BACKUP_FILE"
}

# Function untuk restore database
restore() {
    BACKUP_FILE=${2:-}

    if [ -z "$BACKUP_FILE" ]; then
        print_error "Please specify backup file"
        print_info "Usage: ./docker-management.sh restore <backup_file>"
        exit 1
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    print_warning "This will restore database from $BACKUP_FILE"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restoring database..."

        docker-compose exec -T postgres psql -U postgres parking_pos_db < "$BACKUP_FILE"

        print_success "Database restored successfully"
    else
        print_info "Restore cancelled"
    fi
}

# Function untuk show status
status() {
    print_info "Service Status:"
    docker-compose ps

    echo ""
    print_info "Resource Usage:"
    docker stats --no-stream
}

# Function untuk show help
show_help() {
    echo "Parking POS Docker Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build     Build the application"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs [service_name]"
    echo "  status    Show service status and resource usage"
    echo "  migrate   Run database migration"
    echo "  backup    Create database backup"
    echo "  restore   Restore database from backup file"
    echo "  clean     Clean up all containers, images, and volumes"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs parking-pos-app"
    echo "  $0 restore backup_20231201_120000.sql"
}

# Main script logic
case "${1:-}" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    migrate)
        migrate
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$@"
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac