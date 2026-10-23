package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public record CompanyFinancialStatusResponse(
        Long financialId,
        Integer fiscalYear,
        BigDecimal capitalAmountMillion,
        BigDecimal salesAmountMillion,
        BigDecimal debtRatio,
        BigDecimal currentRatio,
        String creditRating,
        LocalDate registeredOn,
        String note,
        Instant createdAt,
        String createdId
) {

    public static CompanyFinancialStatusResponse from(CompanyProfileUseCase.FinancialStatus entity) {
        return new CompanyFinancialStatusResponse(
                entity.financialId(), entity.fiscalYear(), entity.capitalAmountMillion(),
                entity.salesAmountMillion(), entity.debtRatio(), entity.currentRatio(), entity.creditRating(),
                entity.registeredOn(), entity.note(), entity.createdAt(), entity.createdId()
        );
    }
}
