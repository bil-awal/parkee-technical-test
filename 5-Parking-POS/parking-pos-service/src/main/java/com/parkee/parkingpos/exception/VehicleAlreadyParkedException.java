package com.parkee.parkingpos.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception ketika kendaraan sudah parkir
 */
public class VehicleAlreadyParkedException extends BaseException {
    public VehicleAlreadyParkedException(String message) {
        super(message, HttpStatus.CONFLICT, "VEHICLE_ALREADY_PARKED");
    }
}
