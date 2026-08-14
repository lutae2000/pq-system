package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

import java.math.BigDecimal;

import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationReviewCriterionEntity;

public record QualificationReviewCriterionResponse(
        Long id,
        Long agencyId,
        String ruleCode,
        String revisionNo,
        String effectiveDate,
        String legalBasis,
        BigDecimal technicalWeight,
        BigDecimal priceWeight,
        String decisionMethod,
        BigDecimal thresholdRatio,
        boolean useYn,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {

    public static QualificationReviewCriterionResponse from(QualificationReviewCriterionEntity entity) {
        return new QualificationReviewCriterionResponse(
                entity.getId(),
                entity.getAgencyId(),
                entity.getRuleCode(),
                entity.getRevisionNo(),
                entity.getEffectiveDate(),
                entity.getLegalBasis(),
                entity.getTechnicalWeight(),
                entity.getPriceWeight(),
                entity.getDecisionMethod(),
                entity.getThresholdRatio(),
                entity.isUseYn(),
                entity.getCreatedAt() == null ? null : entity.getCreatedAt().toString(),
                entity.getCreatedId(),
                entity.getLastChangedAt() == null ? null : entity.getLastChangedAt().toString(),
                entity.getLastChangedId()
        );
    }
}
