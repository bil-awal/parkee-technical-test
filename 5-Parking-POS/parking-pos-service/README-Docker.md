# Parking POS Docker Deployment

Docker deployment untuk aplikasi Parking POS dengan PostgreSQL 16 dan Redis.

## 🛠️ Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- 4GB RAM minimum
- 10GB disk space

## 📁 File Structure

```
parking-pos/
├── Dockerfile                    # Multi-stage build untuk Spring Boot
├── docker-compose.yml           # Docker Compose configuration
├── nginx.conf                   # Nginx reverse proxy config
├── redis.conf                   # Redis configuration
├── .dockerignore                # Docker build optimization
├── docker-management.sh         # Management script
├── src/main/resources/
│   └── application-docker.yml   # Docker-specific configuration
└── README-Docker.md             # This file
```

## 🚀 Quick Start

### 1. Clone dan Setup

```bash
# Clone repository
git clone <repository-url>
cd parking-pos

# Make management script executable
chmod +x docker-management.sh

# Update pom.xml untuk Java 22 (jika diperlukan)
# Ganti <java.version>21</java.version> menjadi <java.version>22</java.version>
```

### 2. Start Services

```bash
# Start semua services
./docker-management.sh start

# Atau menggunakan docker-compose langsung
docker-compose up -d
```

### 3. Verify Deployment

```bash
# Check status
./docker-management.sh status

# Check logs
./docker-management.sh logs

# Health check
curl http://localhost:8081/api/actuator/health
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://localhost:8081/api | Main application API |
| **Swagger UI** | http://localhost:8081/swagger-ui.html | API documentation |
| **Health Check** | http://localhost:8081/api/actuator/health | Health monitoring |
| **Nginx** | http://localhost | Reverse proxy (optional) |
| **PostgreSQL** | localhost:5434 | Database (external access) |
| **Redis** | localhost:6379 | Cache (external access) |

## 🐳 Docker Services

### 1. Application (`parking-pos-app`)
- **Image**: Custom build dengan Java 22
- **Port**: 8081
- **Profile**: `docker`
- **Volumes**: uploads, logs
- **Health Check**: Actuator endpoint

### 2. Database (`postgres`)
- **Image**: postgres:16-alpine
- **Port**: 5434 → 5432
- **Database**: parking_pos_db
- **User**: postgres / 120498
- **Volume**: Persistent data storage

### 3. Cache (`redis`)
- **Image**: redis:7-alpine
- **Port**: 6379
- **Configuration**: Custom redis.conf
- **Persistence**: AOF enabled

### 4. Reverse Proxy (`nginx`)
- **Image**: nginx:alpine
- **Ports**: 80, 443
- **Features**: Rate limiting, gzip, SSL ready
- **Static files**: Upload serving

## 🛠️ Management Commands

```bash
# Build application
./docker-management.sh build

# Start services
./docker-management.sh start

# Stop services
./docker-management.sh stop

# Restart services
./docker-management.sh restart

# View logs
./docker-management.sh logs                    # All services
./docker-management.sh logs parking-pos-app    # Specific service

# Service status
./docker-management.sh status

# Database operations
./docker-management.sh backup                  # Create backup
./docker-management.sh restore backup.sql      # Restore from backup
./docker-management.sh migrate                 # Run Flyway migration

# Cleanup
./docker-management.sh clean                   # Remove all containers/images
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `docker` |
| `APP_JWT_SECRET` | JWT secret key | (default) |
| `SPRING_DATASOURCE_URL` | Database URL | PostgreSQL container |
| `SPRING_DATA_REDIS_HOST` | Redis host | Redis container |

### Docker Compose Override

Buat file `docker-compose.override.yml` untuk customization:

```yaml
version: '3.8'
services:
  parking-pos-app:
    environment:
      APP_JWT_SECRET: "your-custom-secret-key"
      SPRING_PROFILES_ACTIVE: "docker,custom"
    ports:
      - "8082:8081"  # Custom port
```

## 🔧 Development

### Local Development dengan Docker

```bash
# Start dependencies only
docker-compose up postgres redis -d

# Run application locally
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Hot Reload Development

```bash
# Build dengan development profile
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:8081/api/actuator/health

# Database health
docker-compose exec postgres pg_isready -U postgres

# Redis health
docker-compose exec redis redis-cli ping
```

### Logs

```bash
# Application logs
docker-compose logs -f parking-pos-app

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Service status
./docker-management.sh status
```

## 🔒 Security

### Production Security

1. **Change default passwords**:
   ```yaml
   environment:
     POSTGRES_PASSWORD: "strong-password"
     APP_JWT_SECRET: "strong-jwt-secret"
   ```

2. **Enable Redis password**:
   ```conf
   # redis.conf
   requirepass your_redis_password
   ```

3. **Setup SSL**:
    - Add SSL certificates ke folder `ssl/`
    - Uncomment HTTPS server block di `nginx.conf`

4. **Restrict Actuator access**:
   ```yaml
   # application-docker.yml
   management:
     endpoints:
       web:
         exposure:
           include: health,info
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :8081
   
   # Change ports in docker-compose.yml
   ports:
     - "8082:8081"
   ```

2. **Database connection failed**:
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec postgres psql -U postgres -d parking_pos_db
   ```

3. **Application startup fails**:
   ```bash
   # Check application logs
   docker-compose logs parking-pos-app
   
   # Check Java version in container
   docker-compose exec parking-pos-app java -version
   ```

4. **Out of disk space**:
   ```bash
   # Clean up Docker
   docker system prune -a
   
   # Remove old images
   docker image prune -a
   ```

### Performance Tuning

1. **Increase memory limits**:
   ```yaml
   services:
     parking-pos-app:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

2. **Database optimization**:
   ```yaml
   postgres:
     command: >
       postgres
       -c shared_buffers=256MB
       -c effective_cache_size=1GB
   ```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  parking-pos-app:
    deploy:
      replicas: 3
  
  nginx:
    # Update upstream in nginx.conf
    # upstream parking_pos_backend {
    #   server parking-pos-app_1:8081;
    #   server parking-pos-app_2:8081;
    #   server parking-pos-app_3:8081;
    # }
```

### Load Balancing

Update `nginx.conf` upstream configuration untuk multiple instances.

---

## 📞 Support

Untuk issue atau pertanyaan:
1. Check logs: `./docker-management.sh logs`
2. Verify status: `./docker-management.sh status`
3. Review configuration files
4. Contact bilawalfr@gmail.com