package com.cheil.cheil_be.config.file;

import java.nio.file.Path;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.file")
public record AppFileProperties(
        Path storageRoot,
        String downloadPath,
        String publicBaseUrl,
        boolean createDirectories,
        DataSize maxSize,
        List<String> allowedExtensions,
        List<String> blockedExtensions,
        int maxFilenameLength
) {

    public AppFileProperties {
        storageRoot = storageRoot == null ? Path.of(System.getProperty("java.io.tmpdir"), "cheil-be", "files") : storageRoot;
        downloadPath = StringUtils.hasText(downloadPath) ? downloadPath : "/files";
        publicBaseUrl = StringUtils.hasText(publicBaseUrl) ? publicBaseUrl : null;
        maxSize = maxSize == null || maxSize.isNegative() ? DataSize.ofMegabytes(20) : maxSize;
        allowedExtensions = allowedExtensions == null ? List.of() : allowedExtensions;
        blockedExtensions = blockedExtensions == null ? List.of() : blockedExtensions;
        maxFilenameLength = maxFilenameLength > 0 ? maxFilenameLength : 255;
    }

    public String normalizedDownloadPath() {
        if (!downloadPath.startsWith("/")) {
            return "/" + downloadPath;
        }
        return downloadPath;
    }
}
