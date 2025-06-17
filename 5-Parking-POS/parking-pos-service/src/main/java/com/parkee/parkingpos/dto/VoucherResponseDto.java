package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO untuk response voucher
 */
@Data
@Builder
@Schema(description = "Voucher information response")
public class VoucherResponseDto {

    @Schema(
            description = "Voucher ID",
            example = "1"
    )
    private Long id;

    @Schema(
            description = "Voucher code",
            example = "DISC20OFF"
    )
    private String code;

    @Schema(
            description = "Voucher description",
            example = "20% discount for all parking"
    )
    private String description;

    @Schema(
            description = "Discount type",
            example = "PERCENTAGE",
            allowableValues = {"PERCENTAGE", "FIXED_AMOUNT"}
    )
    private String discountType;

    @Schema(
            description = "Discount value",
            example = "20.00"
    )
    private BigDecimal discountValue;

    @Schema(
            description = "Minimum transaction amount",
            example = "30000.00"
    )
    private BigDecimal minimumAmount;

    @Schema(
            description = "Valid from date",
            example = "2025-02-01T00:00:00"
    )
    private LocalDateTime validFrom;

    @Schema(
            description = "Valid until date",
            example = "2025-02-28T23:59:59"
    )
    private LocalDateTime validUntil;

    @Schema(
            description = "Whether voucher is active",
            example = "true"
    )
    private Boolean active;

    @Schema(
            description = "Usage limit",
            example = "100"
    )
    private Integer usageLimit;

    @Schema(
            description = "Current usage count",
            example = "25"
    )
    private Integer usageCount;

    @Schema(
            description = "Whether voucher is currently valid",
            example = "true"
    )
    private Boolean isValid;
}