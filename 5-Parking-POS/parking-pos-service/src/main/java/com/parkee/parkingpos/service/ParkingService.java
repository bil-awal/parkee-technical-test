package com.parkee.parkingpos.service;

import com.parkee.parkingpos.domain.entity.*;
import com.parkee.parkingpos.domain.repository.*;
import com.parkee.parkingpos.dto.*;
import com.parkee.parkingpos.exception.*;
import com.parkee.parkingpos.util.FileUploadUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Service untuk mengelola proses parkir
 * Menangani check-in, check-out, kalkulasi biaya, dan validasi
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ParkingService {

    private final ParkingTicketRepository parkingTicketRepository;
    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final VoucherRepository voucherRepository;
    private final InvoiceReceiptRepository invoiceReceiptRepository;
    private final InvoiceReceiptService invoiceReceiptService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final FileUploadUtil fileUploadUtil;

    @Value("${parking.rate-per-hour}")
    private BigDecimal ratePerHour;

    @Value("${parking.grace-period-minutes}")
    private int gracePeriodMinutes;

    @Value("${parking.max-parking-hours}")
    private int maxParkingHours;

    private static final String ACTIVE_PARKING_KEY = "active_parking:";
    private static final String PARKING_STATS_KEY = "parking_stats:";

    @Value("${app.base-url}")
    private String baseUrl; // http://localhost:8081

    @Value("${app.photo-endpoint}")
    private String photoEndpoint; // /api/parking/photos

    /**
     * Check-in kendaraan baru
     * Validasi plate number tidak sedang parkir
     */
    public ParkingTicketResponseDto checkIn(CheckInRequestDto request, MultipartFile photo) {
        log.info("Processing check-in untuk plate number: {}", request.getPlateNumber());

        // Validasi apakah kendaraan sudah parkir
        validateVehicleNotParked(request.getPlateNumber());

        // Upload foto jika ada
        String photoPath = null;
        if (photo != null && !photo.isEmpty()) {
            photoPath = fileUploadUtil.uploadFile(photo, "checkin");
        }

        // Buat ticket parkir baru
        ParkingTicket ticket = ParkingTicket.builder()
                .plateNumber(request.getPlateNumber().toUpperCase())
                .vehicleType(request.getVehicleType())
                .checkInTime(LocalDateTime.now())
                .checkInPhotoPath(photoPath)
                .checkInGate(request.getGate())
                .checkInOperator(request.getOperatorName())
                .status(ParkingTicket.Status.ACTIVE)
                .build();

        // Cek apakah member
        memberRepository.findByVehiclePlateNumberAndActiveTrue(request.getPlateNumber())
                .ifPresent(member -> {
                    ticket.setMember(member);
                    ticket.setMemberName(member.getName());
                });

        ParkingTicket savedTicket = parkingTicketRepository.save(ticket);

        // Simpan ke Redis untuk tracking aktif
        String redisKey = ACTIVE_PARKING_KEY + request.getPlateNumber().toUpperCase();
        redisTemplate.opsForValue().set(redisKey, savedTicket.getId(), 24, TimeUnit.HOURS);

        // Update statistik
        updateParkingStats("CHECK_IN");

        log.info("Check-in berhasil dengan ticket ID: {}", savedTicket.getId());
        return mapToResponseDto(savedTicket);
    }

    /**
     * Get active ticket berdasarkan plate number
     */
    @Cacheable(value = "activeTickets", key = "#plateNumber")
    public ParkingTicketResponseDto getActiveTicketByPlateNumber(String plateNumber) {
        log.info("Mencari active ticket untuk plate: {}", plateNumber);

        ParkingTicket ticket = parkingTicketRepository
                .findByPlateNumberAndStatus(plateNumber.toUpperCase(), ParkingTicket.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tidak ada kendaraan aktif dengan plat nomor: " + plateNumber));

        return mapToResponseDto(ticket);
    }

    /**
     * Kalkulasi biaya parkir
     */
    public ParkingCalculationDto calculateParkingFee(String plateNumber, String voucherCode) {
        log.info("Menghitung biaya parkir untuk plate: {}", plateNumber);

        ParkingTicket ticket = parkingTicketRepository
                .findByPlateNumberAndStatus(plateNumber.toUpperCase(), ParkingTicket.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tidak ada kendaraan aktif dengan plat nomor: " + plateNumber));

        LocalDateTime now = LocalDateTime.now();
        long minutesParked = ChronoUnit.MINUTES.between(ticket.getCheckInTime(), now);

        // Grace period check
        if (minutesParked <= gracePeriodMinutes) {
            return ParkingCalculationDto.builder()
                    .ticketId(ticket.getId())
                    .plateNumber(ticket.getPlateNumber())
                    .checkInTime(ticket.getCheckInTime())
                    .checkOutTime(now)
                    .duration(formatDuration(minutesParked))
                    .gracePeriod(true)
                    .baseFee(BigDecimal.ZERO)
                    .discount(BigDecimal.ZERO)
                    .totalFee(BigDecimal.ZERO)
                    .build();
        }

        // Hitung biaya dasar
        long hoursParked = (long) Math.ceil(minutesParked / 60.0);
        if (hoursParked > maxParkingHours) {
            hoursParked = maxParkingHours;
        }

        BigDecimal baseFee = ratePerHour.multiply(BigDecimal.valueOf(hoursParked));
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal totalFee = baseFee;

        // Apply voucher jika ada
        Voucher appliedVoucher = null;
        if (voucherCode != null && !voucherCode.isEmpty()) {
            appliedVoucher = validateAndApplyVoucher(voucherCode, baseFee);
            if (appliedVoucher != null) {
                discount = calculateDiscount(baseFee, appliedVoucher);
                totalFee = baseFee.subtract(discount);
            }
        }

        // Member discount
        if (ticket.getMember() != null) {
            BigDecimal memberDiscount = baseFee.multiply(BigDecimal.valueOf(0.1)); // 10% untuk member
            discount = discount.add(memberDiscount);
            totalFee = totalFee.subtract(memberDiscount);
        }

        return ParkingCalculationDto.builder()
                .ticketId(ticket.getId())
                .plateNumber(ticket.getPlateNumber())
                .checkInTime(ticket.getCheckInTime())
                .checkOutTime(now)
                .duration(formatDuration(minutesParked))
                .hoursParked(hoursParked)
                .baseFee(baseFee)
                .discount(discount)
                .totalFee(totalFee.max(BigDecimal.ZERO))
                .isMember(ticket.getMember() != null)
                .appliedVoucher(appliedVoucher != null ? appliedVoucher.getCode() : null)
                .build();
    }

    /**
     * Check-out kendaraan
     */
    @CacheEvict(value = "activeTickets", key = "#request.plateNumber")
    public InvoiceReceiptDto checkOut(CheckOutRequestDto request, MultipartFile photo) {
        log.info("Processing check-out untuk plate: {}", request.getPlateNumber());

        // Get ticket
        ParkingTicket ticket = parkingTicketRepository
                .findByPlateNumberAndStatus(request.getPlateNumber().toUpperCase(), ParkingTicket.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tidak ada kendaraan aktif dengan plat nomor: " + request.getPlateNumber()));

        ParkingCalculationDto calculation = calculateParkingFee(
                request.getPlateNumber(), request.getVoucherCode());

        // Upload foto keluar
        String photoPath = null;
        if (photo != null && !photo.isEmpty()) {
            photoPath = fileUploadUtil.uploadFile(photo, "checkout");
        }

        // Update ticket SETELAH calculation
        ticket.setCheckOutTime(LocalDateTime.now());
        ticket.setCheckOutPhotoPath(photoPath);
        ticket.setCheckOutGate(request.getGate());
        ticket.setCheckOutOperator(request.getOperatorName());
        ticket.setParkingFee(calculation.getTotalFee());
        ticket.setStatus(ParkingTicket.Status.COMPLETED); // Status diubah SETELAH calculation

        // Process payment
        Payment payment = processPayment(ticket, request, calculation);
        ticket.setPayment(payment);

        // Save ticket
        ParkingTicket savedTicket = parkingTicketRepository.save(ticket);

        // Generate invoice
        InvoiceReceiptDto invoice = invoiceReceiptService.generateInvoice(savedTicket, payment);

        // Clear Redis cache
        String redisKey = ACTIVE_PARKING_KEY + request.getPlateNumber().toUpperCase();
        redisTemplate.delete(redisKey);

        // Update stats
        updateParkingStats("CHECK_OUT");

        log.info("Check-out berhasil dengan invoice: {}", invoice.getInvoiceNumber());
        return invoice;
    }

    /**
     * Process payment
     */
    private Payment processPayment(ParkingTicket ticket, CheckOutRequestDto request,
                                   ParkingCalculationDto calculation) {

        Payment payment = Payment.builder()
                .parkingTicket(ticket)
                .amount(calculation.getTotalFee())
                .paymentMethod(request.getPaymentMethod())
                .paymentTime(LocalDateTime.now())
                .status(Payment.Status.PENDING)
                .build();

        // Jika member dan saldo cukup, potong saldo
        if (ticket.getMember() != null &&
                request.getPaymentMethod() == PaymentMethod.MEMBER_BALANCE) {

            Member member = ticket.getMember();
            if (member.getBalance().compareTo(calculation.getTotalFee()) < 0) {
                throw new InsufficientBalanceException("Saldo member tidak mencukupi");
            }

            member.setBalance(member.getBalance().subtract(calculation.getTotalFee()));
            memberRepository.save(member);
            payment.setStatus(Payment.Status.SUCCESS);
            payment.setReferenceNumber("MB-" + System.currentTimeMillis());
        } else {
            // Simulasi pembayaran non-tunai
            payment.setStatus(Payment.Status.SUCCESS);
            payment.setReferenceNumber(generatePaymentReference(request.getPaymentMethod()));
        }

        return paymentRepository.save(payment);
    }

    public Page<VehicleActivityDto> getVehicleActivities(String plateNumber, LocalDate date,
                                                         String status, Pageable pageable) {
        log.info("Getting vehicle activities - plateNumber: '{}', date: {}, status: '{}'",
                plateNumber, date, status);

        Page<ParkingTicket> tickets;

        try {
            // Clean parameters - treat null, empty, or whitespace-only as null
            String cleanPlateNumber = (plateNumber != null && !plateNumber.trim().isEmpty())
                    ? plateNumber.trim().toUpperCase() : null;

            ParkingTicket.Status ticketStatus = null;
            if (status != null && !status.trim().isEmpty()) {
                try {
                    ticketStatus = ParkingTicket.Status.valueOf(status.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status value: '{}', ignoring status filter", status);
                }
            }

            log.info("Cleaned parameters - plateNumber: '{}', date: {}, status: {}",
                    cleanPlateNumber, date, ticketStatus);

            // Apply filters based on available parameters
            if (cleanPlateNumber != null && date != null && ticketStatus != null) {
                // All three filters
                log.info("Applying all filters: plate={}, date={}, status={}", cleanPlateNumber, date, ticketStatus);
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(23, 59, 59);
                tickets = parkingTicketRepository.findByPlateNumberContainingAndCheckInTimeBetweenAndStatus(
                        cleanPlateNumber, startOfDay, endOfDay, ticketStatus, pageable);

            } else if (cleanPlateNumber != null && date != null) {
                // Plate and date
                log.info("Applying plate and date filters: plate={}, date={}", cleanPlateNumber, date);
                tickets = parkingTicketRepository.findByPlateNumberAndDate(cleanPlateNumber, date, pageable);

            } else if (cleanPlateNumber != null && ticketStatus != null) {
                // Plate and status
                log.info("Applying plate and status filters: plate={}, status={}", cleanPlateNumber, ticketStatus);
                tickets = parkingTicketRepository.findByPlateNumberContainingAndStatus(cleanPlateNumber, ticketStatus, pageable);

            } else if (date != null && ticketStatus != null) {
                // Date and status
                log.info("Applying date and status filters: date={}, status={}", date, ticketStatus);
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(23, 59, 59);
                tickets = parkingTicketRepository.findByCheckInTimeBetweenAndStatus(startOfDay, endOfDay, ticketStatus, pageable);

            } else if (cleanPlateNumber != null) {
                // Plate only
                log.info("Applying plate filter only: plate={}", cleanPlateNumber);
                tickets = parkingTicketRepository.findByPlateNumberContaining(cleanPlateNumber, pageable);

            } else if (date != null) {
                // Date only
                log.info("Applying date filter only: date={}", date);
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(23, 59, 59);
                log.info("Date range: {} to {}", startOfDay, endOfDay);
                tickets = parkingTicketRepository.findByCheckInTimeBetween(startOfDay, endOfDay, pageable);

            } else if (ticketStatus != null) {
                // Status only
                log.info("Applying status filter only: status={}", ticketStatus);
                tickets = parkingTicketRepository.findByStatus(ticketStatus, pageable);

            } else {
                // No filters
                log.info("No filters applied, getting all tickets");
                tickets = parkingTicketRepository.findAll(pageable);
            }

            log.info("Query executed successfully. Found {} tickets", tickets.getTotalElements());

            if (tickets.getTotalElements() == 0) {
                log.warn("No tickets found for the given criteria. Please check if data exists for the specified filters.");
            }

            return tickets.map(this::mapToActivityDto);

        } catch (Exception e) {
            log.error("Error getting vehicle activities with plateNumber='{}', date={}, status='{}'",
                    plateNumber, date, status, e);
            throw new RuntimeException("Failed to retrieve vehicle activities", e);
        }
    }

    /**
     * Get available payment methods
     */
    public List<PaymentMethodDto> getAvailablePaymentMethods() {
        return Arrays.stream(PaymentMethod.values())
                .map(method -> PaymentMethodDto.builder()
                        .code(method.name())
                        .name(method.getDisplayName())
                        .type(method.getType())
                        .iconUrl(method.getIconUrl())
                        .active(method.isActive())
                        .build())
                .filter(PaymentMethodDto::isActive)
                .collect(Collectors.toList());
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validasi kendaraan tidak sedang parkir
     */
    private void validateVehicleNotParked(String plateNumber) {
        String redisKey = ACTIVE_PARKING_KEY + plateNumber.toUpperCase();

        // Check Redis first
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            throw new VehicleAlreadyParkedException(
                    "Kendaraan dengan plat nomor " + plateNumber + " sudah parkir");
        }

        // Double check database
        parkingTicketRepository
                .findByPlateNumberAndStatus(plateNumber.toUpperCase(), ParkingTicket.Status.ACTIVE)
                .ifPresent(ticket -> {
                    throw new VehicleAlreadyParkedException(
                            "Kendaraan dengan plat nomor " + plateNumber + " sudah parkir");
                });
    }

    /**
     * Validate dan apply voucher
     */
    private Voucher validateAndApplyVoucher(String voucherCode, BigDecimal amount) {
        return voucherRepository.findByCodeAndActiveTrue(voucherCode)
                .filter(voucher -> voucher.isValid())
                .filter(voucher -> amount.compareTo(voucher.getMinimumAmount()) >= 0)
                .orElse(null);
    }

    /**
     * Calculate discount dari voucher
     */
    private BigDecimal calculateDiscount(BigDecimal baseFee, Voucher voucher) {
        if (voucher.getDiscountType() == Voucher.DiscountType.PERCENTAGE) {
            return baseFee.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            return voucher.getDiscountValue().min(baseFee);
        }
    }

    /**
     * Format duration untuk display
     */
    private String formatDuration(long minutes) {
        long hours = minutes / 60;
        long mins = minutes % 60;
        return String.format("%d jam %d menit", hours, mins);
    }

    /**
     * Generate payment reference number
     */
    private String generatePaymentReference(PaymentMethod method) {
        String prefix = switch (method) {
            case QRIS -> "QR";
            case EMONEY -> "EM";
            case FLAZZ -> "FL";
            case BRIZZI -> "BR";
            case TAPCASH -> "TC";
            case CASH -> "CS";
            default -> "OT";
        };
        return prefix + "-" + System.currentTimeMillis();
    }

    /**
     * Update parking statistics di Redis
     */
    private void updateParkingStats(String event) {
        String key = PARKING_STATS_KEY + LocalDate.now();
        redisTemplate.opsForHash().increment(key, event, 1);
        redisTemplate.expire(key, 30, TimeUnit.DAYS);
    }

    /**
     * Map entity to response DTO
     */
    private ParkingTicketResponseDto mapToResponseDto(ParkingTicket ticket) {
        log.info("Mapping ticket ID: {}, photoPath: {}", ticket.getId(), ticket.getCheckInPhotoPath());

        ParkingTicketResponseDto dto = ParkingTicketResponseDto.builder()
                .id(ticket.getId())
                .plateNumber(ticket.getPlateNumber())
                .vehicleType(String.valueOf(ticket.getVehicleType()))
                .checkInTime(ticket.getCheckInTime())
                .checkOutTime(ticket.getCheckOutTime())
                .checkInGate(ticket.getCheckInGate())
                .checkOutGate(ticket.getCheckOutGate())
                .checkInOperator(ticket.getCheckInOperator())
                .checkOutOperator(ticket.getCheckOutOperator())
                .status(ticket.getStatus().name())
                .memberName(ticket.getMemberName())
                .parkingFee(ticket.getParkingFee())
                .checkInPhotoPath(ticket.getCheckInPhotoPath())
                .checkOutPhotoPath(ticket.getCheckOutPhotoPath())
                .checkInPhotoUrl(buildPhotoUrl(ticket.getCheckInPhotoPath()))
                .checkOutPhotoUrl(buildPhotoUrl(ticket.getCheckOutPhotoPath()))
                .build();

        log.info("DTO mapped - photoPath: {}, photoUrl: {}",
                dto.getCheckInPhotoPath(), dto.getCheckInPhotoUrl());

        return dto;
    }

    /**
     * Build photo URL untuk display
     */
    private String buildPhotoUrl(String photoPath) {
        if (photoPath == null || photoPath.isEmpty()) {
            return null;
        }

        // Remove leading slash if exists untuk avoid double slash
        String cleanPath = photoPath.startsWith("/") ? photoPath.substring(1) : photoPath;

        return baseUrl + photoEndpoint + "/" + cleanPath;
    }


    /**
     * Map to activity DTO untuk admin
     */
    private VehicleActivityDto mapToActivityDto(ParkingTicket ticket) {
        return VehicleActivityDto.builder()
                .ticketId(ticket.getId())
                .plateNumber(ticket.getPlateNumber())
                .vehicleType(String.valueOf(ticket.getVehicleType()))
                .checkInTime(ticket.getCheckInTime())
                .checkOutTime(ticket.getCheckOutTime())
                .duration(ticket.getCheckOutTime() != null ?
                        formatDuration(ChronoUnit.MINUTES.between(
                                ticket.getCheckInTime(), ticket.getCheckOutTime())) : "-")
                .checkInGate(ticket.getCheckInGate())
                .checkOutGate(ticket.getCheckOutGate())
                .checkInOperator(ticket.getCheckInOperator())
                .checkOutOperator(ticket.getCheckOutOperator())
                .status(ticket.getStatus().name())
                .fee(ticket.getParkingFee())
                .paymentMethod(ticket.getPayment() != null ?
                        ticket.getPayment().getPaymentMethod().getDisplayName() : "-")
                .memberName(ticket.getMemberName())
                .checkInPhotoPath(ticket.getCheckInPhotoPath())
                .checkOutPhotoPath(ticket.getCheckOutPhotoPath())
                .checkInPhotoUrl(buildPhotoUrl(ticket.getCheckInPhotoPath()))
                .checkOutPhotoUrl(buildPhotoUrl(ticket.getCheckOutPhotoPath()))
                .build();
    }
}