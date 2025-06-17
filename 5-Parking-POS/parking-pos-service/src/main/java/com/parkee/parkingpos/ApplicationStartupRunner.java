package com.parkee.parkingpos;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Component untuk menampilkan informasi saat aplikasi startup
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationStartupRunner implements CommandLineRunner {

    private final Environment environment;

    @Override
    public void run(String... args) throws Exception {
        logApplicationStartup();
    }

    private void logApplicationStartup() {
        String protocol = "http";
        if (environment.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }

        String serverPort = environment.getProperty("server.port");
        String contextPath = environment.getProperty("server.servlet.context-path");
        if (contextPath == null || contextPath.isBlank()) {
            contextPath = "/";
        }

        String hostAddress = "localhost";
        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.warn("The host name could not be determined, using `localhost` as fallback");
        }

        log.info("\n----------------------------------------------------------\n\t" +
                        "Application '{}' is running! Access URLs:\n\t" +
                        "Local: \t\t{}://localhost:{}{}\n\t" +
                        "External: \t{}://{}:{}{}\n\t" +
                        "Profile(s): \t{}\n\t" +
                        "Swagger UI: \t{}://localhost:{}{}/swagger-ui.html\n" +
                        "----------------------------------------------------------",
                environment.getProperty("spring.application.name"),
                protocol,
                serverPort,
                contextPath,
                protocol,
                hostAddress,
                serverPort,
                contextPath,
                environment.getActiveProfiles().length == 0 ? "default" : environment.getActiveProfiles(),
                protocol,
                serverPort,
                contextPath
        );
    }
}