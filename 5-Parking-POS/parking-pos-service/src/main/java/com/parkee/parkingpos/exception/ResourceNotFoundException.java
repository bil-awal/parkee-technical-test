package com.parkee.parkingpos.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception ketika resource tidak ditemukan
 */
public class ResourceNotFoundException extends BaseException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }
}