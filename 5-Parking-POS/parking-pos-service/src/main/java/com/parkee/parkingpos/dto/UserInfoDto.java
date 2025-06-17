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
@Schema(description = "Informasi user yang sedang login")
public class UserInfoDto {

    @Schema(description = "User ID", example = "1")
    private String id;

    @Schema(description = "Email user", example = "admin@parkee.com")
    private String email;

    @Schema(description = "Nama user", example = "Admin Parkee")
    private String name;

    @Schema(description = "Role user", example = "admin", allowableValues = {"admin", "operator", "cashier"})
    private String role;

    @Schema(description = "Avatar URL", example = "https://example.com/avatar.jpg")
    private String avatar;

    @Schema(description = "Status aktif user", example = "true")
    private Boolean isActive = true;
}