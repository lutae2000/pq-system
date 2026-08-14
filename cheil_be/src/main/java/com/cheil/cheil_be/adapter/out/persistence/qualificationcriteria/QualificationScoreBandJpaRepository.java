package com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QualificationScoreBandJpaRepository extends JpaRepository<QualificationScoreBandEntity, Long> {

    boolean existsByCriterionIdAndSortOrder(Long criterionId, Integer sortOrder);

    boolean existsByCriterionIdAndSortOrderAndIdNot(Long criterionId, Integer sortOrder, Long id);

    List<QualificationScoreBandEntity> findByCriterionIdOrderBySortOrderAsc(Long criterionId);
}
