package com.parkee.parkingpos.dto;

import com.parkee.parkingpos.domain.entity.Voucher.DiscountType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO untuk membuat voucher baru
 */
@Data
@Schema(description = "Voucher creation request")
public class VoucherCreateDto {

    @NotBlank(message = "Kode voucher tidak boleh kosong")
    @Pattern(regexp = "^[A-Z0-9]{4,20}$", message = "Kode voucher harus huruf kapital dan angka")
    @Schema(
            description = "Voucher code",
            example = "DISC20OFF",
            pattern = "^[A-Z0-9]{4,20}$",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String code;

    @NotBlank(message = "Deskripsi tidak boleh kosong")
    @Size(max = 200, message = "Deskripsi maksimal 200 karakter")
    @Schema(
            description = "Voucher description",
            example = "20% discount for all parking",
            maxLength = 200,
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String description;

    @NotNull(message = "Tipe diskon harus dipilih")
    @Schema(
            description = "Discount type",
            example = "PERCENTAGE",
            requiredMode = Schema.RequiredMode.REQUIRED,
            allowableValues = {"PERCENTAGE", "FIXED_AMOUNT"}
    )
    private DiscountType discountType;

    @NotNull(message = "Nilai diskon tidak boleh kosong")
    @DecimalMin(value = "0", message = "Nilai diskon tidak boleh negatif")
    @Schema(
            description = "Discount value (percentage or fixed amount)",
            example = "20.00",
            minimum = "0",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private BigDecimal discountValue;

    @DecimalMin(value = "0", message = "Minimum amount tidak boleh negatif")
    @Schema(
            description = "Minimum transaction amount to use voucher",
            example = "30000.00",
            minimum = "0",
            defaultValue = "0"
    )
    private BigDecimal minimumAmount = BigDecimal.ZERO;

    @NotNull(message = "Tanggal mulai tidak boleh kosong")
    @Future(message = "Tanggal mulai harus di masa depan")
    @Schema(
            description = "Voucher valid from date",
            example = "2025-02-01T00:00:00",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private LocalDateTime validFrom;

    @NotNull(message = "Tanggal berakhir tidak boleh kosong")
    @Schema(
            description = "Voucher valid until date",
            example = "2025-02-28T23:59:59",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private LocalDateTime validUntil;

    @Min(value = 1, message = "Usage limit minimal 1")
    @Schema(
            description = "Maximum number of times voucher can be used",
            example = "100",
            minimum = "1"
    )
    private Integer usageLimit;
}