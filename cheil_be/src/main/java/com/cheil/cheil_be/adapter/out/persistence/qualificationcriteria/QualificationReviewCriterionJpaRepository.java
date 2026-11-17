package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QualificationReviewCriterionJpaRepository extends JpaRepository<QualificationReviewCriterionEntity, Long> {

    boolean existsByAgencyIdAndRuleCodeAndRevisionNo(Long agencyId, String ruleCode, String revisionNo);

    boolean existsByAgencyIdAndRuleCodeAndRevisionNoAndIdNot(Long agencyId, String ruleCode, String revisionNo, Long id);

    @Query("""
            select c from QualificationReviewCriterionEntity c
            where c.agencyId = :agencyId
              and (:useYn is null or c.useYn = :useYn)
              and (:keyword is null or locate(:keyword, lower(c.ruleCode)) > 0
                   or locate(:keyword, lower(c.revisionNo)) > 0
                   or locate(:keyword, lower(coalesce(c.effectiveDate, ''))) > 0
                   or locate(:keyword, lower(coalesce(c.legalBasis, ''))) > 0
                   or locate(:keyword, lower(coalesce(c.decisionMethod, ''))) > 0)
            order by c.ruleCode asc, c.revisionNo asc
            """)
    List<QualificationReviewCriterionEntity> search(
            @Param("agencyId") Long agencyId, @Param("keyword") String keyword, @Param("useYn") Boolean useYn);
}
