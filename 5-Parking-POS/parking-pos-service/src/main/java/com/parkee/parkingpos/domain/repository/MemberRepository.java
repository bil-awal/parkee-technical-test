package com.parkee.parkingpos.domain.repository;

import com.parkee.parkingpos.domain.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByVehiclePlateNumber(String plateNumber);

    Optional<Member> findByVehiclePlateNumberAndActiveTrue(String plateNumber);

    Optional<Member> findByMemberCode(String memberCode);

    boolean existsByVehiclePlateNumber(String plateNumber);

    boolean existsByEmail(String email);

    @Query("SELECT m FROM Member m WHERE m.active = true AND " +
            "(LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(m.vehiclePlateNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Member> searchActiveMembers(@Param("search") String search, Pageable pageable);

    Page<Member> findByActiveTrue(Pageable pageable);
}