# Parking POS Backend API

Backend API untuk sistem Point of Sales Parkir menggunakan Spring Boot.

⚠️ Ganti Username & Password Database nya Terlebih Dahulu Pada **/src/main/resources/application.yml**

## Tech Stack
- Java 21
- Spring Boot 3.3.6
- PostgreSQL 16
- Redis
- Flyway Migration
- Swagger/OpenAPI

## Features
- ✅ Check-in/Check-out kendaraan dengan foto
- ✅ Manajemen Member dengan saldo
- ✅ Sistem Voucher diskon
- ✅ Multiple payment methods (QRIS, E-Money, E-Toll, dll)
- ✅ Dashboard statistik
- ✅ Export laporan
- ✅ Redis caching
- ✅ API documentation dengan Swagger

## Design Patterns
- **Repository Pattern**: Untuk data access layer
- **Service Layer Pattern**: Business logic terpisah dari controller
- **DTO Pattern**: Data transfer objects untuk API
- **Builder Pattern**: Untuk object creation
- **Strategy Pattern**: Untuk payment methods
- **Cache-Aside Pattern**: Dengan Redis

## Setup

### Prerequisites
- Java 21
- Maven 3.8+
- PostgreSQL 16
- Redis

### Database Setup
```sql
CREATE DATABASE parking_pos_db;
```

### Running Application
```bash
# Clone repository
git clone [repository-url]

# Install dependencies
mvn clean install

# Run application
mvn spring-boot:run
```

### Access
- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- Health Check: http://localhost:8080/api/actuator/health

## API Endpoints

### Parking Operations
- `POST /api/parking/check-in` - Check-in kendaraan
- `GET /api/parking/status/{plateNumber}` - Cek status parkir
- `GET /api/parking/calculate/{plateNumber}` - Kalkulasi biaya
- `POST /api/parking/check-out` - Check-out dan bayar

### Member Management
- `POST /api/parking/members` - Registrasi member
- `GET /api/parking/members` - List members
- `PUT /api/parking/members/{id}` - Update member
- `POST /api/parking/members/{id}/topup` - Top up saldo

### Voucher Management
- `POST /api/parking/vouchers` - Create voucher
- `GET /api/parking/vouchers` - List vouchers
- `POST /api/parking/vouchers/{id}/terminate` - Terminate voucher

### Admin & Reports
- `GET /api/parking/dashboard/statistics` - Dashboard stats
- `GET /api/parking/admin/vehicles` - Vehicle activities
- `GET /api/parking/admin/reports/export` - Export report

## Testing
```bash
# Run all tests
mvn test

# Run with coverage
mvn test jacoco:report
```

## Deployment
Aplikasi sudah dikonfigurasi untuk deployment dengan:
- Health checks untuk monitoring
- Actuator endpoints
- Logging configuration
- Error handling

## License
Proprietary for PARKEE Technical Test - Bil Awal © 2025