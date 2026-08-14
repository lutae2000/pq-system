package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "company_attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyAttachmentEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    private Long attachmentId;

    @Column(name = "profile_id", nullable = false)
    private Long profileId = 1L;

    @Column(name = "attachment_type", nullable = false)
    private String attachmentType;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "fiscal_year")
    private Integer fiscalYear;

    @Column(name = "issued_on")
    private LocalDate issuedOn;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "file_id", nullable = false)
    private String fileId;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "download_url", nullable = false)
    private String downloadUrl;

    @Column(name = "note")
    private String note;

    public static CompanyAttachmentEntity create(String attachmentType, String title, Integer fiscalYear, LocalDate issuedOn,
            LocalDate validUntil, String fileId, String originalFilename, String contentType, Long fileSize, String downloadUrl, String note) {
        CompanyAttachmentEntity entity = new CompanyAttachmentEntity();
        entity.profileId = 1L;
        entity.attachmentType = attachmentType;
        entity.title = title;
        entity.fiscalYear = fiscalYear;
        entity.issuedOn = issuedOn;
        entity.validUntil = validUntil;
        entity.fileId = fileId;
        entity.originalFilename = originalFilename;
        entity.contentType = contentType;
        entity.fileSize = fileSize;
        entity.downloadUrl = downloadUrl;
        entity.note = note;
        return entity;
    }
}
