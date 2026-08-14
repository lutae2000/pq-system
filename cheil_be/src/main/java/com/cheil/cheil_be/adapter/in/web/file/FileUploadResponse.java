package com.cheil.cheil_be.adapter.in.web.file;

import com.cheil.cheil_be.common.file.FileStorageResult;

public record FileUploadResponse(
        String fileId,
        String originalFilename,
        String contentType,
        long size,
        String downloadUrl
) {

    static FileUploadResponse from(FileStorageResult result) {
        return new FileUploadResponse(
                result.fileId(),
                result.originalFilename(),
                result.contentType(),
                result.size(),
                result.downloadUrl()
        );
    }
}
