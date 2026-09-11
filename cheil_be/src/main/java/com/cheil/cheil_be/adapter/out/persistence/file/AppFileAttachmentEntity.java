package com.cheil.cheil_be.adapter.out.persistence.file;

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
@Table(name = "app_file_attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppFileAttachmentEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    private Long attachmentId;

    @Column(name = "owner_type", length = 100)
    private String ownerType;

    @Column(name = "owner_id", length = 100)
    private String ownerId;

    @Column(name = "attachment_type", length = 50)
    private String attachmentType;

    @Column(name = "file_id", nullable = false, length = 100, unique = true)
    private String fileId;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_path", nullable = false)
    private String storedPath;

    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "download_url", nullable = false)
    private String downloadUrl;

    @Column(name = "display_order")
    private Integer displayOrder;

    public static AppFileAttachmentEntity createUpload(
            String fileId,
            String originalFilename,
            String storedPath,
            String storedFilename,
            String contentType,
            Long fileSize,
            String downloadUrl
    ) {
        AppFileAttachmentEntity entity = new AppFileAttachmentEntity();
        entity.fileId = fileId;
        entity.originalFilename = originalFilename;
        entity.storedPath = storedPath;
        entity.storedFilename = storedFilename;
        entity.contentType = contentType;
        entity.fileSize = fileSize;
        entity.downloadUrl = downloadUrl;
        return entity;
    }

    public void attachTo(String ownerType, String ownerId, String attachmentType) {
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.attachmentType = attachmentType;
    }

    public void changeDisplayOrder(Integer displayOrder) {
        if (displayOrder != null && (displayOrder < 1 || displayOrder > 99)) {
            throw new IllegalArgumentException("첨부파일 순번은 1부터 99까지 입력할 수 있습니다.");
        }
        this.displayOrder = displayOrder;
    }
}
