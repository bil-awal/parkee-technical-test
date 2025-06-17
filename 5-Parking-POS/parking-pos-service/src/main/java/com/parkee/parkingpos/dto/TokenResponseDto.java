package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response token baru setelah refresh")
public class TokenResponseDto {

    @Schema(description = "Access token JWT baru", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "Refresh token baru (opsional)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "Tipe token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Waktu expired access token dalam detik", example = "3600")
    private Long expiresIn;
}