package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO untuk response member
 */
@Data
@Builder
@Schema(description = "Member information response")
public class MemberResponseDto {

    @Schema(
            description = "Member ID",
            example = "1"
    )
    private Long id;

    @Schema(
            description = "Member code",
            example = "MBR001"
    )
    private String memberCode;

    @Schema(
            description = "Member name",
            example = "John Doe"
    )
    private String name;

    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD"
    )
    private String vehiclePlateNumber;

    @Schema(
            description = "Email address",
            example = "john.doe@example.com"
    )
    private String email;

    @Schema(
            description = "Phone number",
            example = "081234567890"
    )
    private String phoneNumber;

    @Schema(
            description = "Member balance",
            example = "150000.00"
    )
    private BigDecimal balance;

    @Schema(
            description = "Member active status",
            example = "true"
    )
    private Boolean active;

    @Schema(
            description = "Registration date and time",
            example = "2025-01-01T10:00:00"
    )
    private LocalDateTime registeredAt;

    @Schema(
            description = "Last activity date and time",
            example = "2025-01-16T14:30:00"
    )
    private LocalDateTime lastActivity;

    @Schema(
            description = "Total parking sessions",
            example = "25"
    )
    private Integer totalParkings;
}