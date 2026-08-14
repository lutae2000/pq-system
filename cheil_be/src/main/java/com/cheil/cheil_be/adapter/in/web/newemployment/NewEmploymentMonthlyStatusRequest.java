package com.cheil.cheil_be.adapter.in.web.newemployment;

public record NewEmploymentMonthlyStatusRequest(
        String baseYearMonth,
        Integer employeeCount,
        Integer newHireCount
) {
}
