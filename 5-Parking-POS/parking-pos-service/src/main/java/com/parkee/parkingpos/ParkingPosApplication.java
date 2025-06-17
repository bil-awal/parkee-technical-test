package com.parkee.parkingpos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class untuk Parking POS System
 *
 * @author Parkee Development Team
 * @version 1.0
 */
@SpringBootApplication
@EnableConfigurationProperties
@EnableCaching
@EnableAsync
@EnableScheduling
public class ParkingPosApplication {

	public static void main(String[] args) {
		SpringApplication.run(ParkingPosApplication.class, args);
	}
}