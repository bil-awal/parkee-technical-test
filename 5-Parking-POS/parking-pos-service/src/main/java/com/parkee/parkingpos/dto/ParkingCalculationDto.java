package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO untuk kalkulasi biaya parkir
 */
@Data
@Builder
@Schema(description = "Parking fee calculation details")
public class ParkingCalculationDto {

    @Schema(
            description = "Parking ticket ID",
            example = "1"
    )
    private Long ticketId;

    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD"
    )
    private String plateNumber;

    @Schema(
            description = "Check-in time",
            example = "2025-01-16T10:00:00"
    )
    private LocalDateTime checkInTime;

    @Schema(
            description = "Check-out time",
            example = "2025-01-16T14:30:00"
    )
    private LocalDateTime checkOutTime;

    @Schema(
            description = "Parking duration in human-readable format",
            example = "4 hours 30 minutes"
    )
    private String duration;

    @Schema(
            description = "Total hours parked (rounded up)",
            example = "5"
    )
    private Long hoursParked;

    @Schema(
            description = "Base parking fee",
            example = "15000.00"
    )
    private BigDecimal baseFee;

    @Schema(
            description = "Discount amount",
            example = "3000.00"
    )
    private BigDecimal discount;

    @Schema(
            description = "Total fee after discount",
            example = "12000.00"
    )
    private BigDecimal totalFee;

    @Schema(
            description = "Whether parking is within grace period",
            example = "false"
    )
    private boolean gracePeriod;

    @Schema(
            description = "Whether the vehicle belongs to a member",
            example = "true"
    )
    private boolean isMember;

    @Schema(
            description = "Applied voucher code",
            example = "DISC20"
    )
    private String appliedVoucher;
}