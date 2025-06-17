package com.parkee.parkingpos.domain.repository;

import com.parkee.parkingpos.domain.entity.Payment;
import com.parkee.parkingpos.domain.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByPaymentTimeBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT p.paymentMethod, COUNT(p), SUM(p.amount) FROM Payment p " +
            "WHERE p.paymentTime BETWEEN :start AND :end AND p.status = 'SUCCESS' " +
            "GROUP BY p.paymentMethod")
    List<Object[]> getPaymentMethodStatistics(@Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS' " +
            "AND p.paymentTime BETWEEN :start AND :end")
    BigDecimal getTotalRevenue(@Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);
}