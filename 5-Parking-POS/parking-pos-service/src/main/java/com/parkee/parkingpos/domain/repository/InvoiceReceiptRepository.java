package com.parkee.parkingpos.domain.repository;

import com.parkee.parkingpos.domain.entity.InvoiceReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface InvoiceReceiptRepository extends JpaRepository<InvoiceReceipt, Long> {

    Optional<InvoiceReceipt> findByInvoiceNumber(String invoiceNumber);

    Page<InvoiceReceipt> findByInvoiceDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<InvoiceReceipt> findByPlateNumberContaining(String plateNumber, Pageable pageable);
}