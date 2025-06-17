package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * DTO untuk metode pembayaran
 */
@Data
@Builder
@Schema(description = "Payment method information")
public class PaymentMethodDto {

    @Schema(
            description = "Payment method code",
            example = "CASH"
    )
    private String code;

    @Schema(
            description = "Payment method name",
            example = "Cash"
    )
    private String name;

    @Schema(
            description = "Payment type",
            example = "OFFLINE",
            allowableValues = {"OFFLINE", "ONLINE", "MEMBER"}
    )
    private String type;

    @Schema(
            description = "Icon URL for the payment method",
            example = "https://example.com/icons/cash.png"
    )
    private String iconUrl;

    @Schema(
            description = "Whether the payment method is active",
            example = "true"
    )
    private boolean active;
}