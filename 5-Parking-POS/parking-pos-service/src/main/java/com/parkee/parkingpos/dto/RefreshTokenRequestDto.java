package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request untuk refresh access token")
public class RefreshTokenRequestDto {

    @NotBlank(message = "Refresh token tidak boleh kosong")
    @Schema(
            description = "Refresh token yang valid",
            example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            required = true
    )
    private String refreshToken;
}