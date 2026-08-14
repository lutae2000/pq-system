package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.LocalDate;

public record CompanyAttachmentRequest(
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
        String note
) {
}
