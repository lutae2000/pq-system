package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyAttachmentJpaRepository extends JpaRepository<CompanyAttachmentEntity, Long> {

    List<CompanyAttachmentEntity> findByProfileIdOrderByCreatedAtDesc(Long profileId);
}
