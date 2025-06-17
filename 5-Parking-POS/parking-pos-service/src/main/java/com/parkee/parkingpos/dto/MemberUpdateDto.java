package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * DTO untuk update member
 */
@Data
@Schema(description = "Member update request")
public class MemberUpdateDto {

    @Schema(
            description = "Member name",
            example = "John Doe"
    )
    private String name;

    @Email(message = "Format email tidak valid")
    @Schema(
            description = "Email address",
            example = "john.doe@example.com",
            format = "email"
    )
    private String email;

    @Pattern(regexp = "^08\\d{9,11}$", message = "Format nomor HP tidak valid")
    @Schema(
            description = "Phone number",
            example = "081234567890",
            pattern = "^08\\d{9,11}$"
    )
    private String phoneNumber;
}