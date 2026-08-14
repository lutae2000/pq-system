package com.cheil.cheil_be.adapter.in.web.companyprofile;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CompanyFinancialStatusRequest(
        Integer fiscalYear,
        BigDecimal capitalAmountMillion,
        BigDecimal salesAmountMillion,
        BigDecimal debtRatio,
        BigDecimal currentRatio,
        String creditRating,
        LocalDate registeredOn,
        String note
) {
}
