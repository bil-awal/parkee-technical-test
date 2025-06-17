package com.parkee.parkingpos.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Utility class untuk handle file upload
 * Menangani upload foto check-in dan check-out
 */
@Slf4j
@Component
public class FileUploadUtil {

    @Value("${file-upload.base-path}")
    private String basePath;

    @Value("${file-upload.allowed-extensions}")
    private String allowedExtensions;

    @Value("${file-upload.max-file-size:10485760}") // 10MB default
    private long maxFileSize;

    private static final List<String> DEFAULT_ALLOWED_EXTENSIONS =
            Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "bmp");

    /**
     * Upload file dan return path
     *
     * @param file MultipartFile to upload
     * @param type "checkin" atau "checkout"
     * @return relative path of uploaded file
     */
    public String uploadFile(MultipartFile file, String type) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File tidak boleh kosong");
        }

        try {
            // Validate file
            validateFile(file);

            // Generate filename
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String newFilename = generateUniqueFilename(type, extension);

            // Create directory structure: basePath/type/yyyy/MM/dd
            LocalDate now = LocalDate.now();
            String yearMonth = now.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            Path uploadDir = Paths.get(basePath, type, yearMonth);

            // Create directories if not exist
            createDirectoryIfNotExists(uploadDir);

            // Save file
            Path filePath = uploadDir.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path
            String relativePath = String.format("%s/%s/%s", type, yearMonth, newFilename);

            log.info("File uploaded successfully: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            log.error("Error uploading file", e);
            throw new RuntimeException("Gagal upload file: " + e.getMessage());
        }
    }

    /**
     * Delete file
     */
    public boolean deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return false;
        }

        try {
            Path filePath = Paths.get(basePath, relativePath);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted: {}", relativePath);
                return true;
            } else {
                log.warn("File not found for deletion: {}", relativePath);
                return false;
            }
        } catch (IOException e) {
            log.error("Error deleting file: {}", relativePath, e);
            return false;
        }
    }

    /**
     * Check if file exists
     */
    public boolean fileExists(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return false;
        }

        Path filePath = Paths.get(basePath, relativePath);
        return Files.exists(filePath);
    }

    /**
     * Get file size
     */
    public long getFileSize(String relativePath) {
        if (!fileExists(relativePath)) {
            return -1;
        }

        try {
            Path filePath = Paths.get(basePath, relativePath);
            return Files.size(filePath);
        } catch (IOException e) {
            log.error("Error getting file size: {}", relativePath, e);
            return -1;
        }
    }

    /**
     * Move file (untuk rename atau reorganisasi)
     */
    public String moveFile(String oldPath, String newPath) {
        try {
            Path oldFilePath = Paths.get(basePath, oldPath);
            Path newFilePath = Paths.get(basePath, newPath);

            // Create parent directories if needed
            createDirectoryIfNotExists(newFilePath.getParent());

            Files.move(oldFilePath, newFilePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File moved from {} to {}", oldPath, newPath);
            return newPath;

        } catch (IOException e) {
            log.error("Error moving file from {} to {}", oldPath, newPath, e);
            throw new RuntimeException("Gagal memindahkan file: " + e.getMessage());
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validate file
     */
    private void validateFile(MultipartFile file) {
        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    String.format("Ukuran file terlalu besar. Maksimal: %d bytes", maxFileSize));
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Nama file tidak valid");
        }

        String extension = getFileExtension(originalFilename);
        if (!isAllowedExtension(extension)) {
            throw new IllegalArgumentException(
                    String.format("Ekstensi file '%s' tidak diperbolehkan. Ekstensi yang diperbolehkan: %s",
                            extension, getAllowedExtensionsList()));
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File harus berupa gambar");
        }
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }

        int lastDotIndex = filename.lastIndexOf('.');
        return (lastDotIndex == -1) ? "" : filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * Check if extension is allowed
     */
    private boolean isAllowedExtension(String extension) {
        List<String> allowed = getAllowedExtensionsList();
        return allowed.contains(extension.toLowerCase());
    }

    /**
     * Get allowed extensions list
     */
    private List<String> getAllowedExtensionsList() {
        if (allowedExtensions != null && !allowedExtensions.isEmpty()) {
            return Arrays.asList(allowedExtensions.toLowerCase().split(","));
        }
        return DEFAULT_ALLOWED_EXTENSIONS;
    }

    /**
     * Generate unique filename
     */
    private String generateUniqueFilename(String type, String extension) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("%s_%s_%s.%s", type, timestamp, uuid, extension);
    }

    /**
     * Create directory if not exists
     */
    private void createDirectoryIfNotExists(Path directory) throws IOException {
        if (directory != null && !Files.exists(directory)) {
            Files.createDirectories(directory);
            log.debug("Created directory: {}", directory);
        }
    }

    /**
     * Get full file path
     */
    public Path getFullPath(String relativePath) {
        return Paths.get(basePath, relativePath);
    }

    /**
     * Clean old files (untuk maintenance)
     */
    public void cleanOldFiles(int daysOld) {
        // Implementation untuk cleanup file lama
        // Bisa dijadwalkan dengan @Scheduled
        log.info("Cleaning files older than {} days", daysOld);
        // TODO: Implement cleanup logic
    }
}