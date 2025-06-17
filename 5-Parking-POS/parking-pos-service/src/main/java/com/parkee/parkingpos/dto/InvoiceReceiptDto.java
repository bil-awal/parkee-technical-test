package com.parkee.parkingpos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO untuk invoice/struk pembayaran
 */
@Data
@Builder
@Schema(description = "Invoice receipt for parking payment")
public class InvoiceReceiptDto {

    @Schema(
            description = "Invoice number",
            example = "INV/2025/01/00001"
    )
    private String invoiceNumber;

    @Schema(
            description = "Invoice generation date and time",
            example = "2025-01-16T14:30:00"
    )
    private LocalDateTime invoiceDate;

    @Schema(
            description = "Vehicle plate number",
            example = "B1234CD"
    )
    private String plateNumber;

    @Schema(
            description = "Check-in date and time",
            example = "2025-01-16T10:00:00"
    )
    private LocalDateTime checkInTime;

    @Schema(
            description = "Check-out date and time",
            example = "2025-01-16T14:30:00"
    )
    private LocalDateTime checkOutTime;

    @Schema(
            description = "Parking duration",
            example = "4 hours 30 minutes"
    )
    private String duration;

    @Schema(
            description = "Base parking fee before discount",
            example = "15000.00"
    )
    private BigDecimal baseAmount;

    @Schema(
            description = "Discount amount",
            example = "3000.00"
    )
    private BigDecimal discountAmount;

    @Schema(
            description = "Total amount to pay",
            example = "12000.00"
    )
    private BigDecimal totalAmount;

    @Schema(
            description = "Payment method used",
            example = "CASH"
    )
    private String paymentMethod;

    @Schema(
            description = "Payment reference number",
            example = "PAY123456"
    )
    private String paymentReference;

    @Schema(
            description = "Member name if applicable",
            example = "John Doe"
    )
    private String memberName;

    @Schema(
            description = "Voucher code used",
            example = "DISC20"
    )
    private String voucherCode;

    @Schema(
            description = "Operator name",
            example = "Jane Smith"
    )
    private String operatorName;

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
}