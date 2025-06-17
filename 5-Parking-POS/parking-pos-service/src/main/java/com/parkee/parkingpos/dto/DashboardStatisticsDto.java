package com.parkee.parkingpos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO untuk statistik dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dashboard statistics")
public class DashboardStatisticsDto {

    @Schema(
            description = "Total vehicles today",
            example = "150"
    )
    private Long totalVehiclesToday;

    @Schema(
            description = "Currently active vehicles in parking",
            example = "45"
    )
    private Long activeVehicles;

    @Schema(
            description = "Total revenue for today",
            example = "450000.00"
    )
    private BigDecimal totalRevenueToday;

    @Schema(
            description = "Total revenue for selected period",
            example = "12500000.00"
    )
    private BigDecimal totalRevenuePeriod;

    @Schema(
            description = "Average parking duration in hours",
            example = "2.5"
    )
    private Double averageParkingDuration;

    @Schema(
            description = "Distribution of vehicles by type"
    )
    private Map<String, Long> vehicleTypeDistribution;

    @Schema(
            description = "Distribution of revenue by payment method"
    )
    private Map<String, BigDecimal> paymentMethodDistribution;

    @Schema(
            description = "Daily statistics list"
    )
    private List<DailyStatistic> dailyStatistics;

    @Schema(
            description = "Top members by usage"
    )
    private List<TopMember> topMembers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Daily statistic data")
    public static class DailyStatistic {
        @Schema(
                description = "Date in YYYY-MM-DD format",
                example = "2025-01-16"
        )
        private String date;

        @Schema(
                description = "Total vehicles for the day",
                example = "120"
        )
        private Long totalVehicles;

        @Schema(
                description = "Total revenue for the day",
                example = "360000.00"
        )
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Top member information")
    public static class TopMember {
        @Schema(
                description = "Member code",
                example = "MBR001"
        )
        private String memberCode;

        @Schema(
                description = "Member name",
                example = "John Doe"
        )
        private String name;

        @Schema(
                description = "Member's vehicle plate number",
                example = "B1234CD"
        )
        private String plateNumber;

        @Schema(
                description = "Total parking sessions",
                example = "25"
        )
        private Long totalParkings;

        @Schema(
                description = "Total amount spent",
                example = "750000.00"
        )
        private BigDecimal totalSpent;
    }
}