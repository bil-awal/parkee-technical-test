package com.parkee.parkingpos.dto;

import com.parkee.parkingpos.domain.entity.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO untuk request check-out kendaraan
 */
@Data
@Schema(description = "Vehicle check-out request")
public class CheckOutRequestDto {

    @NotBlank(message = "Plat nomor tidak boleh kosong")
    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String plateNumber;

    @NotNull(message = "Metode pembayaran harus dipilih")
    @Schema(
            description = "Payment method",
            example = "CASH",
            requiredMode = Schema.RequiredMode.REQUIRED,
            allowableValues = {"CASH", "CREDIT_CARD", "DEBIT_CARD", "E_WALLET", "MEMBER_BALANCE"}
    )
    private PaymentMethod paymentMethod;

    @Schema(
            description = "Voucher code for discount",
            example = "DISC20"
    )
    private String voucherCode;

    @NotBlank(message = "Gate tidak boleh kosong")
    @Schema(
            description = "Exit gate identifier",
            example = "GATE_B",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String gate;

    @NotBlank(message = "Nama operator tidak boleh kosong")
    @Schema(
            description = "Operator name who processes the check-out",
            example = "Jane Smith",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String operatorName;
}