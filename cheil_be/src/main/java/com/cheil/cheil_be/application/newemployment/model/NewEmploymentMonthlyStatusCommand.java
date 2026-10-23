package com.cheil.cheil_be.application.newemployment.model;

public record NewEmploymentMonthlyStatusCommand(
        String baseYearMonth,
        Integer employeeCount,
        Integer newHireCount
) {
}
