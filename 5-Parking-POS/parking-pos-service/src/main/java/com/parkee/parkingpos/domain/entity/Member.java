package com.parkee.parkingpos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity untuk member parkir
 * Member mendapat benefit khusus dan bisa menggunakan saldo
 */
@Entity
@Table(name = "members", indexes = {
        @Index(name = "idx_vehicle_plate", columnList = "vehicle_plate_number", unique = true),
        @Index(name = "idx_email", columnList = "email"),
        @Index(name = "idx_phone", columnList = "phone_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_code", unique = true, nullable = false, length = 20)
    private String memberCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "vehicle_plate_number", unique = true, nullable = false, length = 20)
    private String vehiclePlateNumber;

    @Column(length = 100)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @OneToMany(mappedBy = "member", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ParkingTicket> parkingHistory = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "registered_at", updatable = false)
    private LocalDateTime registeredAt;

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}