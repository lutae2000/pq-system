package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QualificationReviewAgencyJpaRepository extends JpaRepository<QualificationReviewAgencyEntity, Long> {

    boolean existsByAgencyCode(String agencyCode);

    boolean existsByAgencyCodeAndIdNot(String agencyCode, Long id);

    List<QualificationReviewAgencyEntity> findByOrderByAgencyCodeAsc();
}
