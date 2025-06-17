package com.parkee.parkingpos.service;

import com.parkee.parkingpos.domain.entity.*;
import com.parkee.parkingpos.domain.repository.InvoiceReceiptRepository;
import com.parkee.parkingpos.dto.InvoiceReceiptDto;
import com.parkee.parkingpos.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Service untuk mengelola invoice/struk pembayaran
 * Generate dan retrieve invoice
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceReceiptService {

    private final InvoiceReceiptRepository invoiceReceiptRepository;
    private static final DateTimeFormatter INVOICE_NUMBER_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Generate invoice untuk transaksi parkir
     */
    public InvoiceReceiptDto generateInvoice(ParkingTicket ticket, Payment payment) {
        log.info("Generate invoice untuk ticket ID: {}", ticket.getId());

        // Calculate duration
        long durationMinutes = ChronoUnit.MINUTES.between(
                ticket.getCheckInTime(), ticket.getCheckOutTime());

        // Create invoice
        InvoiceReceipt invoice = InvoiceReceipt.builder()
                .invoiceNumber(generateInvoiceNumber())
                .parkingTicket(ticket)
                .invoiceDate(LocalDateTime.now())
                .plateNumber(ticket.getPlateNumber())
                .checkInTime(ticket.getCheckInTime())
                .checkOutTime(ticket.getCheckOutTime())
                .durationMinutes(durationMinutes)
                .baseAmount(payment.getAmount())
                .discountAmount(BigDecimal.ZERO) // TODO: Calculate from voucher/member
                .totalAmount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().getDisplayName())
                .paymentReference(payment.getReferenceNumber())
                .memberName(ticket.getMemberName())
                .operatorName(ticket.getCheckOutOperator())
                .status(InvoiceReceipt.Status.PAID)
                .build();

        InvoiceReceipt savedInvoice = invoiceReceiptRepository.save(invoice);
        log.info("Invoice {} berhasil dibuat", savedInvoice.getInvoiceNumber());

        return mapToDto(savedInvoice, ticket);
    }

    /**
     * Find invoice by number
     */
    public InvoiceReceiptDto findByInvoiceNumber(String invoiceNumber) {
        log.info("Cari invoice: {}", invoiceNumber);

        InvoiceReceipt invoice = invoiceReceiptRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice tidak ditemukan: " + invoiceNumber));

        return mapToDto(invoice, invoice.getParkingTicket());
    }

    /**
     * Generate unique invoice number
     */
    private String generateInvoiceNumber() {
        String prefix = "INV-" + LocalDate.now().format(INVOICE_NUMBER_FORMAT);

        // Get today's count
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        long todayCount = invoiceReceiptRepository
                .findByInvoiceDateBetween(startOfDay, endOfDay, Pageable.unpaged())
                .getTotalElements();

        return String.format("%s%04d", prefix, todayCount + 1);
    }

    /**
     * Map to DTO
     */
    private InvoiceReceiptDto mapToDto(InvoiceReceipt invoice, ParkingTicket ticket) {
        long hours = invoice.getDurationMinutes() / 60;
        long minutes = invoice.getDurationMinutes() % 60;
        String duration = String.format("%d jam %d menit", hours, minutes);

        return InvoiceReceiptDto.builder()
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .plateNumber(invoice.getPlateNumber())
                .checkInTime(invoice.getCheckInTime())
                .checkOutTime(invoice.getCheckOutTime())
                .duration(duration)
                .baseAmount(invoice.getBaseAmount())
                .discountAmount(invoice.getDiscountAmount())
                .totalAmount(invoice.getTotalAmount())
                .paymentMethod(invoice.getPaymentMethod())
                .paymentReference(invoice.getPaymentReference())
                .memberName(invoice.getMemberName())
                .voucherCode(invoice.getVoucherCode())
                .operatorName(invoice.getOperatorName())
                .checkInGate(ticket.getCheckInGate())
                .checkOutGate(ticket.getCheckOutGate())
                .build();
    }
}