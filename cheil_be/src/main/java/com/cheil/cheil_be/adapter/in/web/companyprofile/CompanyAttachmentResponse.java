package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

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

    public static CompanyAttachmentResponse from(CompanyProfileUseCase.Attachment entity) {
        return new CompanyAttachmentResponse(
                entity.attachmentId(), entity.attachmentType(), entity.title(), entity.fiscalYear(),
                entity.issuedOn(), entity.validUntil(), entity.fileId(), entity.originalFilename(),
                entity.contentType(), entity.fileSize(), entity.downloadUrl(), entity.note(),
                entity.createdAt(), entity.createdId()
        );
    }
}
