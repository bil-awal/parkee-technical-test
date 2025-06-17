package com.parkee.parkingpos.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;

/**
 * Properties untuk konfigurasi sistem parkir
 */
@Data
@Component
@ConfigurationProperties(prefix = "parking")
public class ParkingProperties {
    private BigDecimal ratePerHour;
    private String currency;
    private String timezone;
    private int gracePeriodMinutes;
    private int maxParkingHours;
    private BusinessHours businessHours;
    private FileConfig file;

    @Data
    public static class BusinessHours {
        private LocalTime open;
        private LocalTime close;
    }

    @Data
    public static class FileConfig {
        private String uploadDir;
        private long maxSize;
        private String[] allowedTypes;
    }
}