package com.parkee.parkingpos.domain.repository;

import com.parkee.parkingpos.domain.entity.ParkingTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface ParkingTicketRepository extends JpaRepository<ParkingTicket, Long> {

    Optional<ParkingTicket> findByPlateNumberAndStatus(String plateNumber, ParkingTicket.Status status);

    Page<ParkingTicket> findByPlateNumberContaining(String plateNumber, Pageable pageable);

    Page<ParkingTicket> findByStatus(ParkingTicket.Status status, Pageable pageable);

    Page<ParkingTicket> findByCheckInTimeBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Query("SELECT pt FROM ParkingTicket pt WHERE pt.plateNumber = :plateNumber AND DATE(pt.checkInTime) = :date")
    Page<ParkingTicket> findByPlateNumberAndDate(@Param("plateNumber") String plateNumber,
                                                 @Param("date") LocalDate date, Pageable pageable);

    @Query("SELECT COUNT(pt) FROM ParkingTicket pt WHERE pt.status = :status")
    long countByStatus(@Param("status") ParkingTicket.Status status);

    /**
     * Menghitung jumlah parkir untuk setiap plat nomor dalam daftar
     * Menggunakan custom query untuk efisiensi
     */
    @Query("SELECT pt.plateNumber AS plateNumber, COUNT(pt) AS count " +
            "FROM ParkingTicket pt " +
            "WHERE pt.plateNumber IN :plateNumbers " +
            "GROUP BY pt.plateNumber")
    List<Object[]> countParkingsByPlateNumbers(@Param("plateNumbers") List<String> plateNumbers);

    /**
     * Default method untuk mengkonversi hasil query menjadi Map
     * Key: plat nomor
     * Value: jumlah parkir
     */
    default Map<String, Long> getParkingCountsByPlateNumbers(List<String> plateNumbers) {
        List<Object[]> results = countParkingsByPlateNumbers(plateNumbers);
        return results.stream()
                .collect(Collectors.toMap(
                        arr -> (String) arr[0],
                        arr -> (Long) arr[1]
                ));
    }

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentTime BETWEEN :startDate AND :endDate AND p.status = 'SUCCESS'")
    BigDecimal getTotalRevenue(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.paymentMethod, COUNT(p), SUM(p.amount) FROM Payment p " +
            "WHERE p.paymentTime BETWEEN :startDate AND :endDate AND p.status = 'SUCCESS' " +
            "GROUP BY p.paymentMethod")
    List<Object[]> getPaymentMethodStatistics(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    Page<ParkingTicket> findByPlateNumberContainingAndStatus(String plateNumber, ParkingTicket.Status status, Pageable pageable);

    Page<ParkingTicket> findByCheckInTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, ParkingTicket.Status status, Pageable pageable);

    @Query("SELECT pt FROM ParkingTicket pt WHERE " +
            "UPPER(pt.plateNumber) LIKE UPPER(CONCAT('%', :plateNumber, '%')) AND " +
            "pt.checkInTime BETWEEN :startTime AND :endTime AND " +
            "pt.status = :status")
    Page<ParkingTicket> findByPlateNumberContainingAndCheckInTimeBetweenAndStatus(
            @Param("plateNumber") String plateNumber,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("status") ParkingTicket.Status status,
            Pageable pageable);
}