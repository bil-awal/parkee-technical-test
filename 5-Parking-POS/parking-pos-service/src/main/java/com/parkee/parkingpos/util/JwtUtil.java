// JwtUtil.java
package com.parkee.parkingpos.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenValidityInMs;
    private final long refreshTokenValidityInMs;
    private final String issuer;

    public JwtUtil(
            @Value("${app.jwt.secret:parkee-secret-key-for-jwt-token-generation-and-validation-2025}") String secret,
            @Value("${app.jwt.access-token-validity:3600000}") long accessTokenValidityInMs,
            @Value("${app.jwt.refresh-token-validity:86400000}") long refreshTokenValidityInMs,
            @Value("${app.jwt.issuer:parkee-pos}") String issuer) {

        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenValidityInMs = accessTokenValidityInMs;
        this.refreshTokenValidityInMs = refreshTokenValidityInMs;
        this.issuer = issuer;
    }

    /**
     * Generate access token dengan user information
     */
    public String generateAccessToken(String userId, String email, String role) {
        return generateToken(userId, email, role, accessTokenValidityInMs, "access");
    }

    /**
     * Generate refresh token dengan minimal information
     */
    public String generateRefreshToken(String userId, String email) {
        return generateToken(userId, email, null, refreshTokenValidityInMs, "refresh");
    }

    /**
     * Core method untuk generate JWT token
     */
    private String generateToken(String userId, String email, String role, long validityInMs, String tokenType) {
        Instant now = Instant.now();
        Instant expirationTime = now.plus(validityInMs, ChronoUnit.MILLIS);

        Map<String, Object> claims = new HashMap<>();
        claims.put("user_id", userId);
        claims.put("email", email);
        claims.put("token_type", tokenType);
        claims.put("jti", UUID.randomUUID().toString()); // JWT ID untuk tracking

        if (role != null) {
            claims.put("role", role);
        }

        return Jwts.builder()
                .subject(userId)
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expirationTime))
                .claims(claims)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validate token dan return claims jika valid
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
            throw new JwtException("Invalid token signature");
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            throw new JwtException("Malformed token");
        } catch (ExpiredJwtException e) {
            log.error("JWT token expired: {}", e.getMessage());
            throw new JwtException("Token expired");
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
            throw new JwtException("Unsupported token");
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
            throw new JwtException("Token claims empty");
        }
    }

    /**
     * Extract user ID dari token
     */
    public String getUserIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("user_id", String.class);
    }

    /**
     * Extract email dari token
     */
    public String getEmailFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("email", String.class);
    }

    /**
     * Extract role dari token
     */
    public String getRoleFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Extract token type dari token
     */
    public String getTokenTypeFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("token_type", String.class);
    }

    /**
     * Check apakah token adalah refresh token
     */
    public boolean isRefreshToken(String token) {
        return "refresh".equals(getTokenTypeFromToken(token));
    }

    /**
     * Check apakah token adalah access token
     */
    public boolean isAccessToken(String token) {
        return "access".equals(getTokenTypeFromToken(token));
    }

    /**
     * Get expiration time dalam seconds dari sekarang
     */
    public long getExpirationTimeInSeconds(String token) {
        Claims claims = validateToken(token);
        Date expiration = claims.getExpiration();
        long now = System.currentTimeMillis();
        return (expiration.getTime() - now) / 1000;
    }

    /**
     * Get JWT ID untuk tracking token
     */
    public String getJwtIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("jti", String.class);
    }

    /**
     * Custom exception untuk JWT validation errors
     */
    public static class JwtException extends RuntimeException {
        public JwtException(String message) {
            super(message);
        }

        public JwtException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}