
// AuthServiceImpl.java - Implementation
package com.parkee.parkingpos.service.impl;

import com.parkee.parkingpos.dto.*;
import com.parkee.parkingpos.service.AuthService;
import com.parkee.parkingpos.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    // Mock user database
    private static final Map<String, MockUser> MOCK_USERS = Map.of(
            "admin@parkee.com", new MockUser("1", "admin@parkee.com", "Admin Parkee", "admin", "password123"),
            "operator@parkee.com", new MockUser("2", "operator@parkee.com", "Operator Parkee", "operator", "password123"),
            "cashier@parkee.com", new MockUser("3", "cashier@parkee.com", "Cashier Parkee", "cashier", "password123"),
            "demo@parkee.com", new MockUser("4", "demo@parkee.com", "Demo User", "admin", "password123")
    );

    @Override
    public LoginResponseDto login(LoginRequestDto request) {
        log.info("Processing login for email: {}", request.getEmail());

        // Authenticate user
        MockUser user = authenticateUser(request.getEmail(), request.getPassword());

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        // Store refresh token in Redis
        String refreshTokenKey = "refresh_token:" + user.getId();
        redisTemplate.opsForValue().set(refreshTokenKey, refreshToken, 24, TimeUnit.HOURS);

        // Build response
        LoginResponseDto response = LoginResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpirationTimeInSeconds(accessToken))
                .user(UserInfoDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .role(user.getRole())
                        .avatar(null)
                        .isActive(true)
                        .build())
                .loginTime(LocalDateTime.now())
                .build();

        log.info("User {} logged in successfully", user.getEmail());
        return response;
    }

    @Override
    public TokenResponseDto refreshToken(String refreshToken) {
        log.info("Processing token refresh");

        // Validate refresh token
        if (!jwtUtil.isRefreshToken(refreshToken)) {
            throw new AuthenticationException("Token bukan refresh token yang valid");
        }

        // Extract user info
        String userId = jwtUtil.getUserIdFromToken(refreshToken);
        String email = jwtUtil.getEmailFromToken(refreshToken);

        // Verify refresh token exists in Redis
        String refreshTokenKey = "refresh_token:" + userId;
        String storedRefreshToken = redisTemplate.opsForValue().get(refreshTokenKey);

        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            throw new AuthenticationException("Refresh token tidak ditemukan atau sudah di-logout");
        }

        // Get user role
        MockUser user = findUserByEmail(email);
        if (user == null) {
            throw new AuthenticationException("User tidak ditemukan");
        }

        // Generate new access token
        String newAccessToken = jwtUtil.generateAccessToken(userId, email, user.getRole());

        TokenResponseDto response = TokenResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(null)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpirationTimeInSeconds(newAccessToken))
                .build();

        log.info("Token refreshed successfully for user: {}", email);
        return response;
    }

    @Override
    public Map<String, Object> logout(String accessToken, String refreshToken) {
        log.info("Processing logout");

        // Validate access token
        if (!jwtUtil.isAccessToken(accessToken)) {
            throw new AuthenticationException("Token bukan access token yang valid");
        }

        // Extract user info
        String userId = jwtUtil.getUserIdFromToken(accessToken);
        String email = jwtUtil.getEmailFromToken(accessToken);
        String jwtId = jwtUtil.getJwtIdFromToken(accessToken);

        int invalidatedTokens = 0;

        // Blacklist access token
        String blacklistKey = "blacklist:" + jwtId;
        long ttl = Math.max(jwtUtil.getExpirationTimeInSeconds(accessToken), 0);
        redisTemplate.opsForValue().set(blacklistKey, "true", ttl, TimeUnit.SECONDS);
        invalidatedTokens++;

        // Remove refresh token
        String refreshTokenKey = "refresh_token:" + userId;
        Boolean deleted = redisTemplate.delete(refreshTokenKey);
        if (Boolean.TRUE.equals(deleted)) {
            invalidatedTokens++;
        }

        // Blacklist refresh token if provided
        if (refreshToken != null) {
            try {
                String refreshJwtId = jwtUtil.getJwtIdFromToken(refreshToken);
                String refreshBlacklistKey = "blacklist:" + refreshJwtId;
                long refreshTtl = Math.max(jwtUtil.getExpirationTimeInSeconds(refreshToken), 0);
                redisTemplate.opsForValue().set(refreshBlacklistKey, "true", refreshTtl, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Failed to blacklist refresh token: {}", e.getMessage());
            }
        }

        log.info("User {} logged out successfully", email);

        return Map.of(
                "userId", userId,
                "email", email,
                "logoutTime", LocalDateTime.now(),
                "invalidatedTokens", invalidatedTokens
        );
    }

    @Override
    public Map<String, Object> validateToken(String token) {
        // Validate token format
        String userId = jwtUtil.getUserIdFromToken(token);
        String email = jwtUtil.getEmailFromToken(token);
        String role = jwtUtil.getRoleFromToken(token);
        String jwtId = jwtUtil.getJwtIdFromToken(token);

        // Check blacklist
        String blacklistKey = "blacklist:" + jwtId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
            throw new AuthenticationException("Token telah di-logout");
        }

        return Map.of(
                "valid", true,
                "userId", userId,
                "email", email,
                "role", role,
                "expiresIn", jwtUtil.getExpirationTimeInSeconds(token)
        );
    }

    @Override
    public List<Map<String, String>> getMockUsers() {
        return MOCK_USERS.values().stream()
                .map(user -> Map.of(
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "role", user.getRole(),
                        "password", user.getPassword()
                ))
                .toList();
    }

    // Private helper methods
    private MockUser authenticateUser(String email, String password) {
        MockUser user = findUserByEmail(email);

        if (user == null) {
            throw new AuthenticationException("User dengan email " + email + " tidak ditemukan");
        }

        if (!password.equals(user.getPassword())) {
            throw new AuthenticationException("Email atau password salah");
        }

        return user;
    }

    private MockUser findUserByEmail(String email) {
        return MOCK_USERS.get(email.toLowerCase());
    }

    // Inner classes
    private static class MockUser {
        private final String id, email, name, role, password;

        public MockUser(String id, String email, String name, String role, String password) {
            this.id = id; this.email = email; this.name = name; this.role = role; this.password = password;
        }

        public String getId() { return id; }
        public String getEmail() { return email; }
        public String getName() { return name; }
        public String getRole() { return role; }
        public String getPassword() { return password; }
    }

    public static class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }
}