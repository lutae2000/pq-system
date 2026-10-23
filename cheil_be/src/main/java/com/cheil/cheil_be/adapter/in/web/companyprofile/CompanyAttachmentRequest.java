package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public record CompanyAttachmentRequest(
        @NotBlank String attachmentType,
        @NotBlank String title,
        Integer fiscalYear,
        LocalDate issuedOn,
        LocalDate validUntil,
        @NotBlank String fileId,
        @NotBlank String originalFilename,
        String contentType,
        Long fileSize,
        @NotBlank String downloadUrl,
        String note
) {
    public CompanyProfileUseCase.AttachmentCommand toCommand() {
        return new CompanyProfileUseCase.AttachmentCommand(
                attachmentType, title, fiscalYear, issuedOn, validUntil, fileId, originalFilename,
                contentType, fileSize, downloadUrl, note
        );
    }
}
