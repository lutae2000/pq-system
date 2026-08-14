package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.adapter.out.persistence.companyprofile.CompanyFinancialStatusEntity;

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

    public static CompanyFinancialStatusResponse from(CompanyFinancialStatusEntity entity) {
        return new CompanyFinancialStatusResponse(
                entity.getFinancialId(),
                entity.getFiscalYear(),
                entity.getCapitalAmountMillion(),
                entity.getSalesAmountMillion(),
                entity.getDebtRatio(),
                entity.getCurrentRatio(),
                entity.getCreditRating(),
                entity.getRegisteredOn(),
                entity.getNote(),
                entity.getCreatedAt(),
                entity.getCreatedId()
        );
    }
}
