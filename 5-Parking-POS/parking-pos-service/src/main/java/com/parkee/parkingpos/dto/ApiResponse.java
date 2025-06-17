package com.parkee.parkingpos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard response wrapper untuk semua API response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standard API response wrapper")
public class ApiResponse<T> {

    @Schema(
            description = "Indicates if the request was successful",
            example = "true",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private boolean success;

    @Schema(
            description = "Response message",
            example = "Operation completed successfully",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String message;

    @Schema(
            description = "Error code if the request failed",
            example = "ERR_001"
    )
    private String errorCode;

    @Schema(
            description = "Response data payload"
    )
    private T data;

    @Schema(
            description = "Timestamp of the response",
            example = "2025-01-16T10:30:00",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Missing method that controller needs
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode("GENERAL_ERROR")
                .timestamp(LocalDateTime.now())
                .build();
    }
}