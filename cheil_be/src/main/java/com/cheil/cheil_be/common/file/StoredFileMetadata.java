package com.cheil.cheil_be.common.file;

import java.time.Instant;

public record StoredFileMetadata(
        String fileId,
        String originalFilename,
        String storedFilename,
        String contentType,
        long size,
        Instant createdAt
) {
}
