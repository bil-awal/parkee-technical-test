package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request untuk logout user")
public class LogoutRequestDto {

    @NotBlank(message = "Access token tidak boleh kosong")
    @Schema(
            description = "Access token yang akan di-invalidate",
            example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            required = true
    )
    private String accessToken;

    @Schema(
            description = "Refresh token yang akan di-invalidate",
            example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    private String refreshToken;
}