package com.parkee.parkingpos.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Konfigurasi Swagger/OpenAPI untuk dokumentasi API
 */
@Configuration
public class SwaggerConfig {

    @Value("${server.port}")
    private String serverPort;

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Bean
    public OpenAPI customOpenAPI() {
        Server localServer = new Server()
                .url("http://localhost:" + serverPort + contextPath)
                .description("Local Development Server");

        Server productionServer = new Server()
                .url("https://api.parkee.com" + contextPath)
                .description("Production Server");

        Contact contact = new Contact()
                .name("Bil Awal")
                .email("bilawalfr@gmail.com")
                .url("https://github.com/bil-awal");

        License license = new License()
                .name("Apache 2.0")
                .url("https://www.apache.org/licenses/LICENSE-2.0");

        Info info = new Info()
                .title("Parking POS API")
                .version("1.0.0")
                .description("API untuk sistem Point of Sales parkir Parkee. " +
                        "Sistem ini mengelola check-in/check-out kendaraan, " +
                        "pembayaran, member, voucher, dan laporan.")
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, productionServer));
    }
}