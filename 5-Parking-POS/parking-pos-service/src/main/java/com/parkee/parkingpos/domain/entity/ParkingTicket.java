package com.parkee.parkingpos.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity untuk tiket parkir
 * Menyimpan data check-in, check-out, dan pembayaran
 */
@Entity
@Table(name = "parking_tickets", indexes = {
        @Index(name = "idx_plate_number", columnList = "plate_number"),
        @Index(name = "idx_check_in_time", columnList = "check_in_time"),
        @Index(name = "idx_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plate_number", nullable = false, length = 20)
    private String plateNumber;

    @Column(name = "vehicle_type", length = 20)
    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @Column(name = "check_in_time", nullable = false)
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "check_in_photo_path")
    private String checkInPhotoPath;

    @Column(name = "check_out_photo_path")
    private String checkOutPhotoPath;

    @Column(name = "check_in_gate", length = 50)
    private String checkInGate;

    @Column(name = "check_out_gate", length = 50)
    private String checkOutGate;

    @Column(name = "check_in_operator", length = 100)
    private String checkInOperator;

    @Column(name = "check_out_operator", length = 100)
    private String checkOutOperator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "member_name", length = 100)
    private String memberName;

    @Column(name = "parking_fee", precision = 10, scale = 2)
    private BigDecimal parkingFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @OneToOne(mappedBy = "parkingTicket", cascade = CascadeType.ALL)
    private Payment payment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum Status {
        ACTIVE, COMPLETED, CANCELLED
    }

    public enum VehicleType {
        CAR, MOTORCYCLE, TRUCK, BUS
    }
}