package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.adapter.out.persistence.companyprofile.CompanyAttachmentEntity;

public record CompanyAttachmentResponse(
        Long attachmentId,
        String attachmentType,
        String title,
        Integer fiscalYear,
        LocalDate issuedOn,
        LocalDate validUntil,
        String fileId,
        String originalFilename,
        String contentType,
        Long fileSize,
        String downloadUrl,
        String note,
        Instant createdAt,
        String createdId
) {

    public static CompanyAttachmentResponse from(CompanyAttachmentEntity entity) {
        return new CompanyAttachmentResponse(
                entity.getAttachmentId(),
                entity.getAttachmentType(),
                entity.getTitle(),
                entity.getFiscalYear(),
                entity.getIssuedOn(),
                entity.getValidUntil(),
                entity.getFileId(),
                entity.getOriginalFilename(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getDownloadUrl(),
                entity.getNote(),
                entity.getCreatedAt(),
                entity.getCreatedId()
        );
    }
}
