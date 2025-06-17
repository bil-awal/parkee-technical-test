package com.parkee.parkingpos.dto;

import com.parkee.parkingpos.dto.UserInfoDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response login berhasil dengan token dan user info")
public class LoginResponseDto {

    @Schema(description = "Access token JWT", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "Refresh token untuk regenerasi access token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "Tipe token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Waktu expired access token dalam detik", example = "3600")
    private Long expiresIn;

    @Schema(description = "User information")
    private UserInfoDto user;

    @Schema(description = "Waktu login", example = "2025-01-16T10:30:00")
    private LocalDateTime loginTime;
}