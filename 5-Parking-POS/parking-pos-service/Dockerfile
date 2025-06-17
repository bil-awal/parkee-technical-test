# Multi-stage build untuk optimasi ukuran image
FROM maven:3.9.9-eclipse-temurin-22-alpine AS build

# Set working directory
WORKDIR /app

# Copy pom.xml terlebih dahulu untuk memanfaatkan Docker cache layers
COPY pom.xml .

# Download dependencies (akan di-cache jika pom.xml tidak berubah)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build aplikasi (skip tests untuk build yang lebih cepat)
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:22-jre-alpine

# Install packages yang diperlukan
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone ke Asia/Jakarta
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create application user untuk security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Create directories
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:appgroup /app

# Set working directory
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership of the JAR file
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8081/api/actuator/health || exit 1

# JVM options untuk production
ENV JAVA_OPTS="-XX:+UseG1GC \
               -XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+OptimizeStringConcat \
               -XX:+UseStringDeduplication \
               -Djava.security.egd=file:/dev/./urandom"

# Run aplikasi
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]