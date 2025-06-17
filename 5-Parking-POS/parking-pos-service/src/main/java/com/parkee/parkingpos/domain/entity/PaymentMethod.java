package com.parkee.parkingpos.domain.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Enum untuk metode pembayaran yang tersedia di Indonesia
 */
@Getter
@RequiredArgsConstructor
public enum PaymentMethod {
    // E-Money
    QRIS("QRIS", "E-Money", "/icons/qris.png", true),
    GOPAY("GoPay", "E-Money", "/icons/gopay.png", true),
    OVO("OVO", "E-Money", "/icons/ovo.png", true),
    DANA("DANA", "E-Money", "/icons/dana.png", true),
    SHOPEEPAY("ShopeePay", "E-Money", "/icons/shopeepay.png", true),
    LINKAJA("LinkAja", "E-Money", "/icons/linkaja.png", true),

    // Kartu E-Toll
    EMONEY("e-Money Mandiri", "E-Toll", "/icons/emoney.png", true),
    FLAZZ("Flazz BCA", "E-Toll", "/icons/flazz.png", true),
    BRIZZI("Brizzi BRI", "E-Toll", "/icons/brizzi.png", true),
    TAPCASH("TapCash BNI", "E-Toll", "/icons/tapcash.png", true),

    // Lainnya
    CASH("Tunai", "Cash", "/icons/cash.png", true),
    DEBIT_CARD("Kartu Debit", "Card", "/icons/debit.png", true),
    CREDIT_CARD("Kartu Kredit", "Card", "/icons/credit.png", true),
    MEMBER_BALANCE("Saldo Member", "Member", "/icons/member.png", true);

    private final String displayName;
    private final String type;
    private final String iconUrl;
    private final boolean active;
}