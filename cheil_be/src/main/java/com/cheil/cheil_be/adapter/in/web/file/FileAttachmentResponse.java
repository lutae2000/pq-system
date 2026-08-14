package com.cheil.cheil_be.adapter.in.web.file;

import java.time.Instant;

import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;

public record FileAttachmentResponse(
        Long attachmentId,
        String ownerType,
        String ownerId,
        String attachmentType,
        String fileId,
        String originalFilename,
        String contentType,
        Long fileSize,
        String downloadUrl,
        Instant createdAt,
        String createdId
) {

    public static FileAttachmentResponse from(AppFileAttachmentEntity entity) {
        return new FileAttachmentResponse(
                entity.getAttachmentId(),
                entity.getOwnerType(),
                entity.getOwnerId(),
                entity.getAttachmentType(),
                entity.getFileId(),
                entity.getOriginalFilename(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getDownloadUrl(),
                entity.getCreatedAt(),
                entity.getCreatedId()
        );
    }
}
