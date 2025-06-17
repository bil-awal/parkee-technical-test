package com.parkee.parkingpos.service;

import com.parkee.parkingpos.domain.entity.Member;
import com.parkee.parkingpos.domain.repository.MemberRepository;
import com.parkee.parkingpos.domain.repository.ParkingTicketRepository;
import com.parkee.parkingpos.dto.MemberRegistrationDto;
import com.parkee.parkingpos.dto.MemberResponseDto;
import com.parkee.parkingpos.dto.MemberUpdateDto;
import com.parkee.parkingpos.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service untuk mengelola member
 * Menangani registrasi, update, dan manajemen saldo
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;
    private final ParkingTicketRepository parkingTicketRepository;

    /**
     * Registrasi member baru
     */
    public MemberResponseDto register(MemberRegistrationDto request) {
        log.info("Registrasi member baru: {}", request.getName());

        // Validasi plate number belum terdaftar
        if (memberRepository.existsByVehiclePlateNumber(request.getVehiclePlateNumber())) {
            throw new IllegalArgumentException(
                    "Plat nomor " + request.getVehiclePlateNumber() + " sudah terdaftar sebagai member");
        }

        // Validasi email jika ada
        if (request.getEmail() != null && memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email sudah terdaftar");
        }

        // Generate member code
        String memberCode = generateMemberCode();

        // Create member
        Member member = Member.builder()
                .memberCode(memberCode)
                .name(request.getName())
                .vehiclePlateNumber(request.getVehiclePlateNumber().toUpperCase())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .balance(BigDecimal.ZERO)
                .active(true)
                .build();

        Member savedMember = memberRepository.save(member);
        log.info("Member berhasil terdaftar dengan kode: {}", memberCode);

        return mapToResponseDto(savedMember);
    }

    /**
     * Get all members dengan pagination dan search
     * Removed @Cacheable karena PageImpl tidak bisa di-serialize dengan baik
     */
    public Page<MemberResponseDto> findAll(String search, Pageable pageable) {
        Page<Member> raw;
        if (StringUtils.hasText(search)) {
            raw = memberRepository.searchActiveMembers(search, pageable);
        } else {
            raw = memberRepository.findByActiveTrue(pageable);
        }
        List<MemberResponseDto> dtos = raw.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
        // Wrap content + pageable + total back into a concrete PageImpl:
        return new PageImpl<>(dtos, pageable, raw.getTotalElements());
    }

    /**
     * Get member by ID
     */
    @Cacheable(value = "member", key = "#id")
    public MemberResponseDto findById(Long id) {
        log.info("Get member dengan ID: {}", id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member tidak ditemukan dengan ID: " + id));

        return mapToResponseDto(member);
    }

    /**
     * Update member
     */
    @CacheEvict(value = {"member"}, allEntries = true)
    public MemberResponseDto update(Long id, MemberUpdateDto request) {
        log.info("Update member ID: {}", id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member tidak ditemukan dengan ID: " + id));

        // Update fields jika ada
        if (request.getName() != null) {
            member.setName(request.getName());
        }
        if (request.getEmail() != null) {
            // Validasi email unique
            if (!request.getEmail().equals(member.getEmail()) &&
                    memberRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email sudah terdaftar");
            }
            member.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            member.setPhoneNumber(request.getPhoneNumber());
        }

        Member updatedMember = memberRepository.save(member);
        log.info("Member {} berhasil diupdate", member.getMemberCode());

        return mapToResponseDto(updatedMember);
    }

    /**
     * Delete/Deactivate member
     */
    @CacheEvict(value = {"member"}, allEntries = true)
    public void delete(Long id) {
        log.info("Deactivate member ID: {}", id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member tidak ditemukan dengan ID: " + id));

        // Soft delete - set active false
        member.setActive(false);
        memberRepository.save(member);

        log.info("Member {} berhasil dinonaktifkan", member.getMemberCode());
    }

    /**
     * Top up saldo member
     */
    @CacheEvict(value = {"member"}, key = "#id")
    public MemberResponseDto topUpBalance(Long id, BigDecimal amount) {
        log.info("Top up saldo member ID: {} sebesar: {}", id, amount);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member tidak ditemukan dengan ID: " + id));

        if (!member.getActive()) {
            throw new IllegalStateException("Member tidak aktif");
        }

        // Update balance
        member.setBalance(member.getBalance().add(amount));
        member.setLastActivity(LocalDateTime.now());

        Member updatedMember = memberRepository.save(member);
        log.info("Top up berhasil. Saldo baru member {}: {}",
                member.getMemberCode(), member.getBalance());

        return mapToResponseDto(updatedMember);
    }

    /**
     * Generate unique member code
     */
    private String generateMemberCode() {
        String code;
        do {
            // Format: MBR + 3 digit random
            code = String.format("MBR%03d", (int) (Math.random() * 1000));
        } while (memberRepository.findByMemberCode(code).isPresent());

        return code;
    }

    /**
     * Map entity to response DTO
     */
    private MemberResponseDto mapToResponseDto(Member member) {
        // Hitung total parkings
        long totalParkings = parkingTicketRepository
                .findByPlateNumberContaining(member.getVehiclePlateNumber(), Pageable.unpaged())
                .getTotalElements();

        return MemberResponseDto.builder()
                .id(member.getId())
                .memberCode(member.getMemberCode())
                .name(member.getName())
                .vehiclePlateNumber(member.getVehiclePlateNumber())
                .email(member.getEmail())
                .phoneNumber(member.getPhoneNumber())
                .balance(member.getBalance())
                .active(member.getActive())
                .registeredAt(member.getRegisteredAt())
                .lastActivity(member.getLastActivity())
                .totalParkings((int) totalParkings)
                .build();
    }
}