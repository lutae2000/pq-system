package com.cheil.cheil_be.adapter.in.web.file;

public record FileAttachmentRequest(
        String ownerType,
        String ownerId,
        String attachmentType,
        String fileId,
        String originalFilename,
        String contentType,
        Long fileSize,
        String downloadUrl,
        Integer displayOrder
) {
}
