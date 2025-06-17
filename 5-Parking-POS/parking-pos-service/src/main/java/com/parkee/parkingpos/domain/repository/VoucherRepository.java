package com.parkee.parkingpos.domain.repository;

import com.parkee.parkingpos.domain.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    Optional<Voucher> findByCodeAndActiveTrue(String code);

    boolean existsByCode(String code);

    Page<Voucher> findByActiveTrue(Pageable pageable);

    @Query("SELECT v FROM Voucher v WHERE v.active = true AND " +
            "v.validFrom <= :now AND v.validUntil >= :now")
    Page<Voucher> findActiveAndValid(LocalDateTime now, Pageable pageable);
}