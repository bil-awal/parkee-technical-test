package com.parkee.parkingpos.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;

/**
 * Controller untuk serving foto parking
 * Menangani request GET untuk foto check-in dan check-out
 *
 * @author Parkee Development Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/parking/photos")
@RequiredArgsConstructor
@Tag(name = "Photo Management", description = "API untuk mengelola dan mengakses foto kendaraan check-in/check-out")
public class PhotoController {

    @Value("${file-upload.base-path}")
    private String basePath; // ./uploads

    private final ResourceLoader resourceLoader;

    /**
     * Serve photo file dengan struktur path yang terorganisir
     * Mendukung caching untuk performa optimal
     */
    @GetMapping("/{type}/{year}/{month}/{day}/{filename:.+}")
    @Operation(
            summary = "Ambil foto kendaraan",
            description = "Mengambil file foto kendaraan berdasarkan tipe (checkin/checkout), tanggal, dan nama file. " +
                    "Foto disimpan dalam struktur direktori terorganisir berdasarkan tanggal untuk kemudahan pengelolaan. " +
                    "Response dilengkapi dengan cache headers untuk optimasi performa."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Foto berhasil ditemukan dan dikembalikan",
                    content = @Content(
                            mediaType = "image/jpeg",
                            schema = @Schema(type = "string", format = "binary"),
                            examples = @ExampleObject(
                                    description = "File foto dalam format binary dengan Content-Type yang sesuai (image/jpeg, image/png, dll)"
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Parameter tidak valid - tipe foto tidak dikenali",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Bad Request",
                                              "message": "Invalid photo type. Allowed types: checkin, checkout",
                                              "status": 400
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "File tidak dapat diakses atau tidak memiliki permission",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Forbidden",
                                              "message": "File is not readable or access denied",
                                              "status": 403
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Foto tidak ditemukan di lokasi yang ditentukan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Not Found",
                                              "message": "Photo file not found at specified location",
                                              "status": 404
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Internal server error saat mengakses file",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Internal Server Error", 
                                              "message": "Error occurred while serving photo file",
                                              "status": 500
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<Resource> getPhoto(
            @Parameter(
                    description = "Tipe foto kendaraan",
                    example = "checkin",
                    schema = @Schema(allowableValues = {"checkin", "checkout"})
            )
            @PathVariable String type,

            @Parameter(
                    description = "Tahun foto diambil (format: YYYY)",
                    example = "2025"
            )
            @PathVariable String year,

            @Parameter(
                    description = "Bulan foto diambil (format: MM)",
                    example = "01"
            )
            @PathVariable String month,

            @Parameter(
                    description = "Tanggal foto diambil (format: DD)",
                    example = "16"
            )
            @PathVariable String day,

            @Parameter(
                    description = "Nama file foto dengan ekstensi",
                    example = "checkin_1705456789123.jpg"
            )
            @PathVariable String filename) {

        try {
            // Validate type
            if (!isValidPhotoType(type)) {
                log.warn("Invalid photo type requested: {}", type);
                return ResponseEntity.badRequest().build();
            }

            // Build file path
            Path filePath = Paths.get(basePath, type, year, month, day, filename);

            log.debug("Attempting to serve photo: {}", filePath.toString());

            // Check if file exists
            if (!Files.exists(filePath)) {
                log.warn("Photo file not found: {}", filePath.toString());
                return ResponseEntity.notFound().build();
            }

            // Check if it's a file and readable
            if (!Files.isRegularFile(filePath) || !Files.isReadable(filePath)) {
                log.warn("Photo file is not readable: {}", filePath.toString());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Load resource
            Resource resource = resourceLoader.getResource("file:" + filePath.toString());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Resource not accessible: {}", filePath.toString());
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = determineContentType(filename);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl("max-age=3600"); // Cache for 1 hour
            headers.set("Content-Disposition", "inline; filename=\"" + filename + "\"");

            log.info("Successfully serving photo: {}", filePath.toString());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving photo: {}/{}/{}/{}/{}", type, year, month, day, filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Alternative endpoint untuk backward compatibility
     * Mendukung path foto dengan format bebas
     */
    @GetMapping("/**")
    @Operation(
            summary = "Ambil foto dengan path dinamis",
            description = "Endpoint alternatif untuk mengakses foto dengan path yang fleksibel. " +
                    "Mendukung backward compatibility untuk aplikasi yang menggunakan struktur path lama. " +
                    "Dilengkapi dengan security check untuk mencegah path traversal attack."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Foto berhasil ditemukan dan dikembalikan",
                    content = @Content(
                            mediaType = "image/jpeg",
                            schema = @Schema(type = "string", format = "binary")
                    )
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Security violation - path traversal attempt detected",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Forbidden",
                                              "message": "Security violation - path traversal attempt detected",
                                              "status": 403
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Foto tidak ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Not Found",
                                              "message": "Photo file not found",
                                              "status": 404
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Internal server error",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Internal Server Error",
                                              "message": "Error occurred while processing photo request",
                                              "status": 500
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<Resource> getPhotoByPath(
            @Parameter(hidden = true) HttpServletRequest request) {

        String photoPath = request.getRequestURI().substring("/api/parking/photos/".length());

        try {
            // Build full file path
            Path filePath = Paths.get(basePath, photoPath);

            log.debug("Attempting to serve photo by path: {}", filePath.toString());

            // Security check - ensure file is within base path
            if (!filePath.normalize().startsWith(Paths.get(basePath).normalize())) {
                log.warn("Security violation - path traversal attempt: {}", photoPath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Check if file exists
            if (!Files.exists(filePath)) {
                log.warn("Photo file not found: {}", filePath.toString());
                return ResponseEntity.notFound().build();
            }

            // Load resource
            Resource resource = resourceLoader.getResource("file:" + filePath.toString());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String filename = filePath.getFileName().toString();
            String contentType = determineContentType(filename);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl("max-age=3600"); // Cache for 1 hour

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving photo by path: {}", photoPath, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get photo info/metadata tanpa download file
     * Berguna untuk preview dan validasi
     */
    @GetMapping("/info/{type}/{year}/{month}/{day}/{filename:.+}")
    @Operation(
            summary = "Informasi metadata foto",
            description = "Mendapatkan informasi metadata foto tanpa mendownload file. " +
                    "Berguna untuk preview, validasi keberadaan file, dan mendapatkan informasi teknis foto " +
                    "seperti ukuran file, tanggal modifikasi, dan URL akses."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Informasi foto berhasil ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = PhotoInfoDto.class),
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "filename": "checkin_1705456789123.jpg",
                                              "type": "checkin",
                                              "size": 245760,
                                              "lastModified": "2025-01-16T10:30:15.123Z",
                                              "contentType": "image/jpeg",
                                              "url": "/api/parking/photos/checkin/2025/01/16/checkin_1705456789123.jpg"
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Tipe foto tidak valid",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Bad Request",
                                              "message": "Invalid photo type. Allowed types: checkin, checkout",
                                              "status": 400
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Foto tidak ditemukan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Not Found",
                                              "message": "Photo file not found at specified location",
                                              "status": 404
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Error saat mengakses informasi file",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = """
                                            {
                                              "error": "Internal Server Error",
                                              "message": "Error occurred while retrieving photo information",
                                              "status": 500
                                            }
                                            """
                            )
                    )
            )
    })
    public ResponseEntity<PhotoInfoDto> getPhotoInfo(
            @Parameter(
                    description = "Tipe foto kendaraan",
                    example = "checkin",
                    schema = @Schema(allowableValues = {"checkin", "checkout"})
            )
            @PathVariable String type,

            @Parameter(
                    description = "Tahun foto diambil (format: YYYY)",
                    example = "2025"
            )
            @PathVariable String year,

            @Parameter(
                    description = "Bulan foto diambil (format: MM)",
                    example = "01"
            )
            @PathVariable String month,

            @Parameter(
                    description = "Tanggal foto diambil (format: DD)",
                    example = "16"
            )
            @PathVariable String day,

            @Parameter(
                    description = "Nama file foto dengan ekstensi",
                    example = "checkin_1705456789123.jpg"
            )
            @PathVariable String filename) {

        try {
            if (!isValidPhotoType(type)) {
                return ResponseEntity.badRequest().build();
            }

            Path filePath = Paths.get(basePath, type, year, month, day, filename);

            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            PhotoInfoDto info = PhotoInfoDto.builder()
                    .filename(filename)
                    .type(type)
                    .size(Files.size(filePath))
                    .lastModified(Files.getLastModifiedTime(filePath).toInstant())
                    .contentType(determineContentType(filename))
                    .url(buildPhotoUrl(type, year, month, day, filename))
                    .build();

            return ResponseEntity.ok(info);

        } catch (IOException e) {
            log.error("Error getting photo info", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validate photo type
     */
    private boolean isValidPhotoType(String type) {
        return "checkin".equals(type) || "checkout".equals(type);
    }

    /**
     * Determine content type based on file extension
     */
    private String determineContentType(String filename) {
        String extension = getFileExtension(filename).toLowerCase();

        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "bmp" -> "image/bmp";
            default -> "application/octet-stream";
        };
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return (lastDotIndex == -1) ? "" : filename.substring(lastDotIndex + 1);
    }

    /**
     * Build photo URL
     */
    private String buildPhotoUrl(String type, String year, String month, String day, String filename) {
        return String.format("/api/parking/photos/%s/%s/%s/%s/%s", type, year, month, day, filename);
    }

    /**
     * DTO for photo info response
     */
    @lombok.Data
    @lombok.Builder
    @Schema(description = "Informasi metadata foto kendaraan")
    public static class PhotoInfoDto {

        @Schema(description = "Nama file foto", example = "checkin_1705456789123.jpg")
        private String filename;

        @Schema(description = "Tipe foto", example = "checkin", allowableValues = {"checkin", "checkout"})
        private String type;

        @Schema(description = "Ukuran file dalam bytes", example = "245760")
        private long size;

        @Schema(description = "Timestamp terakhir file dimodifikasi", example = "2025-01-16T10:30:15.123Z")
        private Instant lastModified;

        @Schema(description = "MIME type file", example = "image/jpeg")
        private String contentType;

        @Schema(description = "URL untuk mengakses foto", example = "/api/parking/photos/checkin/2025/01/16/checkin_1705456789123.jpg")
        private String url;
    }
}