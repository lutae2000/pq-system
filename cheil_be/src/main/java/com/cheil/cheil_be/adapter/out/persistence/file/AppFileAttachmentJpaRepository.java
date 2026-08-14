package com.cheil.cheil_be.adapter.out.persistence.file;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppFileAttachmentJpaRepository extends JpaRepository<AppFileAttachmentEntity, Long> {

    List<AppFileAttachmentEntity> findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(String ownerType, String ownerId);

    Optional<AppFileAttachmentEntity> findByFileId(String fileId);
}
