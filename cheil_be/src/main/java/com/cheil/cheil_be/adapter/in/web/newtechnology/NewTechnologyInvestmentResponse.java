package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;
import java.time.Instant;

public record NewTechnologyInvestmentResponse(
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
        BigDecimal technologyDevelopmentInvestmentRatio,
        BigDecimal equityRatio,
        BigDecimal returnOnEquity,
        BigDecimal currentRatio,
        BigDecimal debtRatio,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
