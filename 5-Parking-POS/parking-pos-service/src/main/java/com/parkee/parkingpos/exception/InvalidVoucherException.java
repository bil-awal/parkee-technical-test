package com.parkee.parkingpos.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception untuk voucher tidak valid
 */
public class InvalidVoucherException extends BaseException {
    public InvalidVoucherException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INVALID_VOUCHER");
    }
}
