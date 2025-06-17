package com.parkee.parkingpos.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity untuk voucher diskon
 * Bisa berupa potongan harga atau persentase
 */
@Entity
@Table(name = "vouchers", indexes = {
        @Index(name = "idx_voucher_code", columnList = "code", unique = true),
        @Index(name = "idx_valid_dates", columnList = "valid_from,valid_until")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "minimum_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minimumAmount = BigDecimal.ZERO;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "terminated_at")
    private LocalDateTime terminatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return active &&
                now.isAfter(validFrom) &&
                now.isBefore(validUntil) &&
                (usageLimit == null || usageCount < usageLimit);
    }

    public enum DiscountType {
        PERCENTAGE, FIXED_AMOUNT
    }
}