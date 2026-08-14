package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QualificationReviewCriterionJpaRepository extends JpaRepository<QualificationReviewCriterionEntity, Long> {

    boolean existsByAgencyIdAndRuleCodeAndRevisionNo(Long agencyId, String ruleCode, String revisionNo);

    boolean existsByAgencyIdAndRuleCodeAndRevisionNoAndIdNot(Long agencyId, String ruleCode, String revisionNo, Long id);

    List<QualificationReviewCriterionEntity> findByAgencyIdOrderByRuleCodeAscRevisionNoAsc(Long agencyId);
}
