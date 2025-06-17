package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO untuk top up saldo member
 */
@Data
@Schema(description = "Member balance top-up request")
public class TopUpRequestDto {

    @NotNull(message = "Jumlah top up tidak boleh kosong")
    @DecimalMin(value = "10000", message = "Minimal top up Rp 10.000")
    @Schema(
            description = "Top-up amount",
            example = "50000.00",
            minimum = "10000",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private BigDecimal amount;
}