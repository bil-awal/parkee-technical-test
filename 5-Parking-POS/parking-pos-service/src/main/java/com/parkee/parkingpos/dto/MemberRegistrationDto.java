package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * DTO untuk registrasi member baru
 */
@Data
@Schema(description = "Member registration request")
public class MemberRegistrationDto {

    @NotBlank(message = "Nama tidak boleh kosong")
    @Schema(
            description = "Member full name",
            example = "John Doe",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String name;

    @NotBlank(message = "Plat nomor tidak boleh kosong")
    @Pattern(regexp = "^[A-Z]{1,2}\\d{1,4}[A-Z]{1,3}$",
            message = "Format plat nomor tidak valid")
    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD",
            pattern = "^[A-Z]{1,2}\\d{1,4}[A-Z]{1,3}$",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String vehiclePlateNumber;

    @Email(message = "Format email tidak valid")
    @Schema(
            description = "Member email address",
            example = "john.doe@example.com",
            format = "email"
    )
    private String email;

    @Pattern(regexp = "^08\\d{9,11}$", message = "Format nomor HP tidak valid")
    @Schema(
            description = "Member phone number",
            example = "081234567890",
            pattern = "^08\\d{9,11}$"
    )
    private String phoneNumber;
}