package com.cheil.cheil_be.adapter.in.web.qualificationcriteria;

import java.math.BigDecimal;

import com.cheil.cheil_be.adapter.out.persistence.qualificationcriteria.QualificationScoreBandEntity;

public record QualificationScoreBandResponse(
        Long id,
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
        boolean useYn,
        String remark,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {

    public static QualificationScoreBandResponse from(QualificationScoreBandEntity entity) {
        return new QualificationScoreBandResponse(
                entity.getId(),
                entity.getCriterionId(),
                entity.getSortOrder(),
                entity.getMinPrice(),
                entity.getMaxPrice(),
                entity.getPriceText(),
                entity.getPassScore(),
                entity.getTechnicalScore(),
                entity.getCareerScore(),
                entity.getRegionScore(),
                entity.getManagementScore(),
                entity.getPriceScore(),
                entity.getPriceMultiplier(),
                entity.getPriceFormula(),
                entity.getTechnicalAverageScore(),
                entity.getTotalAverageScore(),
                entity.getLowestBidPrice(),
                entity.getPqAvailableScore(),
                entity.isUseYn(),
                entity.getRemark(),
                entity.getCreatedAt() == null ? null : entity.getCreatedAt().toString(),
                entity.getCreatedId(),
                entity.getLastChangedAt() == null ? null : entity.getLastChangedAt().toString(),
                entity.getLastChangedId()
        );
    }
}
