package com.parkee.parkingpos.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity untuk invoice/struk pembayaran
 * Menyimpan detail transaksi untuk keperluan laporan
 */
@Entity
@Table(name = "invoice_receipts", indexes = {
        @Index(name = "idx_invoice_number", columnList = "invoice_number", unique = true),
        @Index(name = "idx_invoice_date", columnList = "invoice_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true, nullable = false, length = 50)
    private String invoiceNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_ticket_id", nullable = false)
    private ParkingTicket parkingTicket;

    @Column(name = "invoice_date", nullable = false)
    private LocalDateTime invoiceDate;

    @Column(name = "plate_number", nullable = false, length = 20)
    private String plateNumber;

    @Column(name = "check_in_time", nullable = false)
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time", nullable = false)
    private LocalDateTime checkOutTime;

    @Column(name = "duration_minutes", nullable = false)
    private Long durationMinutes;

    @Column(name = "base_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseAmount;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PAID;

    @Column(name = "member_name", length = 100)
    private String memberName;

    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    @Column(name = "operator_name", length = 100)
    private String operatorName;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        PAID, CANCELLED, REFUNDED
    }
}