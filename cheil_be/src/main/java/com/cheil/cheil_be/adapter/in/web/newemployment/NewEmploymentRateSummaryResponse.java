package com.cheil.cheil_be.adapter.in.web.newemployment;

import java.math.BigDecimal;

public record NewEmploymentRateSummaryResponse(
        Integer recentYearNewHireCount,
        BigDecimal samePeriodAverageEmployeeCount,
        BigDecimal recentYearMonthlyAverageEmployeeCount,
        BigDecimal samePeriodRate,
        BigDecimal recentYearRate
) {
}
