package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;

public record NewTechnologyInvestmentCommand(
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
