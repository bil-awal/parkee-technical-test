package com.parkee.parkingpos.service;

import com.parkee.parkingpos.domain.entity.ParkingTicket;
import com.parkee.parkingpos.domain.repository.*;
import com.parkee.parkingpos.dto.DashboardStatisticsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service untuk dashboard dan statistik
 * Menyediakan data analitik untuk monitoring
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ParkingTicketRepository parkingTicketRepository;
    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Cacheable(value = "dashboardStats", key = "#startDate + '_' + #endDate", unless = "#result == null")
    public DashboardStatisticsDto getStatistics(LocalDate startDate, LocalDate endDate) {
        log.info("Getting dashboard statistics from {} to {}", startDate, endDate);

        // Set defaults
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Today's statistics - use current date
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(23, 59, 59);

        log.info("Today: {}, range: {} to {}", today, todayStart, todayEnd);

        // Count vehicles checked in today
        long totalVehiclesToday = parkingTicketRepository
                .findByCheckInTimeBetween(todayStart, todayEnd, Pageable.unpaged())
                .getTotalElements();

        // Count active vehicles (status = ACTIVE)
        long activeVehicles = parkingTicketRepository.countByStatus(ParkingTicket.Status.ACTIVE);

        // Revenue today - from successful payments made today
        BigDecimal totalRevenueToday = paymentRepository.getTotalRevenue(todayStart, todayEnd);
        if (totalRevenueToday == null) totalRevenueToday = BigDecimal.ZERO;

        // Revenue for the requested period
        BigDecimal totalRevenuePeriod = paymentRepository.getTotalRevenue(startDateTime, endDateTime);
        if (totalRevenuePeriod == null) totalRevenuePeriod = BigDecimal.ZERO;

        // Payment method distribution
        List<Object[]> paymentStats = paymentRepository.getPaymentMethodStatistics(startDateTime, endDateTime);
        Map<String, BigDecimal> paymentMethodDistribution = new HashMap<>();
        for (Object[] stat : paymentStats) {
            String method = stat[0].toString();
            BigDecimal amount = (BigDecimal) stat[2];
            paymentMethodDistribution.put(method, amount);
        }

        // Vehicle type distribution
        List<ParkingTicket> tickets = parkingTicketRepository
                .findByCheckInTimeBetween(startDateTime, endDateTime, Pageable.unpaged())
                .getContent();

        Map<String, Long> vehicleTypeDistribution = tickets.stream()
                .collect(Collectors.groupingBy(
                        ticket -> ticket.getVehicleType().toString(),
                        Collectors.counting()
                ));

        // Daily statistics
        List<DashboardStatisticsDto.DailyStatistic> dailyStatistics = getDailyStatistics(startDate, endDate);

        // Top members (simplified)
        List<DashboardStatisticsDto.TopMember> topMembers = memberRepository
                .findByActiveTrue(Pageable.ofSize(5))
                .getContent()
                .stream()
                .map(member -> DashboardStatisticsDto.TopMember.builder()
                        .memberCode(member.getMemberCode())
                        .name(member.getName())
                        .plateNumber(member.getVehiclePlateNumber())
                        .totalParkings(0L) // Simplified for now
                        .totalSpent(BigDecimal.ZERO)
                        .build())
                .collect(Collectors.toList());

        log.info("Statistics calculated - Today: {} vehicles, {} revenue",
                totalVehiclesToday, totalRevenueToday);

        return DashboardStatisticsDto.builder()
                .totalVehiclesToday(totalVehiclesToday)
                .activeVehicles(activeVehicles)
                .totalRevenueToday(totalRevenueToday)
                .totalRevenuePeriod(totalRevenuePeriod)
                .paymentMethodDistribution(paymentMethodDistribution)
                .vehicleTypeDistribution(vehicleTypeDistribution)
                .dailyStatistics(dailyStatistics)
                .topMembers(topMembers)
                .build();
    }

    /**
     * Get total revenue untuk date range tertentu
     */
    private BigDecimal getTotalRevenueForDateRange(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        log.info("Calculating revenue from {} to {}", startDateTime, endDateTime);

        BigDecimal revenue = paymentRepository.getTotalRevenue(startDateTime, endDateTime);
        if (revenue == null) {
            revenue = BigDecimal.ZERO;
        }

        log.info("Revenue calculated: {}", revenue);
        return revenue;
    }

    /**
     * Get payment method distribution
     */
    private Map<String, BigDecimal> getPaymentMethodDistribution(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        List<Object[]> paymentStats = paymentRepository.getPaymentMethodStatistics(startDateTime, endDateTime);
        Map<String, BigDecimal> distribution = new HashMap<>();

        for (Object[] stat : paymentStats) {
            String method = stat[0].toString();
            BigDecimal amount = (BigDecimal) stat[2]; // stat[2] should be total amount
            distribution.put(method, amount);
        }

        log.info("Payment method distribution: {}", distribution);
        return distribution;
    }

    /**
     * Calculate average parking duration dalam jam
     */
    private Double calculateAverageParkingDuration(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        List<ParkingTicket> completedTickets = parkingTicketRepository
                .findByCheckInTimeBetween(startDateTime, endDateTime, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(ticket -> ticket.getStatus() == ParkingTicket.Status.COMPLETED
                        && ticket.getCheckOutTime() != null)
                .collect(Collectors.toList());

        if (completedTickets.isEmpty()) {
            return null;
        }

        double totalHours = completedTickets.stream()
                .mapToLong(ticket -> {
                    long minutes = java.time.Duration.between(
                            ticket.getCheckInTime(),
                            ticket.getCheckOutTime()
                    ).toMinutes();
                    return minutes;
                })
                .average()
                .orElse(0.0);

        return totalHours / 60.0; // Convert minutes to hours
    }

    /**
     * Get vehicle type distribution
     */
    private Map<String, Long> getVehicleTypeDistribution(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        List<ParkingTicket> tickets = parkingTicketRepository
                .findByCheckInTimeBetween(startDateTime, endDateTime, Pageable.unpaged())
                .getContent();

        return tickets.stream()
                .collect(Collectors.groupingBy(
                        ticket -> ticket.getVehicleType().toString(),
                        Collectors.counting()
                ));
    }

    /**
     * Generate report (stub - implement sesuai kebutuhan)
     */
    public byte[] generateReport(LocalDate startDate, LocalDate endDate, String format) {
        log.info("Generate report format {} dari {} sampai {}", format, startDate, endDate);

        // TODO: Implement report generation
        // Bisa menggunakan JasperReports, Apache POI untuk Excel, atau library PDF

        return "Sample Report Content".getBytes();
    }

    /**
     * Get daily statistics
     */
    private List<DashboardStatisticsDto.DailyStatistic> getDailyStatistics(LocalDate startDate, LocalDate endDate) {
        List<DashboardStatisticsDto.DailyStatistic> statistics = new ArrayList<>();

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            LocalDateTime dayStart = currentDate.atStartOfDay();
            LocalDateTime dayEnd = currentDate.atTime(23, 59, 59);

            long count = parkingTicketRepository
                    .findByCheckInTimeBetween(dayStart, dayEnd, Pageable.unpaged())
                    .getTotalElements();

            BigDecimal revenue = getTotalRevenueForDateRange(dayStart, dayEnd);

            statistics.add(DashboardStatisticsDto.DailyStatistic.builder()
                    .date(currentDate.toString())
                    .totalVehicles(count)
                    .totalRevenue(revenue)
                    .build());

            currentDate = currentDate.plusDays(1);
        }

        return statistics;
    }

    /**
     * Get top members by parking frequency
     */
    private List<DashboardStatisticsDto.TopMember> getTopMembers(int limit) {
        List<DashboardStatisticsDto.TopMember> topMembers = new ArrayList<>();

        // Get active members
        List<Object[]> members = memberRepository.findByActiveTrue(Pageable.ofSize(limit))
                .getContent()
                .stream()
                .map(member -> new Object[]{member.getId(), member})
                .collect(Collectors.toList());

        if (!members.isEmpty()) {
            // Extract member IDs untuk query parking counts
            List<String> plateNumbers = members.stream()
                    .map(arr -> ((com.parkee.parkingpos.domain.entity.Member) arr[1]).getVehiclePlateNumber())
                    .collect(Collectors.toList());

            // Get parking counts untuk semua plate numbers sekaligus
            Map<String, Long> parkingCounts = parkingTicketRepository.getParkingCountsByPlateNumbers(plateNumbers);

            // Build top members list
            for (Object[] memberArr : members) {
                com.parkee.parkingpos.domain.entity.Member member =
                        (com.parkee.parkingpos.domain.entity.Member) memberArr[1];

                long totalParkings = parkingCounts.getOrDefault(member.getVehiclePlateNumber(), 0L);

                topMembers.add(DashboardStatisticsDto.TopMember.builder()
                        .memberCode(member.getMemberCode())
                        .name(member.getName())
                        .plateNumber(member.getVehiclePlateNumber())
                        .totalParkings(totalParkings)
                        .totalSpent(BigDecimal.ZERO) // TODO: Calculate from payments if needed
                        .build());
            }

            // Sort by parking frequency
            topMembers.sort((a, b) -> Long.compare(b.getTotalParkings(), a.getTotalParkings()));
        }

        return topMembers.stream().limit(limit).collect(Collectors.toList());
    }
}