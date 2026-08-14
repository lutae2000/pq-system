package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

public record NewTechnologyInvestmentRequest(
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
        String remark
) {
}
