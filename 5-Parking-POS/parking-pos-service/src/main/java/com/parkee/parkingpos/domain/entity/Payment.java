package com.parkee.parkingpos.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity untuk pembayaran parkir
 * Mendukung berbagai metode pembayaran di Indonesia
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_time", columnList = "payment_time"),
        @Index(name = "idx_payment_method", columnList = "payment_method"),
        @Index(name = "idx_reference_number", columnList = "reference_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_ticket_id", nullable = false)
    private ParkingTicket parkingTicket;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_time", nullable = false)
    private LocalDateTime paymentTime;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        PENDING, SUCCESS, FAILED, CANCELLED
    }
}