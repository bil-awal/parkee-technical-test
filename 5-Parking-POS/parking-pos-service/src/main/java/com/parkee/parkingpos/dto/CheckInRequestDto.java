package com.parkee.parkingpos.dto;

import com.parkee.parkingpos.domain.entity.ParkingTicket.VehicleType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * DTO untuk request check-in kendaraan
 */
@Data
@Schema(description = "Vehicle check-in request")
public class CheckInRequestDto {

    @NotBlank(message = "Plat nomor tidak boleh kosong")
    @Pattern(regexp = "^[A-Z]{1,2}\\d{1,4}[A-Z]{1,3}$",
            message = "Format plat nomor tidak valid")
    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD",
            pattern = "^[A-Z]{1,2}\\d{1,4}[A-Z]{1,3}$",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String plateNumber;

    @NotNull(message = "Tipe kendaraan harus dipilih")
    @Schema(
            description = "Type of vehicle",
            example = "CAR",
            requiredMode = Schema.RequiredMode.REQUIRED,
            allowableValues = {"CAR", "MOTORCYCLE", "TRUCK", "BUS"}
    )
    private VehicleType vehicleType;

    @NotBlank(message = "Gate tidak boleh kosong")
    @Schema(
            description = "Entry gate identifier",
            example = "GATE_A",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String gate;

    @NotBlank(message = "Nama operator tidak boleh kosong")
    @Schema(
            description = "Operator name who processes the check-in",
            example = "John Doe",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String operatorName;
}