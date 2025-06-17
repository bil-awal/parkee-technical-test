package com.parkee.parkingpos.controller;

import com.parkee.parkingpos.dto.*;
import com.parkee.parkingpos.service.AuthService;
import com.parkee.parkingpos.service.impl.AuthServiceImpl;
import com.parkee.parkingpos.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API untuk autentikasi user, manajemen token, dan session")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
            summary = "User login",
            description = "Autentikasi user dengan email dan password. Menghasilkan access token untuk API access dan refresh token untuk perpanjangan session."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Login berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    name = "Successful Login",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Login berhasil",
                                              "data": {
                                                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsImVtYWlsIjoiYWRtaW5AcGFya2VlLmNvbSIsInJvbGUiOiJhZG1pbiIsInRva2VuX3R5cGUiOiJhY2Nlc3MiLCJqdGkiOiI3YjJkM2Y0ZS0xZjJlLTQzZTQtOTczYi0yMmM4NGQ0OGE5YjMiLCJzdWIiOiIxIiwiaXNzIjoicGFya2VlLXBvcyIsImlhdCI6MTczNzAzMzYwMCwiZXhwIjoxNzM3MDM3MjAwfQ.demo_access_token_hash",
                                                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsImVtYWlsIjoiYWRtaW5AcGFya2VlLmNvbSIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiM2E0YjVjNmQtNGU1Zi02NzQ4LTg5YWItMTJkMzRlNTZmNzg5Iiwic3ViIjoiMSIsImlzcyI6InBhcmtlZS1wb3MiLCJpYXQiOjE3MzcwMzM2MDAsImV4cCI6MTczNzEyMDAwMH0.demo_refresh_token_hash",
                                                "tokenType": "Bearer",
                                                "expiresIn": 3600,
                                                "user": {
                                                  "id": "1",
                                                  "email": "admin@parkee.com",
                                                  "name": "Admin Parkee",
                                                  "role": "admin",
                                                  "avatar": null,
                                                  "isActive": true
                                                },
                                                "loginTime": "2025-01-16T10:30:00"
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - Email atau password salah",
                    content = @Content(
                            mediaType = "application/json",
                            examples = {
                                    @ExampleObject(
                                            name = "Invalid Credentials",
                                            description = "Email atau password tidak valid",
                                            value = """
                                                    {
                                                      "success": false,
                                                      "message": "Email atau password salah",
                                                      "data": null
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "User Not Found",
                                            description = "Email tidak terdaftar dalam sistem",
                                            value = """
                                                    {
                                                      "success": false,
                                                      "message": "User dengan email john@example.com tidak ditemukan",
                                                      "data": null
                                                    }
                                                    """
                                    )
                            }
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Validation error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Email tidak boleh kosong",
                                              "data": null
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Internal Server Error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Terjadi kesalahan sistem saat proses login",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<LoginResponseDto>> login(
            @Valid @RequestBody LoginRequestDto request) {

        try {
            LoginResponseDto response = authService.login(request);
            return ResponseEntity.ok(
                    com.parkee.parkingpos.dto.ApiResponse.success("Login berhasil", response)
            );
        } catch (AuthServiceImpl.AuthenticationException e) {
            log.warn("Authentication failed for email: {} - {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Login error for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error("Terjadi kesalahan sistem saat proses login"));
        }
    }

    /**
     * Refresh token endpoint
     */
    @PostMapping("/refresh-token")
    @Operation(
            summary = "Refresh access token",
            description = "Generate access token baru menggunakan refresh token yang valid. Refresh token harus masih aktif dan tidak expired."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Token berhasil di-refresh",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    name = "Successful Token Refresh",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Token berhasil di-refresh",
                                              "data": {
                                                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsImVtYWlsIjoiYWRtaW5AcGFya2VlLmNvbSIsInJvbGUiOiJhZG1pbiIsInRva2VuX3R5cGUiOiJhY2Nlc3MiLCJqdGkiOiI5YzNkMmU0Zi0yZjNlLTQ0ZTUtOTgyYi0zM2M5NGQ1OGE5YzQiLCJzdWIiOiIxIiwiaXNzIjoicGFya2VlLXBvcyIsImlhdCI6MTczNzAzNzIwMCwiZXhwIjoxNzM3MDQwODAwfQ.new_access_token_hash",
                                                "refreshToken": null,
                                                "tokenType": "Bearer",
                                                "expiresIn": 3600
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - Refresh token tidak valid atau expired",
                    content = @Content(
                            mediaType = "application/json",
                            examples = {
                                    @ExampleObject(
                                            name = "Invalid Refresh Token",
                                            description = "Refresh token tidak valid atau malformed",
                                            value = """
                                                    {
                                                      "success": false,
                                                      "message": "Refresh token tidak valid",
                                                      "data": null
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "Expired Refresh Token",
                                            description = "Refresh token sudah expired",
                                            value = """
                                                    {
                                                      "success": false,
                                                      "message": "Refresh token sudah expired",
                                                      "data": null
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "Token Not Found",
                                            description = "Refresh token tidak ditemukan di Redis",
                                            value = """
                                                    {
                                                      "success": false,
                                                      "message": "Refresh token tidak ditemukan atau sudah di-logout",
                                                      "data": null
                                                    }
                                                    """
                                    )
                            }
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Validation error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Refresh token tidak boleh kosong",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<TokenResponseDto>> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDto request) {

        try {
            TokenResponseDto response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(
                    com.parkee.parkingpos.dto.ApiResponse.success("Token berhasil di-refresh", response)
            );
        } catch (JwtUtil.JwtException e) {
            log.warn("JWT validation failed during refresh: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error("Refresh token tidak valid"));
        } catch (AuthServiceImpl.AuthenticationException e) {
            log.warn("Authentication failed during refresh: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Token refresh error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error("Terjadi kesalahan sistem saat refresh token"));
        }
    }

    /**
     * Logout endpoint
     */
    @PostMapping("/logout")
    @Operation(
            summary = "User logout",
            description = "Logout user dan invalidate semua tokens. Access token dan refresh token akan dihapus dari system."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Logout berhasil",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    name = "Successful Logout",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Logout berhasil",
                                              "data": {
                                                "userId": "1",
                                                "email": "admin@parkee.com",
                                                "logoutTime": "2025-01-16T15:30:00",
                                                "invalidatedTokens": 2
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - Token tidak valid",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Access token tidak valid",
                                              "data": null
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Bad Request - Validation error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": false,
                                              "message": "Access token tidak boleh kosong",
                                              "data": null
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<Map<String, Object>>> logout(
            @Valid @RequestBody LogoutRequestDto request) {

        try {
            Map<String, Object> response = authService.logout(request.getAccessToken(), request.getRefreshToken());
            return ResponseEntity.ok(
                    com.parkee.parkingpos.dto.ApiResponse.success("Logout berhasil", response)
            );
        } catch (JwtUtil.JwtException e) {
            log.warn("JWT validation failed during logout: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error("Access token tidak valid"));
        } catch (AuthServiceImpl.AuthenticationException e) {
            log.warn("Authentication failed during logout: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Logout error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error("Terjadi kesalahan sistem saat logout"));
        }
    }

    /**
     * Validate token endpoint
     */
    @PostMapping("/validate")
    @Operation(
            summary = "Validate token",
            description = "Validasi apakah access token masih valid dan tidak di-blacklist"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Token valid",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Token valid",
                                              "data": {
                                                "valid": true,
                                                "userId": "1",
                                                "email": "admin@parkee.com",
                                                "role": "admin",
                                                "expiresIn": 2847
                                              }
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Token tidak valid",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<Map<String, Object>>> validateToken(
            @RequestParam String token) {

        try {
            Map<String, Object> response = authService.validateToken(token);
            return ResponseEntity.ok(
                    com.parkee.parkingpos.dto.ApiResponse.success("Token valid", response)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.parkee.parkingpos.dto.ApiResponse.error("Token tidak valid: " + e.getMessage()));
        }
    }

    /**
     * Get mock users untuk testing
     */
    @GetMapping("/mock-users")
    @Operation(
            summary = "Get mock users",
            description = "Mendapatkan daftar mock users untuk testing. Endpoint ini hanya untuk development/testing."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Daftar mock users",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = com.parkee.parkingpos.dto.ApiResponse.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Daftar mock users",
                                              "data": [
                                                {
                                                  "email": "admin@parkee.com",
                                                  "name": "Admin Parkee",
                                                  "role": "admin",
                                                  "password": "password123"
                                                },
                                                {
                                                  "email": "operator@parkee.com",
                                                  "name": "Operator Parkee",
                                                  "role": "operator",
                                                  "password": "password123"
                                                },
                                                {
                                                  "email": "cashier@parkee.com",
                                                  "name": "Cashier Parkee",
                                                  "role": "cashier",
                                                  "password": "password123"
                                                },
                                                {
                                                  "email": "demo@parkee.com",
                                                  "name": "Demo User",
                                                  "role": "admin",
                                                  "password": "demo123"
                                                }
                                              ]
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<com.parkee.parkingpos.dto.ApiResponse<List<Map<String, String>>>> getMockUsers() {
        List<Map<String, String>> users = authService.getMockUsers();
        return ResponseEntity.ok(
                com.parkee.parkingpos.dto.ApiResponse.success("Daftar mock users", users)
        );
    }
}