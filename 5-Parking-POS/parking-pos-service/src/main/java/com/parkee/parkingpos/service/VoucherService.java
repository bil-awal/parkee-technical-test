package com.parkee.parkingpos.service;

import com.parkee.parkingpos.domain.entity.Voucher;
import com.parkee.parkingpos.domain.repository.VoucherRepository;
import com.parkee.parkingpos.dto.VoucherCreateDto;
import com.parkee.parkingpos.dto.VoucherResponseDto;
import com.parkee.parkingpos.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service untuk mengelola voucher
 * Menangani pembuatan, validasi, dan terminasi voucher
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VoucherService {

    private final VoucherRepository voucherRepository;

    /**
     * Create voucher baru
     */
    @CacheEvict(value = "vouchers", allEntries = true)
    public VoucherResponseDto create(VoucherCreateDto request) {
        log.info("Membuat voucher baru: {}", request.getCode());

        // Validasi kode unik
        if (voucherRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Kode voucher " + request.getCode() + " sudah ada");
        }

        // Validasi tanggal
        if (request.getValidFrom().isAfter(request.getValidUntil())) {
            throw new IllegalArgumentException("Tanggal mulai tidak boleh setelah tanggal berakhir");
        }

        // Validasi discount value untuk percentage
        if (request.getDiscountType() == Voucher.DiscountType.PERCENTAGE &&
                request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Persentase diskon tidak boleh lebih dari 100%");
        }

        // Create voucher
        Voucher voucher = Voucher.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minimumAmount(request.getMinimumAmount())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .usageLimit(request.getUsageLimit())
                .active(true)
                .build();

        Voucher savedVoucher = voucherRepository.save(voucher);
        log.info("Voucher {} berhasil dibuat", savedVoucher.getCode());

        return mapToResponseDto(savedVoucher);
    }

    /**
     * Get all vouchers
     * Removed @Cacheable because PageImpl cannot be serialized to Redis properly
     */
    public Page<VoucherResponseDto> findAll(Boolean activeOnly, Pageable pageable) {
        log.info("Get vouchers, activeOnly: {}", activeOnly);

        Page<Voucher> vouchers;
        if (Boolean.TRUE.equals(activeOnly)) {
            vouchers = voucherRepository.findActiveAndValid(LocalDateTime.now(), pageable);
        } else {
            vouchers = voucherRepository.findAll(pageable);
        }

        return vouchers.map(this::mapToResponseDto);
    }

    /**
     * Get active vouchers as List (cacheable alternative)
     */
    @Cacheable(value = "active_vouchers", key = "'active_list'")
    public List<VoucherResponseDto> findActiveVouchers() {
        log.info("Get active vouchers list");

        List<Voucher> vouchers = voucherRepository.findByActiveTrue(Pageable.unpaged()).getContent();
        return vouchers.stream()
                .filter(Voucher::isValid)
                .map(this::mapToResponseDto)
                .toList();
    }

    /**
     * Find voucher by code (cacheable)
     */
    @Cacheable(value = "voucher_by_code", key = "#code")
    public VoucherResponseDto findByCode(String code) {
        log.info("Finding voucher by code: {}", code);

        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher tidak ditemukan dengan kode: " + code));

        return mapToResponseDto(voucher);
    }

    /**
     * Terminate voucher
     */
    @CacheEvict(value = {"vouchers", "active_vouchers", "voucher_by_code"}, allEntries = true)
    public VoucherResponseDto terminate(Long id) {
        log.info("Terminate voucher ID: {}", id);

        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher tidak ditemukan dengan ID: " + id));

        if (!voucher.getActive()) {
            throw new IllegalStateException("Voucher sudah tidak aktif");
        }

        // Terminate voucher
        voucher.setActive(false);
        voucher.setTerminatedAt(LocalDateTime.now());

        Voucher updatedVoucher = voucherRepository.save(voucher);
        log.info("Voucher {} berhasil diterminasi", voucher.getCode());

        return mapToResponseDto(updatedVoucher);
    }

    /**
     * Map entity to response DTO
     */
    private VoucherResponseDto mapToResponseDto(Voucher voucher) {
        return VoucherResponseDto.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType().name())
                .discountValue(voucher.getDiscountValue())
                .minimumAmount(voucher.getMinimumAmount())
                .validFrom(voucher.getValidFrom())
                .validUntil(voucher.getValidUntil())
                .active(voucher.getActive())
                .usageLimit(voucher.getUsageLimit())
                .usageCount(voucher.getUsageCount())
                .isValid(voucher.isValid())
                .build();
    }
}