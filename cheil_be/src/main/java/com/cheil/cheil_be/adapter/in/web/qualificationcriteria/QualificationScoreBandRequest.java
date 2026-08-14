package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

import java.math.BigDecimal;

public record QualificationScoreBandRequest(
        Long criterionId,
        Integer sortOrder,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String priceText,
        BigDecimal passScore,
        BigDecimal technicalScore,
        BigDecimal careerScore,
        BigDecimal regionScore,
        BigDecimal managementScore,
        BigDecimal priceScore,
        BigDecimal priceMultiplier,
        String priceFormula,
        BigDecimal technicalAverageScore,
        BigDecimal totalAverageScore,
        BigDecimal lowestBidPrice,
        BigDecimal pqAvailableScore,
        Boolean useYn,
        String remark
) {
}
