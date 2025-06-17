
package com.parkee.parkingpos.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base exception untuk semua custom exception
 */
@Getter
public abstract class BaseException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    protected BaseException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
}