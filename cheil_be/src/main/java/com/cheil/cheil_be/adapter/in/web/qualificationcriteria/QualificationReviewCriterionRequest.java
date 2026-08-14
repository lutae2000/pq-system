package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

import java.math.BigDecimal;

public record QualificationReviewCriterionRequest(
        Long agencyId,
        String ruleCode,
        String revisionNo,
        String effectiveDate,
        String legalBasis,
        BigDecimal technicalWeight,
        BigDecimal priceWeight,
        String decisionMethod,
        BigDecimal thresholdRatio,
        Boolean useYn
) {
}
