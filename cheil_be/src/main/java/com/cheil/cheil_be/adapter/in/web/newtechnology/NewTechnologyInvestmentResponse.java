package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;
import java.time.Instant;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentView;

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
    public static NewTechnologyInvestmentResponse from(NewTechnologyInvestmentView view) {
        return new NewTechnologyInvestmentResponse(view.id(), view.investmentYear(), view.revenue(),
                view.totalAssets(), view.equityCapital(), view.currentLiabilities(), view.fixedLiabilities(),
                view.currentAssets(), view.netIncome(), view.totalLiabilities(),
                view.technologyDevelopmentInvestment(), view.technologyDevelopmentInvestmentRatio(),
                view.equityRatio(), view.returnOnEquity(), view.currentRatio(), view.debtRatio(), view.remark(),
                view.createdAt(), view.createdId(), view.lastChangedAt(), view.lastChangedId());
    }
}
