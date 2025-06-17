// LoginRequestDto.java
package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO untuk login
 *
 * @author Parkee Development Team
 * @version 1.0
 */
@Data
@Schema(description = "Request untuk login user")
public class LoginRequestDto {

    @NotBlank(message = "Email tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    @Schema(
            description = "Email user",
            example = "admin@parkee.com",
            required = true
    )
    private String email;

    @NotBlank(message = "Password tidak boleh kosong")
    @Size(min = 6, message = "Password minimal 6 karakter")
    @Schema(
            description = "Password user",
            example = "password123",
            required = true,
            minLength = 6
    )
    private String password;

    @Schema(
            description = "Remember me flag untuk perpanjangan session",
            example = "true",
            defaultValue = "false"
    )
    private Boolean rememberMe = false;
}