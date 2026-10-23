package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public record CompanyFinancialStatusRequest(
        @NotNull Integer fiscalYear,
        BigDecimal capitalAmountMillion,
        BigDecimal salesAmountMillion,
        BigDecimal debtRatio,
        BigDecimal currentRatio,
        String creditRating,
        LocalDate registeredOn,
        String note
) {
    public CompanyProfileUseCase.FinancialStatusCommand toCommand() {
        return new CompanyProfileUseCase.FinancialStatusCommand(
                fiscalYear, capitalAmountMillion, salesAmountMillion, debtRatio, currentRatio,
                creditRating, registeredOn, note
        );
    }
}
