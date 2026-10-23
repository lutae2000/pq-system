package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentCommand;

public record NewTechnologyInvestmentRequest(
        @NotBlank @Pattern(regexp = "\\d{4}") String investmentYear,
        @PositiveOrZero BigDecimal revenue,
        @PositiveOrZero BigDecimal totalAssets,
        @PositiveOrZero BigDecimal equityCapital,
        @PositiveOrZero BigDecimal currentLiabilities,
        @PositiveOrZero BigDecimal fixedLiabilities,
        @PositiveOrZero BigDecimal currentAssets,
        BigDecimal netIncome,
        @PositiveOrZero BigDecimal totalLiabilities,
        @PositiveOrZero BigDecimal technologyDevelopmentInvestment,
        @Size(max = 1000) String remark
) {
    public NewTechnologyInvestmentCommand toCommand() {
        return new NewTechnologyInvestmentCommand(investmentYear, revenue, totalAssets, equityCapital,
                currentLiabilities, fixedLiabilities, currentAssets, netIncome, totalLiabilities,
                technologyDevelopmentInvestment, remark);
    }
}
