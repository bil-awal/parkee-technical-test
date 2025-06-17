package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO untuk response parking ticket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Parking ticket information")
public class ParkingTicketResponseDto {

    @Schema(
            description = "Ticket ID",
            example = "1"
    )
    private Long id;

    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD"
    )
    private String plateNumber;

    @Schema(
            description = "Vehicle type",
            example = "CAR"
    )
    private String vehicleType;

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
            description = "Check-in gate",
            example = "GATE_A"
    )
    private String checkInGate;

    @Schema(
            description = "Check-out gate",
            example = "GATE_B"
    )
    private String checkOutGate;

    @Schema(
            description = "Check-in operator",
            example = "John Doe"
    )
    private String checkInOperator;

    @Schema(
            description = "Check-out operator",
            example = "Jane Smith"
    )
    private String checkOutOperator;

    @Schema(
            description = "Ticket status",
            example = "ACTIVE",
            allowableValues = {"ACTIVE", "COMPLETED", "CANCELLED"}
    )
    private String status;

    @Schema(
            description = "Member name if applicable",
            example = "John Doe"
    )
    private String memberName;

    @Schema(
            description = "Parking fee",
            example = "12000.00"
    )
    private BigDecimal parkingFee;

    @Schema(
            description = "Check-in photo path",
            example = "/uploads/checkin/2025/01/16/checkin_123456789.jpg"
    )
    private String checkInPhotoPath;

    @Schema(
            description = "Check-out photo path",
            example = "/uploads/checkout/2025/01/16/checkout_123456789.jpg"
    )
    private String checkOutPhotoPath;

    @Schema(
            description = "Check-in photo URL for display",
            example = "http://localhost:8081/api/parking/photos/checkin/2025/01/16/checkin_123456789.jpg"
    )
    private String checkInPhotoUrl;

    @Schema(
            description = "Check-out photo URL for display",
            example = "http://localhost:8081/api/parking/photos/checkout/2025/01/16/checkout_123456789.jpg"
    )
    private String checkOutPhotoUrl;
}