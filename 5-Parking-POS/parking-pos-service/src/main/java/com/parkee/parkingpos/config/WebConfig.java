package com.parkee.parkingpos.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Konfigurasi Web MVC untuk CORS dan static resources
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(corsProperties.getAllowedOrigins().toArray(new String[0]))
                .allowedMethods(corsProperties.getAllowedMethods().toArray(new String[0]))
                .allowedHeaders(corsProperties.getAllowedHeaders().toArray(new String[0]))
                .allowCredentials(corsProperties.isAllowCredentials())
                .maxAge(corsProperties.getMaxAge());
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Handler untuk upload files
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/");

        // Handler untuk static resources
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
    }
}
