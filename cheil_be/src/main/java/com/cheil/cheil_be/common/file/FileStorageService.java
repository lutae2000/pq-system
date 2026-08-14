package com.cheil.cheil_be.common.file;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.config.file.AppFileProperties;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM");
    private static final int MAX_STORED_FILENAME_LENGTH = 300;

    private final AppFileProperties appFileProperties;
    private final AppFileAttachmentJpaRepository attachmentRepository;

    @PostConstruct
    void initialize() throws IOException {
        if (appFileProperties.createDirectories()) {
            Files.createDirectories(appFileProperties.storageRoot());
        }
    }

    public FileStorageResult upload(MultipartFile file) {
        return upload(file, null, null, null);
    }

    public FileStorageResult upload(MultipartFile file, String ownerType, String ownerId, String attachmentType) {
        requireUploadAccess(ownerType);
        validateUpload(file, appFileProperties);

        String fileId = UUID.randomUUID().toString();
        String originalFilename = sanitizeFilename(file.getOriginalFilename(), fileId);
        String storedPath = YEAR_MONTH_FORMAT.format(YearMonth.now());
        String storedFilename = buildStoredFilename(originalFilename, fileId);
        String contentType = resolveContentType(file.getContentType());
        String downloadUrl = buildDownloadUrl(fileId);
        Path targetDirectory = appFileProperties.storageRoot().resolve(storedPath);
        Path contentPath = targetDirectory.resolve(storedFilename);

        try (InputStream inputStream = file.getInputStream()) {
            Files.createDirectories(targetDirectory);
            long copiedBytes = Files.copy(inputStream, contentPath, StandardCopyOption.REPLACE_EXISTING);
            if (copiedBytes != file.getSize()) {
                Files.deleteIfExists(contentPath);
                throw new IOException("Uploaded file size mismatch. expected=" + file.getSize() + ", copied=" + copiedBytes);
            }
            AppFileAttachmentEntity attachment = AppFileAttachmentEntity.createUpload(
                    fileId,
                    originalFilename,
                    storedPath,
                    storedFilename,
                    contentType,
                    file.getSize(),
                    downloadUrl
            );
            attachment.attachTo(
                    StringUtils.hasText(ownerType) ? ownerType : "UNASSIGNED",
                    StringUtils.hasText(ownerId) ? ownerId : fileId,
                    StringUtils.hasText(attachmentType) ? attachmentType : "UPLOAD"
            );
            attachmentRepository.save(attachment);
        } catch (IOException exception) {
            throw new IllegalStateException("파일 저장에 실패했습니다.", exception);
        }

        return new FileStorageResult(fileId, originalFilename, contentType, file.getSize(), downloadUrl);
    }

    public FileDownloadResult download(String fileId) {
        AppFileAttachmentEntity metadata = attachmentRepository.findByFileId(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."));
        requireDownloadAccess(metadata.getOwnerType());

        Path contentPath = appFileProperties.storageRoot().resolve(metadata.getStoredPath()).resolve(metadata.getStoredFilename());
        if (!Files.exists(contentPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }

        try {
            long actualSize = Files.size(contentPath);
            if (actualSize <= 0 || actualSize != metadata.getFileSize()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "저장된 파일이 손상되었거나 메타데이터와 일치하지 않습니다.");
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.", exception);
        }

        Resource resource = new FileSystemResource(contentPath);
        return new FileDownloadResult(
                metadata.getFileId(),
                resource,
                metadata.getOriginalFilename(),
                resolveMediaType(metadata.getContentType()),
                metadata.getFileSize()
        );
    }

    private void requireUploadAccess(String ownerType) {
    }

    private void requireDownloadAccess(String ownerType) {
    }

    private String buildDownloadUrl(String fileId) {
        String downloadPath = appFileProperties.normalizedDownloadPath();
        if (StringUtils.hasText(appFileProperties.publicBaseUrl())) {
            return trimTrailingSlash(appFileProperties.publicBaseUrl()) + downloadPath + "/" + fileId;
        }
        return downloadPath + "/" + fileId;
    }

    private static String trimTrailingSlash(String value) {
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }

    private static void validateUpload(MultipartFile file, AppFileProperties properties) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드할 파일이 필요합니다.");
        }
        if (file.getSize() > properties.maxSize().toBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 크기가 허용 용량을 초과했습니다.");
        }

        String filename = sanitizeFilename(file.getOriginalFilename(), "");
        if (!StringUtils.hasText(filename)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일명이 필요합니다.");
        }
        if (filename.length() > properties.maxFilenameLength()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일명이 너무 깁니다.");
        }

        Set<String> blockedExtensions = normalizeExtensions(properties.blockedExtensions());
        if (extensionsOf(filename).stream().anyMatch(blockedExtensions::contains)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드가 제한된 파일 형식입니다.");
        }

        Set<String> allowedExtensions = normalizeExtensions(properties.allowedExtensions());
        if (!allowedExtensions.isEmpty() && !allowedExtensions.contains(finalExtensionOf(filename))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "허용되지 않은 파일 형식입니다.");
        }
    }

    private static String sanitizeFilename(String originalFilename, String fallback) {
        if (!StringUtils.hasText(originalFilename)) {
            return fallback;
        }
        String cleaned = originalFilename
                .replace("\\", "/")
                .replaceAll("[\\p{Cntrl}]", "")
                .trim();
        int lastSlash = cleaned.lastIndexOf('/');
        return lastSlash >= 0 ? cleaned.substring(lastSlash + 1) : cleaned;
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return ".bin";
        }
        return filename.substring(dot);
    }

    private static String buildStoredFilename(String originalFilename, String fileId) {
        String extension = extensionOf(originalFilename);
        String baseName = baseNameOf(originalFilename);
        String safeBaseName = baseName
                .replaceAll("[\\\\/:*?\"<>|]", "_")
                .replaceAll("\\s+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_+|_+$", "");
        if (!StringUtils.hasText(safeBaseName)) {
            safeBaseName = "file";
        }

        String suffix = "__" + fileId + extension;
        int maxBaseLength = Math.max(1, MAX_STORED_FILENAME_LENGTH - suffix.length());
        if (safeBaseName.length() > maxBaseLength) {
            safeBaseName = safeBaseName.substring(0, maxBaseLength);
        }
        return safeBaseName + suffix;
    }

    private static String baseNameOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot <= 0) {
            return filename;
        }
        return filename.substring(0, dot);
    }

    private static String finalExtensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }
        return normalizeExtension(filename.substring(dot + 1));
    }

    private static Set<String> extensionsOf(String filename) {
        String[] parts = filename.split("\\.");
        if (parts.length <= 1) {
            return Set.of();
        }
        return Arrays.stream(parts)
                .skip(1)
                .map(FileStorageService::normalizeExtension)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
    }

    private static Set<String> normalizeExtensions(Iterable<String> extensions) {
        Set<String> normalized = new HashSet<>();
        for (String extension : extensions) {
            String value = normalizeExtension(extension);
            if (StringUtils.hasText(value)) {
                normalized.add(value);
            }
        }
        return normalized;
    }

    private static String normalizeExtension(String extension) {
        if (extension == null) {
            return "";
        }
        return extension.trim().replaceFirst("^\\.+", "").toLowerCase(Locale.ROOT);
    }

    private static String resolveContentType(String contentType) {
        return StringUtils.hasText(contentType) ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }

    private static MediaType resolveMediaType(String contentType) {
        try {
            return StringUtils.hasText(contentType) ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        } catch (IllegalArgumentException exception) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
