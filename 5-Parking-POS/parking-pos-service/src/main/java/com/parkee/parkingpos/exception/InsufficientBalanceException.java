package com.parkee.parkingpos.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception ketika saldo member tidak cukup
 */
public class InsufficientBalanceException extends BaseException {
    public InsufficientBalanceException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INSUFFICIENT_BALANCE");
    }
}