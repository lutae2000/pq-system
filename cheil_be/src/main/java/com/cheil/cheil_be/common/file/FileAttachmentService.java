package com.cheil.cheil_be.common.file;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.file.FileAttachmentRequest;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class FileAttachmentService {

    private final AppFileAttachmentJpaRepository attachmentRepository;

    @Transactional(readOnly = true)
    public List<AppFileAttachmentEntity> findAll(String ownerType, String ownerId) {
        requireReadAccess(ownerType);
        return attachmentRepository.findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(
                StringValues.required(ownerType, "ownerType"),
                StringValues.required(ownerId, "ownerId")
        );
    }

    @Transactional
    public AppFileAttachmentEntity add(FileAttachmentRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부파일 요청이 필요합니다.");
        }

        String ownerType = StringValues.required(request.ownerType(), "ownerType");
        requireWriteAccess(ownerType);

        AppFileAttachmentEntity attachment = attachmentRepository.findByFileId(StringValues.required(request.fileId(), "fileId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."));
        attachment.attachTo(
                ownerType,
                StringValues.required(request.ownerId(), "ownerId"),
                StringValues.required(request.attachmentType(), "attachmentType")
        );
        return attachment;
    }

    @Transactional
    public void delete(Long attachmentId) {
        if (attachmentId == null || attachmentId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "attachmentId가 필요합니다.");
        }
        AppFileAttachmentEntity attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다."));
        requireDeleteAccess(attachment.getOwnerType());
        attachmentRepository.delete(attachment);
    }

    @Transactional
    public void deleteAll(String ownerType, String ownerId) {
        List<AppFileAttachmentEntity> attachments = findAll(ownerType, ownerId);
        if (attachments.isEmpty()) {
            return;
        }
        attachmentRepository.deleteAllInBatch(attachments);
    }

    private void requireReadAccess(String ownerType) {
    }

    private void requireWriteAccess(String ownerType) {
    }

    private void requireDeleteAccess(String ownerType) {
    }
}
