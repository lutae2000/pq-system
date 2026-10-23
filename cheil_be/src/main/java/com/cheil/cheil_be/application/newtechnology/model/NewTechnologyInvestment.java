package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;
import java.time.Instant;

public record NewTechnologyInvestment(
        Long id,
        String investmentYear,
        BigDecimal revenue,
        BigDecimal totalAssets,
        BigDecimal equityCapital,
        BigDecimal currentLiabilities,
        BigDecimal fixedLiabilities,
        BigDecimal currentAssets,
        BigDecimal netIncome,
        BigDecimal totalLiabilities,
        BigDecimal technologyDevelopmentInvestment,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
